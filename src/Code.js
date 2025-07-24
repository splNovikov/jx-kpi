function main() {
  Logger.log('Starting main function execution - ULTIMATE OPTIMIZED VERSION');

  // Step 1: Clear target sheet and cache
  Logger.log('Step 1: Clearing target sheet and cache');
  clearTargetSheet(SHEET_NAMES.ALL_IN);
  clearDataManagerCache(); // Clear any existing cache
  Logger.log('Step 1 completed: Target sheet cleared');

  // Step 2: Initialize DataManager and load all required data from source
  Logger.log('Step 2: Initializing data cache from source');
  const dataManager = getDataManager();
  dataManager.initializeAllData(); // Loads from ALL_IN_SOURCE directly
  Logger.log('Step 2 completed: All source data cached successfully');

  // Step 3: Process managers and account types using cached data
  Logger.log('Step 3: Processing managers and account types');
  const managerResults = assignManagersOptimized(dataManager);
  const accountTypeResults = assignAccountTypesOptimized(dataManager);
  Logger.log('Step 3 completed: Data processing finished');

  // Step 4: ULTIMATE OPTIMIZATION - Write everything in single batch operation
  // This includes: original data + manager column + account type column
  Logger.log('Step 4: Writing complete dataset in single mega-batch operation');
  dataManager.batchWriteCompleteData(SHEET_NAMES.ALL_IN, managerResults, accountTypeResults);
  Logger.log('Step 4 completed: Complete dataset written in single operation!');

  // Step 5: Find overlapping assignments (if needed)
  // Logger.log('Step 5: Finding overlapping assignments');
  // findOverlappingAssignments();
  // Logger.log('Step 5 completed: Overlapping assignments found');

  Logger.log('ULTIMATE OPTIMIZED execution completed successfully - Maximum performance achieved!');
}
