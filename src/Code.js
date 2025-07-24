function main() {
  Logger.log('Starting main function execution');

  // Step 1: Clear [HARD Copy] all_in_reduced
  Logger.log('Step 1: Clearing target sheet');
  clearTargetSheet(SHEET_NAMES.ALL_IN);
  clearDataManagerCache(); // Clear any existing cache
  Logger.log('Step 1 completed: Target sheet cleared');

  // Step 2: Make a hard copy of data from all_in_reduced to [HARD Copy] all_in_reduced
  Logger.log('Step 2: Copying data to target sheet');
  copyDataToTargetSheet(SHEET_NAMES.ALL_IN, SHEET_NAMES.ALL_IN_SOURCE);
  Logger.log('Step 2 completed: Data copied successfully');

  // Step 3: Initialize DataManager and load all required data
  Logger.log('Step 3: Initializing data cache');
  const dataManager = getDataManager();
  dataManager.initializeAllData();
  Logger.log('Step 3 completed: All data cached successfully');

  // Step 4: Process managers and account types in parallel (data processing)
  Logger.log('Step 4: Processing managers and account types');
  const managerResults = assignManagersOptimized(dataManager);
  const accountTypeResults = assignAccountTypesOptimized(dataManager);
  Logger.log('Step 4 completed: Data processing finished');

  // Step 5: Batch write all results at once
  Logger.log('Step 5: Writing results in batch');
  dataManager.batchWriteResults(SHEET_NAMES.ALL_IN, managerResults, accountTypeResults);
  Logger.log('Step 5 completed: All results written successfully');

  // Step 6: Find overlapping assignments (if needed)
  // Logger.log('Step 6: Finding overlapping assignments');
  // findOverlappingAssignments();
  // Logger.log('Step 6 completed: Overlapping assignments found');

  Logger.log('Main function execution completed successfully');
}
