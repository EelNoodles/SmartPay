// Parse long official campaign rule text into the reward_campaigns schema
// via Gemini with a strict JSON schema response.
//
// Token-saving techniques used:
//   1. Short system instruction focused purely on extraction.
//   2. response_mime_type = "application/json" so the model emits pure JSON.
//   3. responseSchema locks the output keys so no extra prose is generated.

const { genAI, MODEL } = require('./geminiClient');
const {
  REWARD_CAP_PERIOD,
  REWARD_CAP_PERIOD_META
} = require('../constants/rewardCapPeriods');

const SYSTEM_INSTRUCTION = [
  '你是台灣金融回饋活動的資深分析師。',
  '任務：將使用者提供的冗長官方活動規則文字，精確抽取為結構化 JSON。',
  '規則：',
  '- 僅輸出 JSON，禁止任何多餘文字、markdown、code fence。',
  '- 回饋率以百分比「數字」表示（例：5 代表 5%）。',
  '- reward_cap_period 必須使用指定代碼：NONE / PER_TRANSACTION / MONTHLY / CAMPAIGN_TOTAL。',
  '- applicable_days 使用 ISO 星期編號 1~7（1=週一、7=週日）。若全週皆可則為空陣列 []。',
  '- 若某欄位無法從文字判讀，請填 null（數值、日期）或空陣列（清單）。',
  '- target_merchants 僅列指定通路/店家名稱，不要放一般描述。',
  '- 日期格式 YYYY-MM-DD。'
].join('\n');

const responseSchema = {
  type: 'object',
  properties: {
    campaign_name:         { type: 'string' },
    start_date:            { type: 'string', nullable: true },
    end_date:              { type: 'string', nullable: true },
    reward_rate:           { type: 'number' },
    reward_cap_amount:     { type: 'number', nullable: true },
    reward_cap_period:     { type: 'string', enum: ['NONE', 'PER_TRANSACTION', 'MONTHLY', 'CAMPAIGN_TOTAL'] },
    min_spend_amount:      { type: 'number', nullable: true },
    applicable_days:       { type: 'array', items: { type: 'integer', minimum: 1, maximum: 7 } },
    target_merchants:      { type: 'array', items: { type: 'string' } },
    requires_registration: { type: 'boolean' },
    is_quota_limited:      { type: 'boolean' }
  },
  required: [
    'campaign_name',
    'reward_rate',
    'reward_cap_period',
    'applicable_days',
    'target_merchants',
    'requires_registration',
    'is_quota_limited'
  ]
};

function codeToPeriodInt(code) {
  const entry = Object.entries(REWARD_CAP_PERIOD_META)
    .find(([, meta]) => meta.code === code);
  return entry ? Number(entry[0]) : REWARD_CAP_PERIOD.NONE;
}

async function parseCampaignRules(rawText) {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json',
      responseSchema
    }
  });

  const prompt = [
    '以下是官方活動規則原文，請依照指定結構抽取為 JSON：',
    '---',
    rawText.trim()
  ].join('\n');

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error('AI 回傳格式不是有效 JSON，請再試一次。');
  }

  return {
    campaign_name:         parsed.campaign_name || '未命名活動',
    start_date:            parsed.start_date || null,
    end_date:              parsed.end_date || null,
    reward_rate:           Number(parsed.reward_rate || 0),
    reward_cap_amount:     parsed.reward_cap_amount == null ? null : Number(parsed.reward_cap_amount),
    reward_cap_period:     codeToPeriodInt(parsed.reward_cap_period || 'NONE'),
    min_spend_amount:      parsed.min_spend_amount == null ? null : Number(parsed.min_spend_amount),
    applicable_days:       Array.isArray(parsed.applicable_days) ? parsed.applicable_days : [],
    target_merchants:      Array.isArray(parsed.target_merchants) ? parsed.target_merchants : [],
    requires_registration: !!parsed.requires_registration,
    is_quota_limited:      !!parsed.is_quota_limited
  };
}

module.exports = { parseCampaignRules };
