const helper = require('./../../../localisation/helper')

describe('testing localisation', () => {
  //describe divides test suites into components

  beforeAll(() => {
    /* Runs before all tests */

  });

  afterAll(()=>{
    /* Runs after all tests */
  });

  //testing doesStringContainsPlaceholder
  test('testing string containing correct placeholder',  function () {

    // Arrange - arrange test data
    let string = "#groot This is your order date groot#"

    // Act - call function to be tested
    let result  = helper.doesStringContainsPlaceholder(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual(true);
  })

  //testing doesStringContainsPlaceholder
  test('testing string containing wrong placeholder',  function () {

    // Arrange - arrange test data
    let string = "#groot This is your order date"

    // Act - call function to be tested
    let result  = helper.doesStringContainsPlaceholder(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual(false);

  })

  //testing doesStringContainsPlaceholder
  test('testing string containing wrong placeholder',  function () {

    // Arrange - arrange test data
    let string = "This is your order date groot#"

    // Act - call function to be tested
    let result  = helper.doesStringContainsPlaceholder(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual(false);

  })

  //testing doesStringContainsPlaceholder
  test('testing string without placeholder',  function () {

    // Arrange - arrange test data
    let string = "This is your order date"

    // Act - call function to be tested
    let result  = helper.doesStringContainsPlaceholder(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual(false);

  })

  // testing removeQueryStringAndPlaceholders
  test('testing constant string with placeholders',  function () {

    // Arrange - arrange test data
    let string = "#groot This is your order date groot#"

    // Act - call function to be tested
    let result  = helper.removeQueryStringAndPlaceholders(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result.value).toEqual("This is your order date");

  })

  // testing removeQueryStringAndPlaceholders
  test('testing constant string with placeholders and query string',  function () {

    // Arrange - arrange test data
    let string = "#groot This is your order date??::time=5 Pm&&& groot#"

    // Act - call function to be tested
    let result  = helper.removeQueryStringAndPlaceholders(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result.value).toEqual("This is your order date");

  })

  // testing removeQueryStringAndPlaceholders
  test('testing parameterized string with placeholders and query string',  function () {

    // Arrange - arrange test data
    let string = "#groot your order will reach at {{time}}??::time=5 Pm&&& groot#"

    // Act - call function to be tested
    let result  = helper.removeQueryStringAndPlaceholders(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result.value).toEqual("your order will reach at {{time}}");

  })

  // testing removeQueryStringAndPlaceholders
  test('testing parameterized string( having = as special character) with placeholders and query string',  function () {

    // Arrange - arrange test data
    let string = "#groot your order will time = time reach at {{time}}??::time=5 Pm&&& groot#"

    // Act - call function to be tested
    let result  = helper.removeQueryStringAndPlaceholders(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result.value).toEqual("your order will time = time reach at {{time}}");

  })

  // testing removeQueryStringAndPlaceholders
  test('testing parameterized string with placeholders and query string containing source and context',  function () {

    // Arrange - arrange test data
    let string = "#groot Last Updated On {{time}}??::time=5 PM&&&source=test-service&&&context=context of Last Updated on&&& groot#"

    // Act - call function to be tested
    let result  = helper.removeQueryStringAndPlaceholders(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result.value).toEqual("Last Updated On {{time}}");
    expect(result.source).toEqual("test-service");
    expect(result.context).toEqual("context of Last Updated on");

  })

  // testing removeQueryStringAndPlaceholders
  test('testing parameterized string having ?:: as special character',  function () {

    // Arrange - arrange test data
    let string = "#groot Last ?:: Updated On {{time}}??::time=5 PM&&&source=test-service&&& groot#"

    // Act - call function to be tested
    let result  = helper.removeQueryStringAndPlaceholders(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result.value).toEqual("Last ?:: Updated On {{time}}");
    expect(result.source).toEqual("test-service");

  })

  // testing removeQueryStringAndPlaceholders
  test('testing query string having & as special character',  function () {

    // Arrange - arrange test data
    let string = "#groot Last Updated On {{time}}??::time=5 & PM&&&source=test-service&&&context=context of Last Updated on&&& groot#"

    // Act - call function to be tested
    let result  = helper.removeQueryStringAndPlaceholders(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result.value).toEqual("Last Updated On {{time}}");

  })

  // testing removeQueryStringAndPlaceholders
  test('testing empty string',  function () {

    // Arrange - arrange test data
    let string = "#groot "

    // Act - call function to be tested
    let result  = helper.removeQueryStringAndPlaceholders(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result.value).toEqual("");

  })

  // testing replaceParameters
  test('testing replaceParameters for constant string',  function () {

    // Arrange - arrange test data
    let textWithParameters = "#groot Order Id??::source=inventory-service&&& groot#"
    let translatedValue = "आदेश ID"

    // Act - call function to be tested
    let result  = helper.replaceParameters(textWithParameters, translatedValue)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("आदेश ID");

  })

  // testing replaceParameters
  test('testing replaceParameters for parameterized string',  function () {

    // Arrange - arrange test data
    let textWithParameters = "#groot Last Updated On {{time}}??::time=5 PM&&&source=service-market&&&context=context of Last Updated on&&& groot#"
    let translatedValue = "पिछला नवीनीकरण {{time}}"

    // Act - call function to be tested
    let result  = helper.replaceParameters(textWithParameters,translatedValue)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("पिछला नवीनीकरण 5 PM");

  })

  test('testing replaceParameters for parameterized string with multiple occurences',  function () {

    // Arrange - arrange test data
    let textWithParameters = "#groot Last Updated On {{time}}{{time}}??::time=5&&&source=service-market&&&context=context of Last Updated on&&& groot#"
    let translatedValue = "पिछला नवीनीकरण {{time}}{{time}}"

    // Act - call function to be tested
    let result  = helper.replaceParameters(textWithParameters,translatedValue)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("पिछला नवीनीकरण 55");

  })

  // testing replaceParameters
  test('testing replaceParameters for constant string without query params',  function () {

    // Arrange - arrange test data
    let textWithParameters = "Order Status"
    let translatedValue = "आदेश की स्थिति"

    // Act - call function to be tested
    let result  = helper.replaceParameters(textWithParameters, translatedValue)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("आदेश की स्थिति");

  })

  // testing replaceParameters
  test('testing replaceParameters with special character & inside params',  function () {

    // Arrange - arrange test data
    let textWithParameters = "#groot Last Updated On {{time}}??::time=5 &PM&&&source=service-market&&&context=context of Last Updated on&&& groot#"
    let translatedValue = "पिछला नवीनीकरण {{time}}"

    // Act - call function to be tested
    let result  = helper.replaceParameters(textWithParameters,translatedValue)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("पिछला नवीनीकरण 5 &PM");

  })

  // testing removeQueryString

  test('testing removeQueryString having query string',  function () {

    // Arrange - arrange test data
    let stingWithQuery = "Last Updated On {{time}}??::time=5 &PM&&&source=service-market&&&context=context of Last Updated on&&&"

    // Act - call function to be tested
    let result  = helper.removeQueryString(stingWithQuery)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("Last Updated On {{time}}");

  })

  // testing removeQueryString
  test('testing removeQueryString without query string',  function () {

    // Arrange - arrange test data
    let stingWithQuery = "Last Updated On {{time}}"

    // Act - call function to be tested
    let result  = helper.removeQueryString(stingWithQuery)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("Last Updated On {{time}}");

  })

  // testing getParametersMap
  test('testing getParametersMap with query string',  function () {

    // Arrange - arrange test data
    let stingWithQuery = "Last Updated On {{time}}??::time=5 &PM&&&source=service-market&&&context=context of Last Updated on&&&"

    // Act - call function to be tested
    let result  = helper.getParametersMap(stingWithQuery)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result.time).toEqual("5 &PM");
    expect(result.source).toEqual("service-market");
    expect(result.context).toEqual("context of Last Updated on");
  })

  // testing getParametersMap
  test('testing getParametersMap with out query string',  function () {

    // Arrange - arrange test data
    let stingWithQuery = "Last Updated On {{time}}"

    // Act - call function to be tested
    let result  = helper.getParametersMap(stingWithQuery)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual({});
  })

  // testing getParametersMap
  test('testing getParametersMap with out query string',  function () {

    // Arrange - arrange test data
    let stingWithQuery = "Last Updated On {{time}}??::"

    // Act - call function to be tested
    let result  = helper.getParametersMap(stingWithQuery)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual({});
  })


  // testing getParametersMap
  test('testing getParametersMap with out query string &&&',  function () {

    // Arrange - arrange test data
    let stingWithQuery = "Last Updated On {{time}}??::&&&"

    // Act - call function to be tested
    let result  = helper.getParametersMap(stingWithQuery)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual({});
  })

});