function getSheetData(sheetName) {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = sSheet.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();

  return {
    header: data[0],
    rows: data.slice(1)
  };
}

function updateCellValue(sheetName, rowIndex, columnIndex, value) {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = sSheet.getSheetByName(sheetName);
  sheet.getRange(rowIndex + 2, columnIndex + 1).setValue(value);
}

function clearTargetSheet(targetSheetName) {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = sSheet.getSheetByName(targetSheetName);
  targetSheet.clear();
}

function copyDataToTargetSheet(targetSheetName, sourceSheetName) {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = sSheet.getSheetByName(targetSheetName);
  const sourceSheet = sSheet.getSheetByName(sourceSheetName);
  const sourceData = sourceSheet.getDataRange().getValues();
  targetSheet.getRange(1, 1, sourceData.length, sourceData[0].length).setValues(sourceData);
}

function addLastColumnTitle(targetSheetName, title) {
  const sSheet = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = sSheet.getSheetByName(targetSheetName);
  const lastColumn = targetSheet.getLastColumn();
  targetSheet.getRange(1, lastColumn + 1).setValue(title);
}
