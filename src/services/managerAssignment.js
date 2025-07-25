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

function prepareManagerDataCache(managerData) {
  const cache = new Map();
  const indices = {
    account: findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.ACCOUNT),
    startDate: findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.START_DATE),
    endDate: findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.END_DATE),
    name: findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.NAME)
  };

  managerData.rows.forEach(row => {
    const account = row[indices.account];
    if (!cache.has(account)) {
      cache.set(account, []);
    }
    cache.get(account).push(row);
  });

  return { cache, indices };
}

function findManagersForAccount(account, monthDate, managerData) {
  // If we have cached data, use it
  if (managerData.cache) {
    const accountManagers = managerData.cache.get(account) || [];
    return accountManagers.filter(managerRow => {
      const startDate = new Date(managerRow[managerData.indices.startDate]);
      const endDate = new Date(managerRow[managerData.indices.endDate]);
      return isDateInRange(monthDate, startDate, endDate);
    });
  }

  // Fallback to original implementation if no cache
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

function getSheet(sheetName) {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  return sSheet.getSheetByName(sheetName);
}

function prepareInconsistencySheet() {
  let inconsistencySheet = getSheet(SHEET_NAMES.MANAGER_INCONSISTENCY);

  if (!inconsistencySheet) {
    const sSheet = SpreadsheetApp.getActiveSpreadsheet();
    inconsistencySheet = sSheet.insertSheet(SHEET_NAMES.MANAGER_INCONSISTENCY);
    clearSheetCache(); // Clear the cache after inserting a new sheet
  } else {
    // Clear existing data including headers
    inconsistencySheet.clear();
    clearSheetCache(); // Clear the cache after clearing the sheet
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
  const inconsistencySheet = getSheet(SHEET_NAMES.MANAGER_INCONSISTENCY);

  // Format the data for logging
  const issue = matchedManagers.length === 0 ? "No manager assigned" : "Multiple managers assigned";

  // Get the current Assignment ID
  const currentAssignmentId = allInRow[allInIndices.assignmentId];
  if (!currentAssignmentId) {
    Logger.log(`Error: No assignment ID found in row: ${JSON.stringify(allInRow)}`);
    return;
  }

  // Get the current last row
  const lastRow = inconsistencySheet.getLastRow();

  // Add blank row if needed
  if (lastRow > 1) {
    const lastRowData = inconsistencySheet.getRange(lastRow, 1, 1, 12).getValues()[0];
    const lastAssignmentId = lastRowData[2];
    const isBlankRow = lastRowData.every(cell => cell === " ");

    if (!isBlankRow && lastAssignmentId !== currentAssignmentId) {
      const blankRow = Array(12).fill(" ");
      inconsistencySheet.getRange(lastRow + 1, 1, 1, 12).setValues([blankRow]);
    }
  }

  // Prepare all rows to be added
  const newRows = matchedManagers.map(managerRow => [
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
  ]);

  // Batch update all new rows
  const currentLastRow = inconsistencySheet.getLastRow();
  if (newRows.length > 0) {
    inconsistencySheet.getRange(currentLastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
}

function assignManagers() {
  // Initialize indices before processing
  initializeColumnIndices();

  const allInData = getSheetData(SHEET_NAMES.ALL_IN);
  const managerData = getSheetData(SHEET_NAMES.MANAGER_ASSIGNMENTS);

  const accountIndex = findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.ACCOUNT);
  const monthIndex = findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.MONTH);
  const managerIndex = findColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.MANAGER);

  // Prepare manager data with cache
  const { cache, indices } = prepareManagerDataCache(managerData);
  managerData.cache = cache;
  managerData.indices = indices;

  // Prepare batch updates
  const updates = [];

  allInData.rows.forEach((row) => {
    const account = row[accountIndex];

    // Check for special account mapping first
    if (SPECIAL_ACCOUNT_MANAGERS[account]) {
      updates.push([SPECIAL_ACCOUNT_MANAGERS[account]]);
      return;
    }

    if (SKIP_ACCOUNTS.includes(account)) {
      updates.push([""]);
      return;
    }

    const monthString = row[monthIndex];
    const monthDate = parseMonthString(monthString);
    const matchedManagers = findManagersForAccount(account, monthDate, managerData);
    const uniqueManagers = [...new Set(matchedManagers.map(row => row[managerData.indices.name]))];
    const managerValue = uniqueManagers.join(", ");

    updates.push([managerValue]);

    // Check for inconsistencies
    // if (matchedManagers.length !== 1) {
    //   // Log each inconsistency immediately to ensure proper ordering
    //   logManagerInconsistency(account, monthDate, matchedManagers, row);
    // }
  });

  // Batch update all cells at once
  const allInSheet = getSheet(SHEET_NAMES.ALL_IN);
  const range = allInSheet.getRange(2, managerIndex + 1, updates.length, 1);
  range.setValues(updates);
}

// Optimized version that works with cached data and returns results for batch operations
function assignManagersOptimized(dataManager) {
  Logger.log('Starting optimized manager assignment');
  
  const sourceData = dataManager.getSourceData(); // Изменено: теперь работаем с источником
  const managerCacheData = dataManager.getManagerCache();
  
  const accountIndex = dataManager.findColumnIndex(sourceData.header, COLUMN_NAMES.ALL_IN.ACCOUNT);
  const monthIndex = dataManager.findColumnIndex(sourceData.header, COLUMN_NAMES.ALL_IN.MONTH);

  // Prepare results array
  const results = [];

  sourceData.rows.forEach((row) => {
    const account = row[accountIndex];

    // Check for special account mapping first
    if (SPECIAL_ACCOUNT_MANAGERS[account]) {
      results.push([SPECIAL_ACCOUNT_MANAGERS[account]]);
      return;
    }

    if (SKIP_ACCOUNTS.includes(account)) {
      results.push(['']);
      return;
    }

    const monthString = row[monthIndex];
    const monthDate = parseMonthString(monthString);
    
    // Use cached manager data
    const accountManagers = managerCacheData.cache.get(account) || [];
    const matchedManagers = accountManagers.filter(managerRow => {
      const startDate = new Date(managerRow[managerCacheData.indices.startDate]);
      const endDate = new Date(managerRow[managerCacheData.indices.endDate]);
      return isDateInRange(monthDate, startDate, endDate);
    });

    const uniqueManagers = [...new Set(matchedManagers.map(row => row[managerCacheData.indices.name]))];
    const managerValue = uniqueManagers.join(", ");

    results.push([managerValue]);
  });

  Logger.log(`Optimized manager assignment completed. Processed ${results.length} rows`);
  return results;
}

function prepareOverlapSheet() {
  let overlapSheet = getSheet(SHEET_NAMES.MANAGER_OVERLAPS);

  if (!overlapSheet) {
    const sSheet = SpreadsheetApp.getActiveSpreadsheet();
    overlapSheet = sSheet.insertSheet(SHEET_NAMES.MANAGER_OVERLAPS);
    clearSheetCache();
  } else {
    overlapSheet.clear();
    clearSheetCache();
  }

  // Add headers
  const headers = [
    "Name",
    "Account",
    "Start Date",
    "End Date"
  ];
  overlapSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function findOverlappingAssignments() {
  // Initialize indices
  initializeColumnIndices();

  const managerData = getSheetData(SHEET_NAMES.MANAGER_ASSIGNMENTS);
  const { cache, indices } = prepareManagerDataCache(managerData);

  // Prepare overlap sheet
  prepareOverlapSheet();
  const overlapSheet = getSheet(SHEET_NAMES.MANAGER_OVERLAPS);

  // Process each account
  const overlaps = [];
  for (const [account, assignments] of cache) {
    // Skip if less than 2 assignments
    if (assignments.length < 2) continue;

    // Group assignments by manager name
    const assignmentsByManager = new Map();
    assignments.forEach(assignment => {
      const managerName = assignment[indices.name];
      if (!assignmentsByManager.has(managerName)) {
        assignmentsByManager.set(managerName, []);
      }
      assignmentsByManager.get(managerName).push(assignment);
    });

    // Skip if only one manager
    if (assignmentsByManager.size < 2) continue;

    // Check for overlaps between different managers
    let hasOverlap = false;
    const overlappingAssignments = new Set();

    // Compare assignments between different managers
    const managers = Array.from(assignmentsByManager.keys());
    for (let i = 0; i < managers.length - 1; i++) {
      for (let j = i + 1; j < managers.length; j++) {
        const manager1Assignments = assignmentsByManager.get(managers[i]);
        const manager2Assignments = assignmentsByManager.get(managers[j]);

        // Check each pair of assignments between the two managers
        for (const assignment1 of manager1Assignments) {
          for (const assignment2 of manager2Assignments) {
            const start1 = new Date(assignment1[indices.startDate]);
            const end1 = new Date(assignment1[indices.endDate]);
            const start2 = new Date(assignment2[indices.startDate]);
            const end2 = new Date(assignment2[indices.endDate]);

            // Check for overlap
            if (start1 <= end2 && start2 <= end1) {
              hasOverlap = true;
              overlappingAssignments.add(assignment1);
              overlappingAssignments.add(assignment2);
            }
          }
        }
      }
    }

    // If we found overlaps, add all overlapping assignments
    if (hasOverlap) {
      // Add all overlapping assignments
      Array.from(overlappingAssignments).forEach(assignment => {
        overlaps.push([
          assignment[indices.name],
          account,
          assignment[indices.startDate],
          assignment[indices.endDate]
        ]);
      });
      // Add empty line after each account group
      overlaps.push(["", "", "", ""]);
    }
  }

  // Write overlaps to sheet
  if (overlaps.length > 0) {
    overlapSheet.getRange(2, 1, overlaps.length, overlaps[0].length).setValues(overlaps);
  }
}
