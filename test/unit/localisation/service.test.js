require('../test-loader')();

const Localisation = require('../../../localisation/service');
const resources = require('../resources/localization.strings');

describe('testing localisation', () => {
  //describe divides test suites into components

  beforeAll(() => {
    /* Runs before all tests */

  });

  afterAll(()=>{
    /* Runs after all tests */
  });

  //testing getLocalizedString
  test('testing for constant string',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.order_date

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot This is your order date??::source=test-service&&& groot#");
  })

  //testing getLocalizedString
  test('testing for source and context',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.order_date_with_context

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot This is your order date??::source=test-service&&&context=context for order date&&& groot#");
  })

  //testing getLocalizedString
  test('testing for missing type',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.order_date_object

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");
  })

  //testing getLocalizedString
  test('testing for invalid value [Array]',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.order_date_empty_array

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");

  })

  //testing getLocalizedString
  test('testing for invalid value [Array]',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.order_date_empty_string

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");

  })

  //testing getLocalizedString
  test('testing for parameterized string',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {time : "5 & PM"}
    const stringObject = resources["last_updated_on_test"]

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot Last Updated On {{time}}??::time=5 & PM&&&source=test-service&&&context=context of Last Updated on&&& groot#");
  })

  //testing getLocalizedString
  test('testing for missing key in resources file',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.last_updated_missing_key

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");

  })

  //testing getLocalizedString
  test('testing for wrong type',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.last_updated_type_wrong

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");

  })


  //testing getLocalizedString
  test('testing for missing type',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.last_updated_type_missing

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");

  })

  //testing getLocalizedString
  test('testing for missing value',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.last_updated_value_missing

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");

  })

  //testing getLocalizedString
  test('testing for empty value',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.last_updated_value_empty

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");

  })

  //testing getLocalizedString
  test('testing for invalid value',  function () {

    // Arrange - arrange test data
    const key = "last_updated_value_object"
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.last_updated_value_object

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, key, parameterMap, serviceId);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");

  })

  //testing getLocalizedString
  test('testing for empty type',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.last_updated_type_empty

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("");

  })

  //testing getLocalizedString
  test('testing for special character =',  function () {

    // Arrange - arrange test data
    const key = "last_updated_on_with_special_character"
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources["last_updated_on_with_special_character"]

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject , serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot Last Updated On value = test??::source=test-service&&&context=context of last updated on&&& groot#");

  })

  //testing getLocalizedString
  test('testing for special character',  function () {

    // Arrange - arrange test data
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources["last_updated_on_with_special_character_1"]

    // Act - call function to be tested
    let result  = Localisation.getLocalizedString(stringObject, serviceId, parameterMap);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot Last Updated On 'value = test'??::source=test-service&&&context=context of last updated on&&& groot#");

  })

  //testing getDynamicLocalizedString
  test('testing for string and context',  function () {

    // Arrange - arrange test data
    const string = "Order id"
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.order_id

    // Act - call function to be tested
    let result  = Localisation.getDynamicLocalizedString(string , parameterMap ,serviceId, stringObject);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot Order id??::source=test-service&&&context=context of order id&&& groot#");

  })

  //testing getDynamicLocalizedString
  test('testing for missing key in resources file',  function () {

    // Arrange - arrange test data
    const string = "Last Updated On"
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.order_id_key_missing

    // Act - call function to be tested
    let result  = Localisation.getDynamicLocalizedString(string , parameterMap ,serviceId, stringObject);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot Last Updated On??::source=test-service&&& groot#")

  })

  //testing getDynamicLocalizedString
  test('testing for parameterized string',  function () {

    // Arrange - arrange test data
    const string = "Last Updated On {{time}}"
    const serviceId = "test-service"
    const parameterMap = {time: "5 pm"}
    const stringObject = resources.order_id

    // Act - call function to be tested
    let result  = Localisation.getDynamicLocalizedString(string , parameterMap ,serviceId, stringObject);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot Last Updated On {{time}}??::time=5 pm&&&source=test-service&&&context=context of order id&&& groot#");

  })

  //testing getDynamicLocalizedString
  test('testing with type missing',  function () {

    // Arrange - arrange test data
    const string = "Order id"
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.order_id_with_out_dynamic

    // Act - call function to be tested
    let result  = Localisation.getDynamicLocalizedString(string , parameterMap ,serviceId, stringObject);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot Order id??::source=test-service&&& groot#")

  })

  //testing getDynamicLocalizedString
  test('testing with missing context',  function () {

    // Arrange - arrange test data
    const string = "Order id"
    const serviceId = "test-service"
    const parameterMap = {}
    const stringObject = resources.order_id_with_out_context

    // Act - call function to be tested
    let result  = Localisation.getDynamicLocalizedString(string , parameterMap ,serviceId, stringObject);

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot Order id??::source=test-service&&& groot#")

  })
});