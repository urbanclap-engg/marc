const PrioritizedLoadShedUtil = require('../../../load_shed/strategy/prioritized');

describe('testing prioritized load-shedding', () => {
  test('testing toLoadShed by prioritized strategy with input priority (2,2) and api admission control (1, 1)',  function () {
    const reqPriority =  {
      businessPriority: 2,
      userPriority: 2
    }
    const isValidRequest = PrioritizedLoadShedUtil.isRequestPriorityAllowed(reqPriority, { businessPriority: 1, userPriority: 1 });
    // Assert - validate received result with expected result using `expect` matchers
    expect(isValidRequest).toEqual(true);
  })
  test('testing toLoadShed by prioritized strategy with input priority (2,2) and api admission control (2, 2)',  function () {
    const reqPriority =  {
      businessPriority: 2,
      userPriority: 2
    }
    const isValidRequest = PrioritizedLoadShedUtil.isRequestPriorityAllowed(reqPriority, { businessPriority: 2, userPriority: 2 });
    // Assert - validate received result with expected result using `expect` matchers
    expect(isValidRequest).toEqual(false);
  })
  test('testing toLoadShed by prioritized strategy with input priority (1,2) and api admission control (2, 2)',  function () {
    const reqPriority =  {
      businessPriority: 1,
      userPriority: 2
    }
    const isValidRequest = PrioritizedLoadShedUtil.isRequestPriorityAllowed(reqPriority, { businessPriority: 2, userPriority: 2 });
    // Assert - validate received result with expected result using `expect` matchers
    expect(isValidRequest).toEqual(false);
  })
  test('testing toLoadShed by prioritized strategy with input priority (1,2) and api admission control (1, 1)',  function () {
    const reqPriority =  {
      businessPriority: 1,
      userPriority: 2
    };
    const isValidRequest = PrioritizedLoadShedUtil.isRequestPriorityAllowed(reqPriority, { businessPriority: 1, userPriority: 1 });
    // Assert - validate received result with expected result using `expect` matchers
    expect(isValidRequest).toEqual(true);
  })
  test('testing toLoadShed by prioritized strategy with input priority (1,1) and api admission control (1, 2)',  function () {
    const reqPriority =  {
      businessPriority: 1,
      userPriority: 1
    };
    const isValidRequest = PrioritizedLoadShedUtil.isRequestPriorityAllowed(reqPriority, { businessPriority: 1, userPriority: 2 });
    // Assert - validate received result with expected result using `expect` matchers
    expect(isValidRequest).toEqual(false);
  })
});