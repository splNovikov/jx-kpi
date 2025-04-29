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

function prepareInconsistencySheet() {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  let inconsistencySheet = sSheet.getSheetByName(SHEET_NAMES.MANAGER_INCONSISTENCY);

  if (!inconsistencySheet) {
    inconsistencySheet = sSheet.insertSheet(SHEET_NAMES.MANAGER_INCONSISTENCY);
  } else {
    // Clear existing data including headers
    inconsistencySheet.clear();
  }

  // Add headers
  const headers = [
    "Issue",
    COLUMN_NAMES.ALL_IN.MONTH,
    COLUMN_NAMES.ALL_IN.ASSIGNMENT_ID,
    COLUMN_NAMES.ALL_IN.NAME,
    COLUMN_NAMES.ALL_IN.ACCOUNT,
    COLUMN_NAMES.ALL_IN.START_DATE,
    COLUMN_NAMES.ALL_IN.END_DATE,
    COLUMN_NAMES.MANAGER.NAME,
    COLUMN_NAMES.MANAGER.ACCOUNT,
    COLUMN_NAMES.MANAGER.START_DATE,
    COLUMN_NAMES.MANAGER.END_DATE,
    COLUMN_NAMES.MANAGER.POSITION
  ];
  inconsistencySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function logManagerInconsistency(account, monthDate, matchedManagers, allInRow, managerData) {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  const inconsistencySheet = sSheet.getSheetByName(SHEET_NAMES.MANAGER_INCONSISTENCY);

  // Format the data for logging
  const issue = matchedManagers.length === 0 ? "No manager assigned" : "Multiple managers assigned";

  // Get indices for All In data columns
  const allInHeader = getSheetData(SHEET_NAMES.ALL_IN).header;
  const monthIndex = findColumnIndex(allInHeader, COLUMN_NAMES.ALL_IN.MONTH);
  const assignmentIdIndex = findColumnIndex(allInHeader, COLUMN_NAMES.ALL_IN.ASSIGNMENT_ID);
  const nameIndex = findColumnIndex(allInHeader, COLUMN_NAMES.ALL_IN.NAME);
  const accountIndex = findColumnIndex(allInHeader, COLUMN_NAMES.ALL_IN.ACCOUNT);
  const startDateIndex = findColumnIndex(allInHeader, COLUMN_NAMES.ALL_IN.START_DATE);
  const endDateIndex = findColumnIndex(allInHeader, COLUMN_NAMES.ALL_IN.END_DATE);

  // Get indices for Manager data columns
  const managerNameIndex = findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.NAME);
  const managerAccountIndex = findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.ACCOUNT);
  const managerStartDateIndex = findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.START_DATE);
  const managerEndDateIndex = findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.END_DATE);
  const managerPositionIndex = findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.POSITION);

  // Get all matching manager rows
  const matchingManagerRows = managerData.rows
    .filter(row => row[managerAccountIndex] === account);

  // For each matching manager row, create a separate inconsistency record
  matchingManagerRows.forEach(managerRow => {
    const newRow = [
      issue,
      allInRow[monthIndex],
      allInRow[assignmentIdIndex],
      allInRow[nameIndex],
      allInRow[accountIndex],
      allInRow[startDateIndex],
      allInRow[endDateIndex],
      managerRow[managerNameIndex],
      managerRow[managerAccountIndex],
      managerRow[managerStartDateIndex],
      managerRow[managerEndDateIndex],
      managerRow[managerPositionIndex]
    ];

    const lastRow = inconsistencySheet.getLastRow();
    inconsistencySheet.getRange(lastRow + 1, 1, 1, newRow.length).setValues([newRow]);
  });
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
