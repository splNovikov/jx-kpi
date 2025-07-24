// Module-level variables for storing column indices (prefixed to avoid conflicts)
let accountTypeAllInIndices = null;
let accountBillabilityIndices = null;

function initializeAccountTypeColumnIndices() {
  const allInData = getSheetData(SHEET_NAMES.ALL_IN);
  const accountBillabilityData = getSheetData(SHEET_NAMES.ACCOUNT_BILLABILITY_TYPES);

  accountTypeAllInIndices = {
    account: findAccountTypeColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.ACCOUNT),
    accountType: findAccountTypeColumnIndex(allInData.header, COLUMN_NAMES.ALL_IN.ACCOUNT_TYPE)
  };

  // Build indices for all columns in Account Billability Types sheet
  accountBillabilityIndices = {};
  accountBillabilityData.header.forEach((columnName, index) => {
    if (columnName && columnName.trim() !== '') {
      accountBillabilityIndices[columnName] = index;
    }
  });

}

function findAccountTypeColumnIndex(header, columnName) {
  if (!header) {
    Logger.log(`Error: Header is undefined when looking for column: ${columnName}`);
    return -1;
  }
  if (!columnName) {
    Logger.log(`Error: Column name is undefined`);
    return -1;
  }
  const index = header.indexOf(columnName);
  if (index === -1) {
    Logger.log(`Warning: Column '${columnName}' not found in header: ${JSON.stringify(header)}`);
  }
  return index;
}

function prepareAccountBillabilityCache(accountBillabilityData) {
  const cache = new Map();

  // For each column (except empty ones), collect all account names
  Object.keys(accountBillabilityIndices).forEach(columnName => {
    const columnIndex = accountBillabilityIndices[columnName];
    const accountsInColumn = [];

    accountBillabilityData.rows.forEach(row => {
      const accountName = row[columnIndex];
      if (accountName && accountName.toString().trim() !== '') {
        accountsInColumn.push(accountName.toString().trim());
      }
    });

    // Map each account to its column type
    accountsInColumn.forEach(accountName => {
      if (!cache.has(accountName)) {
        cache.set(accountName, []);
      }
      cache.get(accountName).push(columnName);
    });
  });

  return cache;
}

function findAccountTypeForAccount(account, accountBillabilityCache) {
  if (!account || account.toString().trim() === '') {
    return '';
  }

  const accountName = account.toString().trim();
  const accountTypes = accountBillabilityCache.get(accountName) || [];

  // Return the first matching type, or empty string if no match
  if (accountTypes.length > 0) {
    return accountTypes[0]; // Return the first match
  }

  Logger.log(`Account '${accountName}' not found in any billability type`);
  return '';
}

function assignAccountTypes() {
  Logger.log('Starting account type assignment');
  
  // Initialize indices before processing
  initializeAccountTypeColumnIndices();

  const allInData = getSheetData(SHEET_NAMES.ALL_IN);
  const accountBillabilityData = getSheetData(SHEET_NAMES.ACCOUNT_BILLABILITY_TYPES);

  // Prepare account billability cache
  const accountBillabilityCache = prepareAccountBillabilityCache(accountBillabilityData);

  // Prepare batch updates
  const updates = [];

  allInData.rows.forEach((row, index) => {
    const account = row[accountTypeAllInIndices.account];
    
    // Skip if account is in skip list
    if (SKIP_ACCOUNTS.includes(account)) {
      updates.push(['']);
      return;
    }

    const accountType = findAccountTypeForAccount(account, accountBillabilityCache);
    updates.push([accountType]);
  });

  // Batch update all cells at once
  const allInSheet = getSheet(SHEET_NAMES.ALL_IN);
  const range = allInSheet.getRange(2, accountTypeAllInIndices.accountType + 1, updates.length, 1);
  range.setValues(updates);

  Logger.log(`Account type assignment completed. Updated ${updates.length} rows`);
}

// Optimized version that works with cached data and returns results for batch operations
function assignAccountTypesOptimized(dataManager) {
  Logger.log('Starting optimized account type assignment');
  
  const sourceData = dataManager.getSourceData(); // Изменено: теперь работаем с источником
  const accountBillabilityCacheData = dataManager.getAccountBillabilityCache();
  
  const accountIndex = dataManager.findColumnIndex(sourceData.header, COLUMN_NAMES.ALL_IN.ACCOUNT);

  // Prepare results array
  const results = [];

  sourceData.rows.forEach((row) => {
    const account = row[accountIndex];
    
    // Skip if account is in skip list
    if (SKIP_ACCOUNTS.includes(account)) {
      results.push(['']);
      return;
    }

    // Find account type using cached data
    const accountType = findAccountTypeForAccount(account, accountBillabilityCacheData.cache);
    results.push([accountType]);
  });

  Logger.log(`Optimized account type assignment completed. Processed ${results.length} rows`);
  return results;
}
