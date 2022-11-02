const stringObjectExtractor = require('./../../../localisation/string_object_extractor')
const stringsToBeTranslated = require('../resources/localization.request.test.data.json')

describe('testing localisation', () => {
  //describe divides test suites into components

  beforeAll(() => {
    /* Runs before all tests */

  });

  afterAll(()=>{
    /* Runs after all tests */
  });

  //testing extractStringObjects
  test('testing source and value',  function () {

    // Act - call function to be tested
    let resultArray = stringObjectExtractor.extractStringObjects(stringsToBeTranslated)

    // Assert - validate received result with expected result using `expect` matchers
    let firstResult = resultArray[0]
    expect(firstResult.source).toEqual("inventory-service");
    expect(firstResult.value).toEqual("Order Id");

  })

  //testing extractStringObjects
  test('testing source and value',  function () {

    // Act - call function to be tested
    let resultArray = stringObjectExtractor.extractStringObjects(stringsToBeTranslated)

    // Assert - validate received result with expected result using `expect` matchers
    let secondResult = resultArray[1]
    expect(secondResult.source).toEqual("service-market");
    expect(secondResult.value).toEqual("Order Date");

  })

  //testing extractStringObjects
  test('testing parameterized string',  function () {

    // Act - call function to be tested
    let resultArray = stringObjectExtractor.extractStringObjects(stringsToBeTranslated)

    // Assert - validate received result with expected result using `expect` matchers
    let thirdResult = resultArray[2]
    expect(thirdResult.source).toEqual("service-market");
    expect(thirdResult.value).toEqual("Last Updated On {{time}}");
    expect(thirdResult.context).toEqual("context of Last Updated on");

  })

  //testing extractStringObjects
  test('testing constant string',  function () {

    // Act - call function to be tested
    let resultArray = stringObjectExtractor.extractStringObjects(stringsToBeTranslated)

    // Assert - validate received result with expected result using `expect` matchers
    let fourthResult = resultArray[3]
    expect(fourthResult.source).toEqual("service-market");
    expect(fourthResult.value).toEqual("Order Status");
    expect(fourthResult.context).toEqual("context of Order Status");

  })

  //testing extractStringObjects
  test('testing nested constant string',  function () {

    // Act - call function to be tested
    let resultArray = stringObjectExtractor.extractStringObjects(stringsToBeTranslated)

    // Assert - validate received result with expected result using `expect` matchers
    let fifthResult = resultArray[4]
    expect(fifthResult.source).toEqual("service-market");
    expect(fifthResult.value).toEqual("View Order Details");
    expect(fifthResult.context).toEqual("context of View Order Details");
  })

  //testing extractStringObjects
  test('testing recursion breaker for level 14',  function () {

    // Act - call function to be tested
    let resultArray = stringObjectExtractor.extractStringObjects(stringsToBeTranslated)

    // Assert - validate received result with expected result using `expect` matchers
    let fifthResult = resultArray[5]
    expect(fifthResult.value).toEqual("Nested text 14");

  })

  //testing extractStringObjects
  test('testing recursion breaker for level 15',  function () {

    // Act - call function to be tested
    let resultArray = stringObjectExtractor.extractStringObjects(stringsToBeTranslated)

    // Assert - validate received result with expected result using `expect` matchers
    let fifthResult = resultArray[6]
    expect(fifthResult.value).toEqual("Nested text 15");
  })

});