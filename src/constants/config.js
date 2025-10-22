const SKIP_ACCOUNTS = ["", "Terminated", "Cost Exclusions"];

const SHEET_NAMES = {
  ALL_IN: "[HARD Copy] all_in_reduced",
  ALL_IN_SOURCE: "import_all_in_reduced",
  MANAGER_ASSIGNMENTS: "import_Manager_Account_assignments",
  MANAGER_INCONSISTENCY: "Manager assignment inconsistency",
  MANAGER_OVERLAPS: "Manager-Account assignments overlap",
  ACCOUNT_BILLABILITY_TYPES: "import_Account_Billability_Types"
};

const COLUMN_NAMES = {
  ALL_IN: {
    ACCOUNT: "Account",
    MONTH: "Month",
    MANAGER: "MANAGER",
    ACCOUNT_TYPE: "Account Type",
    ASSIGNMENT_ID: "Assignment Id",
    NAME: "Name",
    START_DATE: "Start Date",
    END_DATE: "End Date"
  },
  MANAGER: {
    ACCOUNT: "Account",
    START_DATE: "Start Date",
    END_DATE: "End Date",
    NAME: "Name",
    POSITION: "Position name"
  },
  ACCOUNT_BILLABILITY: {
    PAYED: "Payed",
    INTERNAL_DEV: "Internal Dev",
    DEPARTMENTS: "Departments"
  }
};

// Special mapping for accounts that never had a manager
const SPECIAL_ACCOUNT_MANAGERS = {
  "Bench": "Bench-MANAGER",
  // "Department: Engineering": "Department: Engineering-MANAGER",
  // "Department: Delivery": "Department: Delivery-MANAGER",
  // "Department: Operations": "Department: Operations-MANAGER",
  // "Department: HR": "Department: HR-MANAGER"
};
