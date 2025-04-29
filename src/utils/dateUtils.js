export function parseMonthString(monthString) {
  return new Date(monthString + " 1");
}

export function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
} 