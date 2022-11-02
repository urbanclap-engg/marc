export const TABLE_NAMES_LIST = [
  'CategoryClusterStores', 'CategoryClusters', 'EbceDeliveredStores',
  'OtpStores', 'ProviderAggregatesStores', 'ProviderAggregatesStoresOld'
];

export const TABLE_LIST_QUERY_RESULT = [
  {Tables_in_hiring_data: 'CategoryClusterStores'},
  {Tables_in_hiring_data: 'CategoryClusters'},
  {Tables_in_hiring_data: 'EbceDeliveredStores'},
  {Tables_in_hiring_data: 'OtpStores'},
  {Tables_in_hiring_data: 'ProviderAggregatesStores'},
  {Tables_in_hiring_data: 'ProviderAggregatesStoresOld'}
];

export const MYSQL_SCHEMA = [
  [
    {
      "Field": "id",
      "Type": "bigint(20)",
      "Null": "NO",
      "Key": "PRI",
      "Default": null,
      "Extra": "auto_increment"
    },
    {
      "Field": "uuid",
      "Type": "varchar(31)",
      "Null": "NO",
      "Key": "UNI",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "reviewee_id",
      "Type": "varchar(255)",
      "Null": "NO",
      "Key": "MUL",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "reviewee_user_type",
      "Type": "enum('customer','provider','urbanclap')",
      "Null": "NO",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "reviewer_id",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "MUL",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "reviewer_user_type",
      "Type": "enum('customer','provider','urbanclap')",
      "Null": "NO",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "reviewer_name",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "reviewer_phone",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "request_id",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "MUL",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "request_category_key",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "MUL",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "request_city_key",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "rating",
      "Type": "float",
      "Null": "NO",
      "Key": "",
      "Default": "5",
      "Extra": ""
    },
    {
      "Field": "content",
      "Type": "text",
      "Null": "YES",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "content_length",
      "Type": "int(11)",
      "Null": "YES",
      "Key": "",
      "Default": "0",
      "Extra": ""
    },
    {
      "Field": "status",
      "Type": "enum('unapproved_pending_verification','unapproved','auto_approved','approved','archived')",
      "Null": "NO",
      "Key": "MUL",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "status_updated_at",
      "Type": "datetime",
      "Null": "YES",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "review_tags",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "fq_option_id",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "created_by",
      "Type": "varchar(255)",
      "Null": "NO",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "updated_by",
      "Type": "varchar(255)",
      "Null": "NO",
      "Key": "",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "createdAt",
      "Type": "datetime",
      "Null": "NO",
      "Key": "MUL",
      "Default": "CURRENT_TIMESTAMP(3)",
      "Extra": ""
    },
    {
      "Field": "updatedAt",
      "Type": "datetime",
      "Null": "NO",
      "Key": "MUL",
      "Default": null,
      "Extra": ""
    }
  ]
];

export const JSON_SCHEMA = {
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "default": undefined
    },
    "uuid": {
      "type": "string",
      "default": undefined
    },
    "reviewee_id": {
      "type": "string",
      "default": undefined
    },
    "reviewee_user_type": {
      "type": "string",
      "default": undefined
    },
    "reviewer_id": {
      "type": "string",
      "default": undefined
    },
    "reviewer_user_type": {
      "type": "string",
      "default": undefined
    },
    "reviewer_name": {
      "type": "string",
      "default": undefined
    },
    "reviewer_phone": {
      "type": "string",
      "default": undefined
    },
    "request_id": {
      "type": "string",
      "default": undefined
    },
    "request_category_key": {
      "type": "string",
      "default": undefined
    },
    "rating": {
      "type": "number",
      "default": 5
    },
    "content": {
      "type": "string",
      "default": undefined
    },
    "content_length": {
      "type": "integer",
      "default": 0
    },
    "status": {
      "type": "string",
      "default": undefined
    },
    "status_updated_at": {
      "type": "string",
      "default": undefined
    },
    "review_tags": {
      "type": "string",
      "default": undefined
    },
    "fq_option_id": {
      "type": "string",
      "default": undefined
    },
    "created_by": {
      "type": "string",
      "default": undefined
    },
    "updated_by": {
      "type": "string",
      "default": undefined
    },
    "createdAt": {
      "type": "string",
      "default": "CURRENT_TIMESTAMP(3)"
    },
    "updatedAt": {
      "type": "string",
      "default": undefined
    },
    "request_city_key": {
      "type": "string",
      "default": undefined
    }
  },
  "required": [
    "id",
    "uuid",
    "reviewee_id",
    "reviewee_user_type",
    "reviewer_user_type",
    "rating",
    "status",
    "created_by",
    "updated_by",
    "createdAt",
    "updatedAt"
  ]
};