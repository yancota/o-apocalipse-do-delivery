// @ts-nocheck
module.exports = {
  packageManager: 'npm',
  testRunner: 'jest',
  reporters: ['progress', 'clear-text', 'html'],
  mutate: ['src/services/**/*.js'],
  thresholds: {
    high: 80,
    low: 80,
    break: 80
  },
  jest: {
    projectType: 'custom',
    enableFindRelatedTests: true,
    configFile: 'package.json'
  },
  coverageAnalysis: 'perTest'
};