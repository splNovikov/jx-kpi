// Cache for sheet references
const sheetCache = new Map();

function clearSheetCache() {
  sheetCache.clear();
}

function getSheet(sheetName) {
  if (!sheetCache.has(sheetName)) {
    const sSheet = SpreadsheetApp.getActiveSpreadsheet();
    sheetCache.set(sheetName, sSheet.getSheetByName(sheetName));
  }
  return sheetCache.get(sheetName);
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();

  return {
    header: data[0],
    rows: data.slice(1)
  };
}

function updateCellValue(sheetName, rowIndex, columnIndex, value) {
  const sheet = getSheet(sheetName);
  sheet.getRange(rowIndex + 2, columnIndex + 1).setValue(value);
}

function clearTargetSheet(targetSheetName) {
  const targetSheet = getSheet(targetSheetName);
  targetSheet.clear();
  clearSheetCache(); // Clear the cache after clearing the sheet
}

function copyDataToTargetSheet(targetSheetName, sourceSheetName) {
  const targetSheet = getSheet(targetSheetName);
  const sourceSheet = getSheet(sourceSheetName);
  const sourceData = sourceSheet.getDataRange().getValues();
  targetSheet.getRange(1, 1, sourceData.length, sourceData[0].length).setValues(sourceData);
}

function addLastColumnTitle(targetSheetName, title) {
  const targetSheet = getSheet(targetSheetName);
  const lastColumn = targetSheet.getLastColumn();
  targetSheet.getRange(1, lastColumn + 1).setValue(title);
}
