const LoadShedUtil = require('./../../../load_shed/util');
const DateTime = require('luxon').DateTime
const LoadShedConstants = require('../../../load_shed/constants');
const PercentageLoadShedUtil = require('../../../load_shed/strategy/percentage');

describe('testing load-shedding', () => {
  //describe divides test suites into components

  beforeAll(() => {
    /* Runs before all tests */

  });

  afterAll(()=>{
    /* Runs after all tests */
  });
  test('test isExcludedRoutes function', function () {
    // Assert - validate received result with expected result using `expect` matchers

    expect(LoadShedUtil.isRouteExcluded('scaleContainers')).toEqual(false);
  })

  test('testing getClient from query',  function () {
    const request = {
        query: {
            client_id: "service-market"
        }
    }
    // Assert - validate received result with expected result using `expect` matchers
    expect(LoadShedUtil.getClient(request)).toEqual("service-market");
    })
    test('testing getClient from headers',  function () {
    const request = {
        headers: {
            "user-agent": "Android"
        }
    }
    // Assert - validate received result with expected result using `expect` matchers
    expect(LoadShedUtil.getClient(request)).toEqual("android");
    })
});
