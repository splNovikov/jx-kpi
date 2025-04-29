function parseMonthString(monthString) {
  return new Date(monthString + " 1");
}

function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

// Export as global functions
Object.assign(this, {
  parseMonthString,
  isDateInRange
}); 