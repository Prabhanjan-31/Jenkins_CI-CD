const PRIORITY_MAP = {

  main: {
    value: 1,
    label: "HIGH"
  },

  staging: {
    value: 2,
    label: "MEDIUM"
  },

  dev: {
    value: 3,
    label: "LOW"
  }

};

// fallback priority
const DEFAULT_PRIORITY = {
  value: 3,
  label: "LOW"
};

module.exports = {
  PRIORITY_MAP,
  DEFAULT_PRIORITY
};