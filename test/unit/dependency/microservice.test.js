// Project specific mocks start
const RpcFramework = require('../../../index');
jest.spyOn(RpcFramework, 'createClient').mockImplementation(() => {
  return {};
});

jest.spyOn(RpcFramework, 'getSingleton').mockImplementation(() => {
  return {
    Config: { getServiceConf: function getServiceConf(serviceId) { return { uri: "", port: "" } } }
  }
});

const { OpenApiSchema } = require('../../../schema/services');
jest.spyOn(OpenApiSchema, 'getOpenApiObj').mockImplementation(() => {
  return { schema: {} };
});

// Module imports start
const { Microservice } = require('../../../dependency/microservice');

describe('test microservice dependency', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initialise basic service client', async() => {
    // Act - call function to be tested and receive result
    Microservice.initMicroserviceClient({id: "core-service"}, RpcFramework)

    // Assert - validate received result with expected result using `expect` matchers
    expect(RpcFramework.createClient).toBeCalled();
  })
  
  test('initialise service with sub-services client', async() => {
    const data = { id: "osrm-service", sub_service_ids: ['osrm-india-service', 'osrm-australia-service'] }
    
    // Act - call function to be tested and receive result
    Microservice.initMicroserviceClient(data, RpcFramework)

    // Assert - validate received result with expected result using `expect` matchers
    expect(RpcFramework.createClient).toHaveBeenCalledTimes(2);
  })
});
