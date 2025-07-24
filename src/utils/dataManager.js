// Centralized data manager for caching and optimizing Google Sheets operations
class DataManager {
  constructor() {
    this.cache = new Map();
    this.initialized = false;
  }

  // Load all required data at once to minimize API calls
  initializeAllData() {
    if (this.initialized) {
      return;
    }

    Logger.log('DataManager: Loading all required data...');
    
    // Load all sheets data in parallel conceptually (Google Apps Script limitation)
    const allInData = getSheetData(SHEET_NAMES.ALL_IN);
    const managerData = getSheetData(SHEET_NAMES.MANAGER_ASSIGNMENTS);
    const accountBillabilityData = getSheetData(SHEET_NAMES.ACCOUNT_BILLABILITY_TYPES);

    // Cache the data
    this.cache.set('ALL_IN', allInData);
    this.cache.set('MANAGER_ASSIGNMENTS', managerData);
    this.cache.set('ACCOUNT_BILLABILITY_TYPES', accountBillabilityData);

    // Prepare processed caches for better performance
    this.prepareManagerCache(managerData);
    this.prepareAccountBillabilityCache(accountBillabilityData);

    this.initialized = true;
    Logger.log('DataManager: All data loaded and cached successfully');
  }

  // Get cached sheet data
  getCachedData(sheetName) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized. Call initializeAllData() first.');
    }
    return this.cache.get(sheetName);
  }

  // Prepare manager data cache (similar to existing logic)
  prepareManagerCache(managerData) {
    const managerCache = new Map();
    const indices = {
      account: this.findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.ACCOUNT),
      startDate: this.findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.START_DATE),
      endDate: this.findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.END_DATE),
      name: this.findColumnIndex(managerData.header, COLUMN_NAMES.MANAGER.NAME)
    };

    managerData.rows.forEach(row => {
      const account = row[indices.account];
      if (!managerCache.has(account)) {
        managerCache.set(account, []);
      }
      managerCache.get(account).push(row);
    });

    this.cache.set('MANAGER_CACHE', { cache: managerCache, indices });
  }

  // Prepare account billability cache
  prepareAccountBillabilityCache(accountBillabilityData) {
    const accountBillabilityCache = new Map();
    const indices = {};

    // Build indices for all columns
    accountBillabilityData.header.forEach((columnName, index) => {
      if (columnName && columnName.trim() !== '') {
        indices[columnName] = index;
      }
    });

    // For each column, collect all account names
    Object.keys(indices).forEach(columnName => {
      const columnIndex = indices[columnName];
      accountBillabilityData.rows.forEach(row => {
        const accountName = row[columnIndex];
        if (accountName && accountName.toString().trim() !== '') {
          const trimmedName = accountName.toString().trim();
          if (!accountBillabilityCache.has(trimmedName)) {
            accountBillabilityCache.set(trimmedName, []);
          }
          accountBillabilityCache.get(trimmedName).push(columnName);
        }
      });
    });

    this.cache.set('ACCOUNT_BILLABILITY_CACHE', { cache: accountBillabilityCache, indices });
  }

  // Get manager cache
  getManagerCache() {
    return this.cache.get('MANAGER_CACHE');
  }

  // Get account billability cache
  getAccountBillabilityCache() {
    return this.cache.get('ACCOUNT_BILLABILITY_CACHE');
  }

  // Utility function to find column index
  findColumnIndex(header, columnName) {
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

  // Batch write results to minimize API calls
  batchWriteResults(sheetName, managerResults, accountTypeResults) {
    const sheet = getSheet(sheetName);
    const allInData = this.getCachedData('ALL_IN');
    
    // Add both column headers at once
    const lastColumn = sheet.getLastColumn();
    const headerRange = sheet.getRange(1, lastColumn + 1, 1, 2);
    headerRange.setValues([[COLUMN_NAMES.ALL_IN.MANAGER, COLUMN_NAMES.ALL_IN.ACCOUNT_TYPE]]);

    // Combine both result arrays
    const combinedResults = [];
    for (let i = 0; i < managerResults.length; i++) {
      combinedResults.push([managerResults[i][0], accountTypeResults[i][0]]);
    }

    // Write all data at once
    const dataRange = sheet.getRange(2, lastColumn + 1, combinedResults.length, 2);
    dataRange.setValues(combinedResults);

    Logger.log(`DataManager: Batch wrote ${combinedResults.length} rows with both manager and account type data`);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.initialized = false;
  }
}

// Global instance
let globalDataManager = null;

function getDataManager() {
  if (!globalDataManager) {
    globalDataManager = new DataManager();
  }
  return globalDataManager;
}

function clearDataManagerCache() {
  if (globalDataManager) {
    globalDataManager.clearCache();
  }
} 