const SKIP_ACCOUNTS = ["", "Terminated", "Cost Exclusions", "Bench"];

const SHEET_NAMES = {
  ALL_IN: "[HARD Copy] all_in_reduced",
  MANAGER_ASSIGNMENTS: "Manager-Account assignments"
};

const COLUMN_NAMES = {
  ALL_IN: {
    ACCOUNT: "Account",
    MONTH: "Month",
    MANAGER: "MANAGER"
  },
  MANAGER: {
    ACCOUNT: "Account",
    START_DATE: "Start Date",
    END_DATE: "End Date",
    NAME: "Name"
  }
};

module.exports = {
  SKIP_ACCOUNTS,
  SHEET_NAMES,
  COLUMN_NAMES
}; 