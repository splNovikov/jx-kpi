function main() {
  // Step 1: Clear [HARD Copy] all_in_reduced
  clearTargetSheet(SHEET_NAMES.ALL_IN);

  // Step 2: Make a hard copy of data from all_in_reduced to [HARD Copy] all_in_reduced
  copyDataToTargetSheet(SHEET_NAMES.ALL_IN, SHEET_NAMES.ALL_IN_SOURCE);

  // Step 3: Run assignManagers
  assignManagers();
}
