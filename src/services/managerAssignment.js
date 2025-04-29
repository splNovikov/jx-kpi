import { SKIP_ACCOUNTS, SHEET_NAMES, COLUMN_NAMES } from '../constants/config.js';
import { getSheetData, updateCellValue } from '../utils/spreadsheet.js';
import { parseMonthString, isDateInRange } from '../utils/dateUtils.js';

function findColumnIndex(header, columnName) {
  return header.indexOf(columnName);
}

function findManagersForAccount(account, monthDate, managerData) {
  const { header, rows } = managerData;
  const accountIndex = findColumnIndex(header, COLUMN_NAMES.MANAGER.ACCOUNT);
  const startDateIndex = findColumnIndex(header, COLUMN_NAMES.MANAGER.START_DATE);
  const endDateIndex = findColumnIndex(header, COLUMN_NAMES.MANAGER.END_DATE);
  const nameIndex = findColumnIndex(header, COLUMN_NAMES.MANAGER.NAME);

  return rows
    .filter(row => {
      const managerAccount = row[accountIndex];
      const startDate = new Date(row[startDateIndex]);
      const endDate = new Date(row[endDateIndex]);

      return account === managerAccount && isDateInRange(monthDate, startDate, endDate);
    })
    .map(row => row[nameIndex]);
}

export function assignManagers() {
  const allInData = getSheetData(SHEET_NAMES.ALL_IN);
  const managerData = getSheetData(SHEET_NAMES.MANAGER_ASSIGNMENTS);

  const accountIndex = findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.ACCOUNT);
  const monthIndex = findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.MONTH);
  const managerIndex = findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.MANAGER);

  allInData.rows.forEach((row, i) => {
    const account = row[accountIndex];

    if (SKIP_ACCOUNTS.includes(account)) {
      updateCellValue(SHEET_NAMES.ALL_IN, i, managerIndex, "");
      return;
    }

    const monthString = row[monthIndex];
    const monthDate = parseMonthString(monthString);
    const matchedManagers = findManagersForAccount(account, monthDate, managerData);
    const uniqueManagers = [...new Set(matchedManagers)];
    const managerValue = uniqueManagers.join(", ");

    updateCellValue(SHEET_NAMES.ALL_IN, i, managerIndex, managerValue);
  });
} 