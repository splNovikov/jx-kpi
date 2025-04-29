function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();

  return {
    header: data[0],
    rows: data.slice(1)
  };
}

function updateCellValue(sheetName, rowIndex, columnIndex, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  sheet.getRange(rowIndex + 2, columnIndex + 1).setValue(value);
}

function clearTargetSheet(targetSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getSheetByName(targetSheetName);
  targetSheet.clear();
}

function copyDataToTargetSheet(targetSheetName, sourceSheetName) {

  const targetSheet = ss.getSheetByName(targetSheetName);
  const sourceSheet = ss.getSheetByName(sourceSheetName);
  const sourceData = sourceSheet.getDataRange().getValues();
  targetSheet.getRange(1, 1, sourceData.length, sourceData[0].length).setValues(sourceData);
}

function addLastColumnTitle(targetSheetName, title) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getSheetByName(targetSheetName);
  const lastColumn = targetSheet.getLastColumn();
  targetSheet.getRange(1, lastColumn + 1).setValue(title);
}
