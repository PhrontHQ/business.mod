var MessagingChannel = require("./messaging-channel").MessagingChannel;

/**
 * @class Address
 * @extends MessagingChannel
 */

 /*
    from https://tools.ietf.org/id/draft-stepanek-jscontact-00.html#rfc.section.1.2

    An Address object has the following properties:

type: String Specifies the context of the address information. This MUST be taken from the set of values allowed (see above).
    -> Types are:
"home" An address of a residence associated with the person.
"work" An address of a workplace associated with the person.
"billing" An address to be used with billing associated with the person.
"postal" An address to be used for delivering physical items to the person.
"other" An address not covered by the above categories.

label: String (optional) A label describing the value in more detail, especially if type === "other" (but MAY be included with any type).

street: String (optional) The street address. This MAY be multiple lines; newlines MUST be preserved.
locality: String (optional) The city, town, village, post town, or other locality within which the street address may be found.
region: String (optional) The province, such as a state, county, or canton within which the locality may be found.
postcode: String (optional) The postal code, post code, ZIP code or other short code associated with the address by the relevant country's postal system.
country: String (optional) The country name.
isDefault: Boolean (optional, default: false) Whether this Address is the default for its type. This SHOULD only be one per type.


Sample from SmartyStreet international API
https://smartystreets.com/docs/cloud/international-street-api


curl -v "https://international-street.api.smartystreets.com/verify?auth-id=21102174564513388&country=US&address1=4750%20Manitoba%20Dr&locality=San%20Jose&administrative_area=CA&postal_code=95130&geocode=true"
[
  {
    "address1": "4750 Manitoba Dr",
    "address2": "San Jose CA 95130-2223",
    "components": {
      "administrative_area": "CA",
      "sub_administrative_area": "Santa Clara",
      "country_iso_3": "USA",
      "locality": "San Jose",
      "postal_code": "951302223",
      "postal_code_short": "95130",
      "postal_code_extra": "2223",
      "premise": "4750",
      "premise_number": "4750",
      "thoroughfare": "Manitoba Dr",
      "thoroughfare_name": "Manitoba",
      "thoroughfare_type": "Dr",
      "thoroughfare_trailing_type": "Dr"
    },
    "metadata": {
      "latitude": 37.27368,
      "longitude": -121.98375,
      "geocode_precision": "Premise"
    },
    "analysis": {
      "verification_status": "Verified",
      "address_precision": "DeliveryPoint",
      "changes": {
        "components": {}
      }
    }
  }
]

curl -v "https://international-street.api.smartystreets.com/verify?auth-id=21102174564513388&country=France&address1=26%20bis%20Avenue%20Daumesnil&locality=Paris&administrative_area=&postal_code=75012"

[
  {
    "address1": "26 Bis Avenue Daumesnil",
    "address2": "12E ARRONDISSEMENT",
    "address3": "75012 PARIS",
    "components": {
      "super_administrative_area": "Île-De-France",
      "administrative_area": "Paris",
      "country_iso_3": "FRA",
      "locality": "PARIS",
      "dependent_locality": "12E ARRONDISSEMENT",
      "postal_code": "75012",
      "postal_code_short": "75012",
      "premise": "26 Bis",
      "premise_number": "26 Bis",
      "thoroughfare": "Avenue Daumesnil"
    },
    "metadata": {
      "address_format": "premise thoroughfare|dependent_locality|postal_code locality"
    },
    "analysis": {
      "verification_status": "Verified",
      "address_precision": "Premise",
      "max_address_precision": "DeliveryPoint",
      "changes": {
        "address1": "Verified-SmallChange",
        "address2": "Verified-SmallChange",
        "address3": "Verified-SmallChange",
        "components": {
          "super_administrative_area": "Added",
          "administrative_area": "Added",
          "country_iso_3": "Added",
          "locality": "Verified-NoChange",
          "dependent_locality": "Added",
          "postal_code": "Verified-NoChange",
          "postal_code_short": "Verified-NoChange",
          "premise": "Verified-NoChange",
          "premise_number": "Verified-NoChange",
          "thoroughfare": "Verified-NoChange"
        }
      }
    }
  }
]

going to use sublocality term instead of dependent_locality in smartstreets

melissa.com:
Address Verify Results
Address	4750 Manitoba Dr
City	San Jose
State	CA
ZIP Code	95130-2223
GeoCode for ZIP Code 95130-2223
Latitude	37.273559
Longitude	-121.983792
County Name	Santa Clara
County FIPS Code	06085
Census Tract Code	506604
Census Block Code	4001
Congressional District Code	18
Place	San Jose
State	CA
Carrier Route	C004

*/


exports.PostalAddress = MessagingChannel.specialize(/** @lends PostalAddress.prototype */ {

    addressee: {
        value: undefined
    },
    name: {
        value: undefined
    },
    firstName: {
        value: undefined
    },
    lastName: {
        value: undefined
    },
    phoneNumber: {
        value: undefined
    },
    streetAddress: {
        value: undefined
    },
    formattedAddressLines: {
        value: undefined
    },
    premise: {
        value: undefined
    },
    premiseDetails: {
        value: undefined
    },
    thoroughfare: {
        value: undefined
    },
    locality: {
        value: undefined
    },
    subLocality: {
        value: undefined
    },
    administrativeArea: {
        value: undefined
    },
    superAdministrativeArea: {
        value: undefined
    },
    subAdministrativeArea: {
        value: undefined
    },
    primaryPostalCode: {
        value: undefined
    },
    secondaryPostalCode: {
        value: undefined
    },
    country: {
        value: undefined
    },

    /**
     * The geographic position of the address, as a
     *
     *  "geo.mod/logic/model/descriptors/geometry.mjson"
     *     *
     * @property {Geometry}
     */

    location: {
        value: undefined
    },
    timeZone: {
        value: undefined
    }
});
