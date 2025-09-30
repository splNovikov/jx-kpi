// Centralized data manager for caching and optimizing Google Sheets operations
class DataManager {
  constructor() {
    this.cache = new Map();
    this.initialized = false;
    this.maxCacheSize = 50000; // Примерно 50k строк - безопасный лимит для Google Apps Script
    this.maxCellsPerChunk = 15000; // Conservative cell limit per chunk for reliable writes (prevents timeouts)
    this.minRowsPerChunk = 100; // Minimum rows per chunk to avoid too many small chunks
    this.chunkDelayMs = 200; // Delay between chunks to let API recover and prevent throttling
  }

  // Load all required data at once to minimize API calls
  initializeAllData() {
    if (this.initialized) {
      return;
    }

    Logger.log('DataManager: Loading all required data from source...');
    
    // Load source data directly (not the copied version)
    const sourceData = getSheetData(SHEET_NAMES.ALL_IN_SOURCE);
    const managerData = getSheetData(SHEET_NAMES.MANAGER_ASSIGNMENTS);
    const accountBillabilityData = getSheetData(SHEET_NAMES.ACCOUNT_BILLABILITY_TYPES);

    // Check cache size limits
    this.checkCacheSize(sourceData, 'source data');

    // Cache the data
    this.cache.set('SOURCE_DATA', sourceData);
    this.cache.set('MANAGER_ASSIGNMENTS', managerData);
    this.cache.set('ACCOUNT_BILLABILITY_TYPES', accountBillabilityData);

    // Prepare processed caches for better performance
    this.prepareManagerCache(managerData);
    this.prepareAccountBillabilityCache(accountBillabilityData);

    this.initialized = true;
    Logger.log('DataManager: All source data loaded and cached successfully');
  }

  // Check if cache size is within limits
  checkCacheSize(data, dataName) {
    const rowCount = data.rows ? data.rows.length : 0;
    if (rowCount > this.maxCacheSize) {
      Logger.log(`Warning: ${dataName} has ${rowCount} rows, which exceeds recommended cache size of ${this.maxCacheSize}`);
      Logger.log('Consider processing in chunks if performance issues occur');
    } else {
      Logger.log(`DataManager: ${dataName} size OK - ${rowCount} rows`);
    }
  }

  // Get cached sheet data
  getCachedData(sheetName) {
    if (!this.initialized) {
      throw new Error('DataManager not initialized. Call initializeAllData() first.');
    }
    return this.cache.get(sheetName);
  }

  // Get source data (original data from ALL_IN_SOURCE)
  getSourceData() {
    return this.getCachedData('SOURCE_DATA');
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

  // Optimized chunked batch write to prevent timeouts
  batchWriteCompleteData(targetSheetName, managerResults, accountTypeResults) {
    const sourceData = this.getSourceData();
    const sheet = getSheet(targetSheetName);
    
    Logger.log('DataManager: Preparing chunked batch write...');

    // Clear target sheet first
    sheet.clear();
    clearSheetCache();

    // Prepare headers: original + new columns
    const originalHeaders = [...sourceData.header];
    const completeHeaders = [...originalHeaders, COLUMN_NAMES.ALL_IN.MANAGER, COLUMN_NAMES.ALL_IN.ACCOUNT_TYPE];

    // Prepare complete data: original + new columns
    const completeData = [completeHeaders]; // Start with headers

    // Combine original rows with new column data
    sourceData.rows.forEach((originalRow, index) => {
      const managerValue = managerResults[index] ? managerResults[index][0] : '';
      const accountTypeValue = accountTypeResults[index] ? accountTypeResults[index][0] : '';
      
      const completeRow = [...originalRow, managerValue, accountTypeValue];
      completeData.push(completeRow);
    });

    const totalRows = completeData.length;
    const totalCols = completeHeaders.length;
    
    if (totalRows === 0 || totalCols === 0) {
      Logger.log('DataManager: No data to write');
      return;
    }

    Logger.log(`DataManager: Preparing to write ${totalRows} rows with ${totalCols} columns`);
    
    try {
      // Write data in chunks to prevent timeout (adaptive cell-based chunking)
      this.writeDataInChunks(sheet, completeData, totalCols);
      Logger.log(`DataManager: Successfully wrote complete dataset in chunked operations!`);
    } catch (error) {
      Logger.log(`DataManager ERROR: Failed to write data - ${error.message}`);
      throw new Error(`Failed to write data to ${targetSheetName}: ${error.message}`);
    }

    // Log memory usage
    this.logMemoryUsage(completeData);
  }

  // Write data in chunks with progress tracking and error handling (adaptive cell-based)
  writeDataInChunks(sheet, completeData, totalCols) {
    const totalRows = completeData.length;
    
    // Calculate optimal chunk size based on total cells (rows × columns)
    // Target: maxCellsPerChunk cells per write operation
    const calculatedChunkSize = Math.floor(this.maxCellsPerChunk / totalCols);
    const chunkSize = Math.max(this.minRowsPerChunk, calculatedChunkSize);
    const numChunks = Math.ceil(totalRows / chunkSize);
    
    Logger.log(`DataManager: Adaptive chunking - ${totalCols} columns, ${chunkSize} rows per chunk (max ${chunkSize * totalCols} cells)`);
    Logger.log(`DataManager: Processing ${numChunks} chunk(s) for ${totalRows} total rows...`);

    for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
      const startRow = chunkIndex * chunkSize;
      const endRow = Math.min(startRow + chunkSize, totalRows);
      const chunk = completeData.slice(startRow, endRow);
      const chunkLength = chunk.length;
      const chunkCells = chunkLength * totalCols;
      
      Logger.log(`DataManager: Writing chunk ${chunkIndex + 1}/${numChunks} (rows ${startRow + 1}-${endRow}, ${chunkCells} cells)...`);
      
      try {
        // Write chunk to sheet
        const range = sheet.getRange(startRow + 1, 1, chunkLength, totalCols);
        range.setValues(chunk);
        
        Logger.log(`DataManager: Chunk ${chunkIndex + 1}/${numChunks} written successfully (${chunkLength} rows, ${chunkCells} cells)`);
        
        // Add small delay between chunks to prevent throttling (except for last chunk)
        if (chunkIndex < numChunks - 1) {
          Utilities.sleep(this.chunkDelayMs);
        }
      } catch (chunkError) {
        Logger.log(`DataManager ERROR: Failed to write chunk ${chunkIndex + 1} (rows ${startRow + 1}-${endRow})`);
        Logger.log(`Error details: ${chunkError.message}`);
        throw new Error(`Chunk write failed at row ${startRow + 1}: ${chunkError.message}`);
      }
    }
    
    Logger.log(`DataManager: All ${numChunks} chunk(s) written successfully!`);
  }

  // Log memory usage for monitoring
  logMemoryUsage(data) {
    const rowCount = data.length;
    const avgColCount = data.length > 0 ? data[0].length : 0;
    const estimatedCells = rowCount * avgColCount;
    
    Logger.log(`Memory usage: ${rowCount} rows × ${avgColCount} cols = ${estimatedCells} cells`);
    
    if (estimatedCells > 200000) {
      Logger.log('Warning: Large dataset - monitor performance');
    }
  }

  // Clear cache and free memory
  clearCache() {
    this.cache.clear();
    this.initialized = false;
    Logger.log('DataManager: Cache cleared, memory freed');
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