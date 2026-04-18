// Maps `reward_campaigns.reward_cap_period` INT <-> human label.

const REWARD_CAP_PERIOD = Object.freeze({
  NONE:            0,
  PER_TRANSACTION: 1,
  MONTHLY:         2,
  CAMPAIGN_TOTAL:  3
});

const REWARD_CAP_PERIOD_META = Object.freeze({
  [REWARD_CAP_PERIOD.NONE]:            { code: 'NONE',            label: '無上限' },
  [REWARD_CAP_PERIOD.PER_TRANSACTION]: { code: 'PER_TRANSACTION', label: '單筆上限' },
  [REWARD_CAP_PERIOD.MONTHLY]:         { code: 'MONTHLY',         label: '每月上限' },
  [REWARD_CAP_PERIOD.CAMPAIGN_TOTAL]:  { code: 'CAMPAIGN_TOTAL',  label: '活動總上限' }
});

const REWARD_CAP_PERIOD_OPTIONS = Object.values(REWARD_CAP_PERIOD).map((v) => ({
  value: v,
  label: REWARD_CAP_PERIOD_META[v].label,
  code:  REWARD_CAP_PERIOD_META[v].code
}));

function rewardCapPeriodLabel(value) {
  return REWARD_CAP_PERIOD_META[value]?.label || '—';
}
function rewardCapPeriodCode(value) {
  return REWARD_CAP_PERIOD_META[value]?.code || 'NONE';
}

module.exports = {
  REWARD_CAP_PERIOD,
  REWARD_CAP_PERIOD_META,
  REWARD_CAP_PERIOD_OPTIONS,
  rewardCapPeriodLabel,
  rewardCapPeriodCode
};
