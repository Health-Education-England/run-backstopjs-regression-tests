/**
 * Generates BackstopJS config file by including scenarios dynamically.
 */

// Set environment variables for HTTP HOST and HTTP BASEPATH values.
const TEST_HOST = typeof process.env.HTTP_SERVE_HOST !== 'undefined' ?
  process.env.HTTP_SERVE_HOST : 'http://127.0.0.1:8080';

const TEST_BASEPATH = typeof process.env.HTTP_SERVE_BASEPATH !== 'undefined' ?
  process.env.HTTP_SERVE_BASEPATH.slice(0, -1) : '';

const utils = require('./utils');
const baseConfig = require('/app/src/backstop/config/base.json');

let scenarioIncludes = [];

// Attempt to load list of scenario include files.
try {
  scenarioIncludes = utils.getScenarioIncludes();
} catch (e) {
  console.error(e);
  return;
}

let scenarioData = [];

// Dynamically require scenario include files and generate scenario arrays.
scenarioIncludes.forEach(includeFile => {
  const scenario = require('/app/src/backstop/scenarios/' + includeFile);

  let scenarios = [];

  try {
    scenarios = utils.generateScenariosArray(TEST_HOST, TEST_BASEPATH, scenario.id, scenario.pathPattern);
  } catch (e) {
    console.error(e);
    return;
  }

  // Apply custom scenario overrides.
  if (scenario.hasOwnProperty('overrides')) {
    scenarios = utils.applyScenarioOverrides(TEST_HOST, TEST_BASEPATH, scenarios, scenario.overrides);
  }

  scenarioData = scenarioData.concat(scenarios);
})

// Amend the base config object with dynamic scenarios.
baseConfig.scenarios = scenarioData;

// Output new backstop config to json file.
utils.writeConfigFile('/app/src/backstop/config/backstop.json', baseConfig);
