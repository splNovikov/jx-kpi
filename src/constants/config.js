const SKIP_ACCOUNTS = ["", "Terminated", "Cost Exclusions", "Bench"];

const SHEET_NAMES = {
  ALL_IN: "[HARD Copy] all_in_reduced",
  ALL_IN_SOURCE: "all_in_reduced",
  MANAGER_ASSIGNMENTS: "Manager-Account assignments",
  MANAGER_INCONSISTENCY: "Manager assignment inconsistency"
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
