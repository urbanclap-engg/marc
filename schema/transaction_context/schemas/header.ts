export const HeaderSchema = {
  "$schema": "http://json-schema.org/draft-06/schema#",
  "type": "object",
  "properties": {
    "auth": {
      "type": "object",
      "properties": {
        "success": { "type": ["string", "null"]},
        "id": { "type": ["string"]},
        "id_type": { "type": ["string"]},
        "subRole": { "type": ["string", "null"]},
        "resource": {
          "type": "object",
          "properties": {}
        },
        "userData": {
          "type": "object",
          "properties": {
            "name": { "type": ["string", "null"]},
            "email": { "type": ["string", "null"]},
            "is_active": { "type": ["string", "null"]},
            "role": { "type": ["string", "null"]},
            "team": { "type": ["string", "null"]},
            "handy_home": { "type": ["string", "null"]}
          }
        },
        "token": { "type": ["string", "null"] }
      }
    },
    "authorization": { "type": ["string", "null"] },
    "cookie": { "type": ["string", "null"]},
    "x-version-name": { "type": ["string", "null"]},
    "x-device-os": { "type": ["string", "null"]},
    "x-device-os-version": { "type": ["string", "null"]},
    "x-device-id": { "type": ["string", "null"]},
    "x-advertising-id": { "type": ["string", "null"]},
    "x-device-guid": { "type": ["string", "null"]},
    "x-version-code": { "type": ["string", "null"]},
    "x-env-code": { "type": ["string", "null"]},
    "x-env-os": { "type": ["string", "null"]},
    "x-preferred-language": { "type": ["string", "null"]},
    "user-agent": { "type": ["string", "null"]},
    "x-test-login": { "type": ["string", "null"] },
    "x-third-party-source": { "type": ["string", "null"]},
    "x-third-party-token": { "type": ["string", "null"]},
    "x-third-party-referrer": { "type": ["string", "null"]},
    "x-shopify-hmac-sha256": { "type": ["string", "null"]},
    "x-shopify-shop-domain": { "type": ["string", "null"]},
    "x-airtel-auth": { "type": ["string", "null"]},
    "x-minion-id": { "type": ["string", "null"]},
    "react-bundle-version": { "type": ["string", "null"]},
    "x-forwarded-for": { "type": ["string", "null"] },
    "x-client-google-script-auth": { "type": ["string", "null"] },
    "x-detected-city": { "type": ["string", "null"] },
    "x-detected-country": { "type": ["string", "null"] },
    "x-detected-geoip-city": { "type": ["string", "null"] },
    'x-override-servers': { "type": ["string", "null"] },
  },
  "additionalProperties": false
}