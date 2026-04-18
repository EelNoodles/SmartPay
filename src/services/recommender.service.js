// AI-powered best-payment recommender.
//
// Token-cost optimizations used here:
//   1. Context Caching (explicit):
//        The long, stable system instructions + scoring rubric live in a
//        cached content block that is reused across requests for up to
//        GEMINI_CACHE_TTL_SECONDS. Only the small per-request "situation"
//        payload is sent on each call.
//   2. Implicit data slimming:
//        listForPrompt / listActiveForPrompt strip image_path, descriptions
//        and other verbose columns before serialization.
//   3. Strict JSON schema via response_mime_type + responseSchema so the
//        model never wastes tokens on markdown / prose.
//
// If the cache API is unavailable (e.g. older SDK), the service falls back
// to sending the system instruction inline — the prompt is still optimized.

const { genAI, cacheManager, MODEL, CACHE_TTL } = require('./geminiClient');
const { accountTypeCode } = require('../constants/accountTypes');
const { rewardCapPeriodCode } = require('../constants/rewardCapPeriods');
const { todayIsoWeekday } = require('../constants/weekdays');

const FinancialAccount = require('../models/FinancialAccount');
const RewardCampaign   = require('../models/RewardCampaign');

const RECOMMENDER_SYSTEM = [
  '你是台灣支付回饋的頂尖顧問。根據使用者提供的「消費情境、金額、日期」',
  '以及他所有的金融工具 (financial_accounts) 與有效活動 (reward_campaigns)，',
  '推薦「最佳前三名」支付組合，並精準試算回饋。',
  '',
  '試算規則：',
  '- 基礎回饋金額 = 消費金額 × reward_rate(%)。',
  '- 若 min_spend_amount 存在且 消費金額 < min_spend_amount，視為未達低消，',
  '  該活動不可加計回饋，且必須在 warnings 中提示。',
  '- reward_cap_period = PER_TRANSACTION 時，單筆回饋金額上限為 reward_cap_amount。',
  '- reward_cap_period = MONTHLY / CAMPAIGN_TOTAL 時，因不知道歷史累積，',
  '  視為本筆仍可取得，但在 warnings 註記「每月/活動總額上限 = X 元，請留意剩餘額度」。',
  '- 若 applicable_days 為空陣列，視為全週適用；若不為空且今日 ISO weekday 不在清單中，',
  '  不計入回饋，並在 warnings 中提示「今日不適用」。',
  '- 若 target_merchants 不為空，且使用者情境/店家未匹配任何項目，',
  '  不計入回饋，並在 warnings 中提示「此活動僅限指定通路」。',
  '- requires_registration = true 時，必須在 warnings 中提示「需事前登錄活動」。',
  '- is_quota_limited = true 時，警告「活動有名額限制，請儘早使用」。',
  '- requires_plan_switch = true 時，必須在 warnings 中提示「需先切換方案/權益至 <required_plan_name>」',
  '  （若 required_plan_name 為 null，則提示「需先切換至指定方案/權益」）；此為支付注意事項。',
  '',
  '輸出格式：',
  '- 僅輸出 JSON，完全符合提供的 schema，不要任何多餘文字。',
  '- 排名 1~3，estimated_rate 為百分比數字，estimated_reward 為新台幣金額（小數最多 2 位）。',
  '- reasoning 用繁體中文，簡潔有力。'
].join('\n');

const responseSchema = {
  type: 'object',
  properties: {
    recommendations: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          rank:               { type: 'integer', minimum: 1, maximum: 3 },
          account_id:         { type: 'integer' },
          campaign_id:        { type: 'integer', nullable: true },
          payment_label:      { type: 'string' },
          estimated_rate:     { type: 'number' },
          estimated_reward:   { type: 'number' },
          warnings:           { type: 'array', items: { type: 'string' } },
          reasoning:          { type: 'string' }
        },
        required: [
          'rank', 'account_id', 'payment_label',
          'estimated_rate', 'estimated_reward', 'warnings', 'reasoning'
        ]
      }
    }
  },
  required: ['recommendations']
};

