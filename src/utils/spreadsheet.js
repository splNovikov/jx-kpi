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

module.exports = {
  getSheetData,
  updateCellValue
};
