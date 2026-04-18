// ISO weekday: 1=Mon ... 7=Sun, matching JSON stored in applicable_days.

const WEEKDAYS = [
  { value: 1, short: '一', label: '週一' },
  { value: 2, short: '二', label: '週二' },
  { value: 3, short: '三', label: '週三' },
  { value: 4, short: '四', label: '週四' },
  { value: 5, short: '五', label: '週五' },
  { value: 6, short: '六', label: '週六' },
  { value: 7, short: '日', label: '週日' }
];

function todayIsoWeekday(date = new Date()) {
  // Date.getDay(): 0=Sun..6=Sat  -> convert to 1=Mon..7=Sun
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

module.exports = { WEEKDAYS, todayIsoWeekday };
