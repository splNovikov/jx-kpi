function assignManagers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allInSheet = ss.getSheetByName("[HARD Copy] all_in_reduced");
  const managerSheet = ss.getSheetByName("Manager-Account assignments");

  const managerData = managerSheet.getDataRange().getValues();
  const allInData = allInSheet.getDataRange().getValues();

  const managerHeader = managerData[0];
  const allInHeader = allInData[0];

  const managerRows = managerData.slice(1);
  const allInRows = allInData.slice(1);

  const allInAccountIndex = allInHeader.indexOf("Account");
  const allInMonthIndex = allInHeader.indexOf("Month");
  const allInManagerIndex = allInHeader.indexOf("MANAGER");

  const managerAccountIndex = managerHeader.indexOf("Account");
  const managerStartIndex = managerHeader.indexOf("Start Date");
  const managerEndIndex = managerHeader.indexOf("End Date");
  const managerNameIndex = managerHeader.indexOf("Name");

  const skipAccounts = ["", "Terminated", "Cost Exclusions", "Bench"];

  for (let i = 0; i < allInRows.length; i++) {
    const account = allInRows[i][allInAccountIndex];

    if (skipAccounts.includes(account)) {
      allInSheet.getRange(i + 2, allInManagerIndex + 1).setValue("");
      continue;
    }

    const monthString = allInRows[i][allInMonthIndex];
    const monthDate = new Date(monthString + " 1"); // e.g., "January 2024" → Date object

    let matchedManagers = [];

    for (let j = 0; j < managerRows.length; j++) {
      const managerAccount = managerRows[j][managerAccountIndex];
      const managerStart = new Date(managerRows[j][managerStartIndex]);
      const managerEnd = new Date(managerRows[j][managerEndIndex]);

      const isMatch = (
          account === managerAccount &&
          monthDate >= managerStart &&
          monthDate <= managerEnd
      );

      if (isMatch) {
        matchedManagers.push(managerRows[j][managerNameIndex]);
      }
    }

    const uniqueManagers = [...new Set(matchedManagers)];
    const managerValue = uniqueManagers.join(", ");
    allInSheet.getRange(i + 2, allInManagerIndex + 1).setValue(managerValue);
  }
}