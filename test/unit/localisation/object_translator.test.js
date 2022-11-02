
const stringsToBeTranslated = require('../resources/localization.request.test.data.json')
const valueToTranslationMap = require('../resources/groot.response.test.data.json')
const translatedObjectCreator = require('../../../localisation/object_translator')

describe('testing localisation', () => {
  //describe divides test suites into components

  beforeAll(() => {
    /* Runs before all tests */

  });

  afterAll(()=>{
    /* Runs after all tests */
  });

  //testing translated object creator
  test('testing constant string',  function () {

    // Act - call function to be tested
    translatedObjectCreator.createTranslatedObject(stringsToBeTranslated, valueToTranslationMap)

    // Assert - validate received result with expected result using `expect` matchers
    let firstOrder = stringsToBeTranslated.orders[0]
    expect(firstOrder.order_id_label).toEqual("Order Id");

  })

  //testing translated object creator
  test('testing parameterized string',  function () {

    // Act - call function to be tested
    translatedObjectCreator.createTranslatedObject(stringsToBeTranslated, valueToTranslationMap)

    // Assert - validate received result with expected result using `expect` matchers
    let firstOrder = stringsToBeTranslated.orders[0]
    expect(firstOrder.last_updated_str).toEqual("Last Updated On 5 PM");
  })

  //testing translated object creator
  test('testing nested constant string',  function () {

    // Act - call function to be tested
    translatedObjectCreator.createTranslatedObject(stringsToBeTranslated, valueToTranslationMap)

    // Assert - validate received result with expected result using `expect` matchers
    let firstOrder = stringsToBeTranslated.orders[0]
    expect(firstOrder.action.cta_text.display_text).toEqual("View Order Details");
  })

  //testing translated object creator
  test('testing recursion breaker for level 14',  function () {

    // Act - call function to be tested
    translatedObjectCreator.createTranslatedObject(stringsToBeTranslated, valueToTranslationMap)

    // Assert - validate received result with expected result using `expect` matchers
    let firstOrder = stringsToBeTranslated.orders[0]
    expect(firstOrder.level2.level3.level4.level5.level6.level7.level8.level9.level10.level11.level12.level13.nested_text_14).toEqual("Nested text 14");
  })

  //testing translated object creator
  test('testing recursion breaker for level 15',  function () {

    // Act - call function to be tested
    translatedObjectCreator.createTranslatedObject(stringsToBeTranslated, valueToTranslationMap)

    // Assert - validate received result with expected result using `expect` matchers
    let firstOrder = stringsToBeTranslated.orders[0]
    expect(firstOrder.level2.level3.level4.level5.level6.level7.level8.level9.level10.level11.level12.level13.level14.nested_text_15).toEqual("Nested text 15");
  })
});