jest.mock('@uc-engg/trajectory', () => ({
  initProducer: jest.fn(() => ({})),
  initConsumer: jest.fn(() => ({}))
}), {virtual:true});
jest.mock('../../../../index');
jest.mock('../../../../slack');
jest.mock('../../../../schema/services/index');

// Module imports start
const { Events } = require('../../../../dependency/events');
const RPCFramework = require('../../../../index');
const trajectory = require('@uc-engg/trajectory');
const { Utils } = require('../../../../dependency/utils');
const { OpenApiSchema } = require('../../../../schema/services');
RPCFramework.SERVICE_TYPE = 'typescript';

describe('test event producer dependency', () => {

  beforeEach(() => {
    trajectory.initProducer.mockReturnValue({
      sendEvent: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('platform producer successfully initialized', async () => {
    // Arrange - arrange test data
    const params = {
      id: 'event_producer'
    }
    const Singleton = {
      Config: {
        EVENT_CONF: {
          'platform': {}
        }
      }
    };
    RPCFramework.getSingleton.mockReturnValue(Singleton);
    const addToSingletonSpy = jest.spyOn(RPCFramework, 'addToSingleton');

    // Act - call function to be tested and receive result
    await Events.initEventProducer(params, RPCFramework);

    // Assert - validate received result with expected result using `expect` matchers
    expect(trajectory.initProducer).toBeCalled();
    expect(addToSingletonSpy).toBeCalled();
  });

  test('data producer successful initialized', async () => {
    // Arrange - arrange test data
    const params = {
      id: 'event_producer_data'
    }
    const Singleton = {
      Config: {
        EVENT_CONF: {
          'data': {}
        }
      }
    };
    RPCFramework.getSingleton.mockReturnValue(Singleton);
    const addToSingletonSpy = jest.spyOn(RPCFramework, 'addToSingleton');

    // Act - call function to be tested and receive result
    await Events.initEventProducer(params, RPCFramework);

    // Assert - validate received result with expected result using `expect` matchers
    expect(trajectory.initProducer).toBeCalled();
    expect(addToSingletonSpy).toBeCalled();
  });

  test('initialization fails when event config is not defined with Slack message', async () => {
    // Arrange - arrange test data
    const Singleton = {
      Slack: {
        sendSlackMessage: jest.fn()
      },
      Config: {
        EVENT_CONF: undefined,
        SERVICE_ID: 'test_service'
      }
    };
    RPCFramework.getSingleton.mockReturnValue(Singleton);
    const sendSlackMessageSpy = jest.spyOn(Singleton.Slack, 'sendSlackMessage');

    // Act - call function to be tested and receive result
    try {
      await Events.initEventProducer({}, RPCFramework);
    } catch (err) {
      expect(err.name).toBe('TypeError');
    }

    // Assert - validate received result with expected result using `expect` matchers
    expect(sendSlackMessageSpy).toBeCalled();
  });

  test('initialization fails when trajectory initProducer fn fails', async () => {
    // Arrange - arrange test data
    const params = {
      id: 'event_consumer'
    }
    const Singleton = {
      Config: {
        EVENT_CONF: {
          'platform': {}
        }
      },
      Slack: {
        sendSlackMessage: jest.fn()
      }
    };
    const errorMessage = 'initProducer failed';
    RPCFramework.getSingleton.mockReturnValue(Singleton);
    trajectory.initProducer.mockImplementation(() => {
      throw Error(errorMessage);
    });

    // Act - call function to be tested and receive result
    try {
      await Events.initEventProducer(params, RPCFramework);
    } catch (err) {
      expect(err.message).toBe(errorMessage);
    }

    // Assert - validate received result with expected result using `expect` matchers
    expect(trajectory.initProducer).toBeCalled();
  });

  test('producer error handler is not a function', async () => {
    // Arrange - arrange test data
    const params = {
      id: 'event_producer',
      error_handler: '/test/unit/dependency/events/invalid_error_handler.js'
    }
    const Singleton = {
      Config: {
        EVENT_CONF: {
          'platform': {}
        }
      }
    };
    const utilsLogAndRaiseErrorSpy = jest.spyOn(Utils, 'logAndRaiseError').mockImplementation(jest.fn());
    RPCFramework.getSingleton.mockReturnValue(Singleton);

    // Act - call function to be tested and receive result
    await Events.initEventProducer(params, RPCFramework);

    // Assert - validate received result with expected result using `expect` matchers
    expect(utilsLogAndRaiseErrorSpy).toBeCalled();
  })

  test('producer already initialized', async () => {
    // Arrange - arrange test data
    const params = {
      id: 'event_producer'
    }
    const Singleton = {
      event_producer: {}
    };
    RPCFramework.getSingleton.mockReturnValue(Singleton);

    // Act - call function to be tested and receive result
    await Events.initEventProducer(params, RPCFramework);

    // Assert - validate received result with expected result using `expect` matchers
    expect(trajectory.initProducer).toHaveBeenCalledTimes(0);
  });

});

describe('test event consumer dependency', () => {

  beforeEach(() => {
    trajectory.initConsumer.mockReturnValue({
      close: jest.fn()
    });
    OpenApiSchema.getOpenApiObj.mockReturnValue({ schema: { paths: {} } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('platform consumer successfully initialized', async () => {
    const params = {
      id: 'event_consumer',
      message_handler: '../test/unit/dependency/events/message_handler.js',
    }
    const Singleton = {
      Config: {
        EVENT_CONF: {
          'platform': {}
        }
      }
    };
    RPCFramework.getSingleton.mockReturnValue(Singleton);
    const addToSingletonSpy = jest.spyOn(RPCFramework, 'addToSingleton');

    // Act - call function to be tested and receive result
    await Events.initEventConsumer(params, RPCFramework);

    // Assert - validate received result with expected result using `expect` matchers
    expect(trajectory.initConsumer).toBeCalled();
    expect(addToSingletonSpy).toBeCalled();
  });

  test('data consumer successful initialized', async () => {
    const params = {
      id: 'event_consumer_data',
      message_handler: '../test/unit/dependency/events/message_handler.js',
    }
    const Singleton = {
      Config: {
        EVENT_CONF: {
          'data': {}
        }
      }
    };
    RPCFramework.getSingleton.mockReturnValue(Singleton);
    const addToSingletonSpy = jest.spyOn(RPCFramework, 'addToSingleton');

    // Act - call function to be tested and receive result
    await Events.initEventConsumer(params, RPCFramework);

    // Assert - validate received result with expected result using `expect` matchers
    expect(trajectory.initConsumer).toBeCalled();
    expect(addToSingletonSpy).toBeCalled();
  });

  test('consumer message handler is not a function', async () => {
    // Arrange - arrange test data
    const params = {
      id: 'event_consumer',
      message_handler: '../test/unit/dependency/events/invalid_message_handler.js'
    }
    const Singleton = {
      Config: {
        EVENT_CONF: {
          'platform': {}
        }
      }
    };
    const utilsLogAndRaiseErrorSpy = jest.spyOn(Utils, 'logAndRaiseError').mockImplementation(jest.fn());
    RPCFramework.getSingleton.mockReturnValue(Singleton);

    // Act - call function to be tested and receive result
    await Events.initEventConsumer(params, RPCFramework);

    // Assert - validate received result with expected result using `expect` matchers
    expect(utilsLogAndRaiseErrorSpy).toBeCalled();
  });

  test('consumer error handler is not a function', async () => {
    // Arrange - arrange test data
    const params = {
      id: 'event_consumer',
      message_handler: '../test/unit/dependency/events/invalid_message_handler.js',
      error_handler: '../test/unit/dependency/events/invalid_error_handler.js'
    }
    const Singleton = {
      Config: {
        EVENT_CONF: {
          'platform': {}
        }
      }
    };
    const utilsLogAndRaiseErrorSpy = jest.spyOn(Utils, 'logAndRaiseError').mockImplementation(jest.fn());
    RPCFramework.getSingleton.mockReturnValue(Singleton);

    // Act - call function to be tested and receive result
    await Events.initEventConsumer(params, RPCFramework);

    // Assert - validate received result with expected result using `expect` matchers
    expect(utilsLogAndRaiseErrorSpy).toBeCalled();
  });

  test('initialization fails when event config is not defined with Slack message', async () => {
    // Arrange - arrange test data
    const params = {
      id: 'event_consumer',
      message_handler: '../test/unit/dependency/events/message_handler.js',
    }
    const Singleton = {
      Slack: {
        sendSlackMessage: jest.fn()
      },
      Config: {
        EVENT_CONF: undefined,
        SERVICE_ID: 'test_service'
      }
    };
    RPCFramework.getSingleton.mockReturnValue(Singleton);
    const sendSlackMessageSpy = jest.spyOn(Singleton.Slack, 'sendSlackMessage');

    // Act - call function to be tested and receive result
    try {
      await Events.initEventConsumer(params, RPCFramework);
    } catch (err) {
      expect(err.name).toBe('TypeError');
    }

    // Assert - validate received result with expected result using `expect` matchers
    expect(sendSlackMessageSpy).toBeCalled();
  });

  test('initialization fails when trajectory initConsumer fn fails', async () => {
    // Arrange - arrange test data
    const params = {
      id: 'event_consumer',
      message_handler: '../test/unit/dependency/events/message_handler.js',
    }
    const Singleton = {
      Config: {
        EVENT_CONF: {
          'platform': {}
        }
      },
      Slack: {
        sendSlackMessage: jest.fn()
      }
    };
    const errorMessage = 'initConsumer failed';
    RPCFramework.getSingleton.mockReturnValue(Singleton);
    trajectory.initConsumer.mockImplementation(() => {
      throw Error(errorMessage);
    });

    // Act - call function to be tested and receive result
    try {
      await Events.initEventConsumer(params, RPCFramework);
    } catch (err) {
      expect(err.message).toBe(errorMessage);
    }

    // Assert - validate received result with expected result using `expect` matchers
    expect(trajectory.initConsumer).toBeCalled();
  });

});
