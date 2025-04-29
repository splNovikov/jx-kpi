// Module-level variables for storing column indices
let allInIndices = null;
let managerIndices = null;

function initializeColumnIndices() {
  const allInData = getSheetData(SHEET_NAMES.ALL_IN);
  const managerData = getSheetData(SHEET_NAMES.MANAGER_ASSIGNMENTS);

  allInIndices = {
    month: findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.MONTH),
    assignmentId: findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.ASSIGNMENT_ID),
    name: findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.NAME),
    account: findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.ACCOUNT),
    startDate: findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.START_DATE),
    endDate: findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.END_DATE)
  };

  managerIndices = {
    name: findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.NAME),
    account: findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.ACCOUNT),
    startDate: findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.START_DATE),
    endDate: findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.END_DATE),
    position: findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.POSITION)
  };
}

function findColumnIndex(header, columnName) {
  if (!header) {
    Logger.log(`Error: Header is undefined when looking for column: ${columnName}`);
    return -1;
  }
  if (!columnName) {
    Logger.log(`Error: Column name is undefined. Full COLUMN_NAMES object: ${JSON.stringify(COLUMN_NAMES)}`);
    return -1;
  }
  const index = header.indexOf(columnName);
  if (index === -1) {
    Logger.log(`Warning: Column '${columnName}' not found in header: ${JSON.stringify(header)}`);
  }
  return index;
}

function findManagersForAccount(account, monthDate, managerData) {
  const {header, rows} = managerData;
  const accountIndex = findColumnIndex(header, COLUMN_NAMES.MANAGER.ACCOUNT);
  const startDateIndex = findColumnIndex(header, COLUMN_NAMES.MANAGER.START_DATE);
  const endDateIndex = findColumnIndex(header, COLUMN_NAMES.MANAGER.END_DATE);

  return rows
    .filter(row => {
      const managerAccount = row[accountIndex];
      const startDate = new Date(row[startDateIndex]);
      const endDate = new Date(row[endDateIndex]);

      return account === managerAccount && isDateInRange(monthDate, startDate, endDate);
    });
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

function logManagerInconsistency(account, monthDate, matchedManagers, allInRow) {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  const inconsistencySheet = sSheet.getSheetByName(SHEET_NAMES.MANAGER_INCONSISTENCY);

  // Format the data for logging
  const issue = matchedManagers.length === 0 ? "No manager assigned" : "Multiple managers assigned";

  // Get the current Assignment ID
  const currentAssignmentId = allInRow[allInIndices.assignmentId];
  if (!currentAssignmentId) {
    Logger.log(`Error: No assignment ID found in row: ${JSON.stringify(allInRow)}`);
    return;
  }

  // Check if this is a new assignment ID and add blank row if needed
  const lastRow = inconsistencySheet.getLastRow();

  if (lastRow > 1) { // Skip header row
    const lastRowData = inconsistencySheet.getRange(lastRow, 1, 1, 12).getValues()[0];
    const lastAssignmentId = lastRowData[2]; // Assignment ID is in column 3
    
    // Skip blank row check if the last row is a blank row (all cells are spaces)
    const isBlankRow = lastRowData.every(cell => cell === " ");
    if (!isBlankRow && lastAssignmentId !== currentAssignmentId) {
      // Add blank row with a single space to ensure it's actually added
      const blankRow = Array(12).fill(" ");
      inconsistencySheet.getRange(lastRow + 1, 1, 1, 12).setValues([blankRow]);
      // Force a refresh of the sheet
      SpreadsheetApp.flush();
    }
  }

  // For each matched manager, create a separate inconsistency record
  matchedManagers.forEach(managerRow => {
    const newRow = [
      issue,
      allInRow[allInIndices.month],
      currentAssignmentId,
      allInRow[allInIndices.name],
      allInRow[allInIndices.account],
      allInRow[allInIndices.startDate],
      allInRow[allInIndices.endDate],
      managerRow[managerIndices.name],
      managerRow[managerIndices.account],
      managerRow[managerIndices.startDate],
      managerRow[managerIndices.endDate],
      managerRow[managerIndices.position]
    ];

    // Get the current last row (which might have changed if we added a blank row)
    const currentLastRow = inconsistencySheet.getLastRow();
    inconsistencySheet.getRange(currentLastRow + 1, 1, 1, newRow.length).setValues([newRow]);
    // Force a refresh of the sheet
    SpreadsheetApp.flush();
  });
}

function assignManagers() {
  // Initialize indices before processing
  initializeColumnIndices();

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
    const uniqueManagers = [...new Set(matchedManagers.map(row => row[findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.NAME)]))];
    const managerValue = uniqueManagers.join(", ");

    // Check for inconsistencies
    if (matchedManagers.length !== 1) {
      logManagerInconsistency(account, monthDate, matchedManagers, row);
    }

    updateCellValue(SHEET_NAMES.ALL_IN, i, managerIndex, managerValue);
  });
}
