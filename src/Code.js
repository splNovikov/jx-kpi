/**
 * A simple Google Apps Script function that returns a greeting message
 * @param {string} name - The name to greet
 * @return {string} A greeting message
 */
function sayHello(name) {
  return `Hello, ${name}! Welcome to Google Apps Script.`;
}

/**
 * A function that can be used as a custom function in Google Sheets
 * @param {string} name - The name to greet
 * @return {string} A greeting message
 * @customfunction
 */
function GREET(name) {
  return sayHello(name);
}

/**
 * A function that can be used as a menu item in Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Menu')
    .addItem('Say Hello', 'showHelloDialog')
    .addToUi();
}

/**
 * Shows a dialog with a greeting message
 */
function showHelloDialog() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Enter your name:');
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const name = response.getResponseText();
    ui.alert(sayHello(name));
  }
} 