// --- Cache handle (in-memory, process-wide) -----------------------------
let cachedSystemHandle = null;       // { name, expireAt }
async function getOrCreateSystemCache() {
  if (!cacheManager) return null;
  const now = Date.now();
  if (cachedSystemHandle && cachedSystemHandle.expireAt > now + 30_000) {
    return cachedSystemHandle.name;
  }
  try {
    const created = await cacheManager.create({
      model: `models/${MODEL}`,
      systemInstruction: {
        role: 'system',
        parts: [{ text: RECOMMENDER_SYSTEM }]
      },
      ttlSeconds: CACHE_TTL
    });
    cachedSystemHandle = {
      name: created.name,
      expireAt: now + CACHE_TTL * 1000
    };
    return created.name;
  } catch (err) {
    // Caching has a minimum-token threshold; if the prompt is too small
    // the API refuses. That's fine — we just inline the instructions.
    console.warn('[SmartPay] Context cache disabled:', err.message);
    return null;
  }
}

// --- Prompt compaction --------------------------------------------------
function compactAccount(a) {
  return {
    id: a.id,
    type: accountTypeCode(a.account_type),
    provider: a.bank_or_provider_name,
    name: a.card_or_account_name,
    last4: a.last_four_digits || null
  };
}

function compactCampaign(c) {
  return {
    id: c.id,
    account_id: c.financial_account_id,
    name: c.campaign_name,
    rate: Number(c.reward_rate),
    cap_amount: c.reward_cap_amount == null ? null : Number(c.reward_cap_amount),
    cap_period: rewardCapPeriodCode(c.reward_cap_period),
    min_spend:  c.min_spend_amount == null ? null : Number(c.min_spend_amount),
    days:       c.applicable_days || [],
    merchants:  c.target_merchants || [],
    needs_reg:  !!c.requires_registration,
    quota:      !!c.is_quota_limited,
    plan_switch: !!c.requires_plan_switch,
    plan_name:   c.required_plan_name || null
  };
}

async function buildRecommendations({ userId, scenario, amount }, signal) {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const weekday  = todayIsoWeekday(today);

  const [accounts, campaigns] = await Promise.all([
    FinancialAccount.listForPrompt(userId),
    RewardCampaign.listActiveForPrompt(userId, todayIso)
  ]);

  if (accounts.length === 0) {
    return {
      recommendations: [],
      context: { scenario, amount, todayIso, weekday, accountCount: 0, campaignCount: 0 }
    };
  }

  const payload = {
    today: todayIso,
    weekday,
    scenario: (scenario || '').slice(0, 200),
    amount: Number(amount) || 0,
    accounts: accounts.map(compactAccount),
    campaigns: campaigns.map(compactCampaign)
  };

  const cachedContent = await getOrCreateSystemCache();

  const modelOptions = {
    model: MODEL,
    generationConfig: {
      temperature: 0.2,
      response_mime_type: 'application/json',
      responseSchema
    }
  };
  if (cachedContent) {
    modelOptions.cachedContent = cachedContent;
  } else {
    modelOptions.systemInstruction = RECOMMENDER_SYSTEM;
  }

  const model = genAI.getGenerativeModel(modelOptions);

  const userTurn = [
    '請依下列 JSON 情境產出最佳前三名推薦：',
    JSON.stringify(payload)
  ].join('\n');

  const generateOptions = signal ? { signal } : {};
  const result = await model.generateContent(userTurn, generateOptions);
  const text = result.response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error('AI 推薦回傳格式錯誤，請稍後再試。');
  }

  const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  recs.sort((a, b) => a.rank - b.rank);

  return {
    recommendations: recs.slice(0, 3),
    context: {
      scenario,
      amount: Number(amount) || 0,
      todayIso,
      weekday,
      accountCount: accounts.length,
      campaignCount: campaigns.length,
      usedCache: !!cachedContent
    }
  };
}

module.exports = { buildRecommendations };
