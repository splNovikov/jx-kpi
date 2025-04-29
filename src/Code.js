function main() {
  Logger.log('Starting main function execution');
  
  // Step 1: Clear [HARD Copy] all_in_reduced
  Logger.log('Step 1: Clearing target sheet');
  clearTargetSheet(SHEET_NAMES.ALL_IN);
  Logger.log('Step 1 completed: Target sheet cleared');

  // Step 2: Make a hard copy of data from all_in_reduced to [HARD Copy] all_in_reduced
  Logger.log('Step 2: Copying data to target sheet');
  copyDataToTargetSheet(SHEET_NAMES.ALL_IN, SHEET_NAMES.ALL_IN_SOURCE);
  Logger.log('Step 2 completed: Data copied successfully');

  // Add MANAGER column title
  Logger.log('Adding MANAGER column title');
  addLastColumnTitle(SHEET_NAMES.ALL_IN, COLUMN_NAMES.ALL_IN.MANAGER);
  Logger.log('MANAGER column title added');

  // Step 3: Run assignManagers
  Logger.log('Step 3: Starting manager assignment');
  assignManagers();
  Logger.log('Step 3 completed: Managers assigned');

  Logger.log('Main function execution completed successfully');
}
