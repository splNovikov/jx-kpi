function findColumnIndex(header, columnName) {
  return header.indexOf(columnName);
}

function findManagersForAccount(account, monthDate, managerData) {
  const {header, rows} = managerData;
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

function logManagerInconsistency(account, monthDate, matchedManagers, allInRow, managerData) {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  let inconsistencySheet = sSheet.getSheetByName(SHEET_NAMES.MANAGER_INCONSISTENCY);
  
  // Create sheet if it doesn't exist
  if (!inconsistencySheet) {
    inconsistencySheet = sSheet.insertSheet(SHEET_NAMES.MANAGER_INCONSISTENCY);
    // Add headers
    const headers = [
      "Account",
      "Month",
      "Issue",
      "All In Data",
      "Manager Assignment Data"
    ];
    inconsistencySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    // Clear existing data except headers
    const lastRow = inconsistencySheet.getLastRow();
    if (lastRow > 1) {
      inconsistencySheet.getRange(2, 1, lastRow - 1, inconsistencySheet.getLastColumn()).clear();
    }
  }

  // Format the data for logging
  const issue = matchedManagers.length === 0 ? "No manager assigned" : "Multiple managers assigned";
  const allInData = allInRow.join(" | ");
  const managerDataStr = managerData.rows
    .filter(row => row[findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.ACCOUNT)] === account)
    .map(row => row.join(" | "))
    .join("\n");

  // Add the inconsistency record
  const newRow = [
    account,
    monthDate.toISOString().split('T')[0],
    issue,
    allInData,
    managerDataStr
  ];
  
  const lastRow = inconsistencySheet.getLastRow();
  inconsistencySheet.getRange(lastRow + 1, 1, 1, newRow.length).setValues([newRow]);
}

function assignManagers() {
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

    // Check for inconsistencies
    if (matchedManagers.length !== 1) {
      logManagerInconsistency(account, monthDate, matchedManagers, row, managerData);
    }

    updateCellValue(SHEET_NAMES.ALL_IN, i, managerIndex, managerValue);
  });
}
