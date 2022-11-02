'use strict'

const TextSource = {
  resource: "resource",
  code: "code"
}

const Resources = {
  "last_updated_on": {source: TextSource.resource, value: "Last Updated On", context: "context of last updated on"},
  "last_updated_on_test": {source: TextSource.resource, value: "Last Updated On {{time}}", context: "context of Last Updated on"},
  "order_status": {source: TextSource.resource, value: "Order Status", context: "context of Order Status"},
  "view_order_details": {source: TextSource.resource, value: "View Order Details", context: "context of View Order Details"},
  "view_lead": {source: TextSource.resource, value: "View Lead", context: "context of View Lead"},
  "order_date": {source: TextSource.resource, value: "This is your order date"},
  "order_date_with_context": {source: TextSource.resource, value: "This is your order date", context: "context for order date"},
  "order_date_object": { value : "order date"},
  "order_date_empty_array": [],
  "order_date_empty_string": [""],
  "last_updated_type_wrong": {source: "constant", value: "This is your order date", context: "context for order date"},
  "last_updated_value_missing": {source: TextSource.resource, context: "context for order date"},
  "last_updated_value_empty": {source: TextSource.resource, value: "", context: "context of last updated on"},
  "last_updated_value_object": {source: TextSource.resource, value: { value : "Last Updated On"}, context: "context of last updated on"},
  "last_updated_type_missing": {value: "Last Updated On", context: "context of last updated on"},
  "last_updated_type_empty": {source: "", value: "Last Updated On", context: "context of last updated on"},
  "last_updated_on_with_special_character": {source: TextSource.resource, value: "Last Updated On value = test", context: "context of last updated on"},
  "last_updated_on_with_special_character_1": {source: TextSource.resource, value: "Last Updated On 'value = test'", context: "context of last updated on"},

  "order_id" : {source: TextSource.code, context: "context of order id"},
  "order_id_with_out_dynamic" : {context: "context of order id"},
  "order_id_with_out_context" : {source: TextSource.code,}
};

module.exports = Resources;