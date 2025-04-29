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

function clearTargetSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getSheetByName(sheetName);
  targetSheet.clear();
}

function copyDataToTargetSheet(target, source) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = ss.getSheetByName(target);
  const sourceSheet = ss.getSheetByName(source);
  const sourceData = sourceSheet.getDataRange().getValues();
  targetSheet.getRange(1, 1, sourceData.length, sourceData[0].length).setValues(sourceData);
}
