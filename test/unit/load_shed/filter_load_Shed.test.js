const FilterLoadShedUtil = require('../../../load_shed/strategy/filter');

describe('testing filter based load-shedding', () => {
  test('testing filterRequest with req params present in filters',  function () {
    const req = {
        body : {
            category_key: "salon_at_home"
        }
    };
    const filters  = {
        category_key: ["ac_appliances", "salon_at_home"]
    }
    const isValidRequest = FilterLoadShedUtil.filterRequest(req, filters);
    // Assert - validate received result with expected result using `expect` matchers
    expect(isValidRequest).toEqual(false);
  })
  test('testing filterRequest with filter having ANY',  function () {
    const req = {
        body : {
            category_key: "salon_at_home"
        }
    };
    const filters  = {
        category_key: ["ANY"]
    }
    const isValidRequest = FilterLoadShedUtil.filterRequest(req, filters);
    // Assert - validate received result with expected result using `expect` matchers
    expect(isValidRequest).toEqual(false);
  })
  test('testing filterRequest to filter having req param not present in filters',  function () {
    const req = {
        body : {
            category_key: "machine_appliances"
        }
    };
    const filters  = {
        category_key: ["ac_appliances", "salon_at_home"]
    }
    const isValidRequest = FilterLoadShedUtil.filterRequest(req, filters);
    // Assert - validate received result with expected result using `expect` matchers
    expect(isValidRequest).toEqual(true);
  })
});