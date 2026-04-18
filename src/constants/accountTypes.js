// Maps `financial_accounts.account_type` INT <-> human metadata.

const ACCOUNT_TYPE = Object.freeze({
  BANK_ACCOUNT:   1,
  CREDIT_CARD:    2,
  DEBIT_CARD:     3,
  MOBILE_PAYMENT: 4
});

const ACCOUNT_TYPE_META = Object.freeze({
  [ACCOUNT_TYPE.BANK_ACCOUNT]:   { code: 'BANK_ACCOUNT',   label: '銀行帳戶', emoji: '🏦', accent: 'bg-emerald-500' },
  [ACCOUNT_TYPE.CREDIT_CARD]:    { code: 'CREDIT_CARD',    label: '信用卡',   emoji: '💳', accent: 'bg-brand-600'   },
  [ACCOUNT_TYPE.DEBIT_CARD]:     { code: 'DEBIT_CARD',     label: 'Debit 卡', emoji: '💵', accent: 'bg-indigo-500'  },
  [ACCOUNT_TYPE.MOBILE_PAYMENT]: { code: 'MOBILE_PAYMENT', label: '行動支付', emoji: '📱', accent: 'bg-amber-500'   }
});

const ACCOUNT_TYPE_OPTIONS = Object.values(ACCOUNT_TYPE).map((v) => ({
  value: v,
  label: ACCOUNT_TYPE_META[v].label,
  emoji: ACCOUNT_TYPE_META[v].emoji,
  code:  ACCOUNT_TYPE_META[v].code
}));

function accountTypeLabel(value) {
  return ACCOUNT_TYPE_META[value]?.label || '—';
}
function accountTypeCode(value) {
  return ACCOUNT_TYPE_META[value]?.code || 'UNKNOWN';
}

module.exports = {
  ACCOUNT_TYPE,
  ACCOUNT_TYPE_META,
  ACCOUNT_TYPE_OPTIONS,
  accountTypeLabel,
  accountTypeCode
};
