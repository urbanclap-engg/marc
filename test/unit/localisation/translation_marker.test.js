const translationMarker = require('./../../../localisation/translation_marker')

describe('testing localisation', () => {
  //describe divides test suites into components

  beforeAll(() => {
    /* Runs before all tests */

  });

  afterAll(()=>{
    /* Runs after all tests */
  });

  //testing translation_marker
  test('testing markForTranslation for constant string',  function () {

    // Arrange - arrange test data
    let string = "This is your order date"

    // Act - call function to be tested
    let result  = translationMarker.markForTranslation(string)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot This is your order date groot#");

  })

  //testing translation_marker
  test('testing markForTranslation for 1 parameter',  function () {

    // Arrange - arrange test data
    let string = "This is your order date"
    let keyValueMap = {time : "5 Pm"}

    // Act - call function to be tested
    let result  = translationMarker.markForTranslation(string, keyValueMap)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot This is your order date??::time=5 Pm&&& groot#");

  })

  //testing translation_marker
  test('testing markForTranslation for 2 parameters',  function () {

    // Arrange - arrange test data
    let string = "This is your order date"
    let keyValueMap = {time : "5 Pm", order_no : "151"}

    // Act - call function to be tested
    let result  = translationMarker.markForTranslation(string, keyValueMap)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot This is your order date??::time=5 Pm&&&order_no=151&&& groot#");

  })

  //testing translation_marker
  test('testing markForTranslation for special character ?:',  function () {

    // Arrange - arrange test data
    let string = "This is your ?:order date"
    let keyValueMap = {time : "5 Pm", order_no : "151"}

    // Act - call function to be tested
    let result  = translationMarker.markForTranslation(string, keyValueMap)

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot This is your ?:order date??::time=5 Pm&&&order_no=151&&& groot#");

  })

  //testing translation_marker
  test('testing markForTranslation for already marked string',  function () {

    // Arrange - arrange test data
    let string = "#groot This is your order date??::time=5 Pm&&&order_no=151&&& groot#"

    // Act - call function to be tested
    let result  = translationMarker.markForTranslation(string, {})

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot This is your order date??::time=5 Pm&&&order_no=151&&& groot#");

  })

  //testing translation_marker
  test('testing markForTranslation for already marked string (parameterized)',  function () {

    // Arrange - arrange test data
    let string = "#groot {{partner}} order number is {{order_no}}??::partner=partner_name&&& groot#"

    // Act - call function to be tested
    let result  = translationMarker.markForTranslation(string, {order_no : 151})

    // Assert - validate received result with expected result using `expect` matchers
    expect(result).toEqual("#groot {{partner}} order number is {{order_no}}??::order_no=151&&&partner=partner_name&&& groot#");

  })
});