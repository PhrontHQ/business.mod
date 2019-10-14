var Montage = require("montage").Montage;

/**
 * @class Vendor
 * @extends Montage
 */



 /*
     "tblOkWWuabfI0840w": {
        "$$hashKey": "object:4",
        "columns": [
            {
                "$$hashKey": "object:236",
                "id": "flddo550eB3n2fOi9",
                "name": "Name",
                "type": "text",
                "typeOptions": null
            },
            {
                "$$hashKey": "object:237",
                "foreignTable": "tblKVQ703nSQLPiam",
                "id": "fldy44MJYiS2xcljM",
                "name": "Product",
                "type": "foreignKey",
                "typeOptions": {
                    "foreignTableId": "tblKVQ703nSQLPiam",
                    "relationship": "many",
                    "symmetricColumnId": "fldpvvl4h2XvbHPaq"
                }
            },
            {
                "$$hashKey": "object:238",
                "id": "fldA0NuzGWatji6hO",
                "name": "Notes",
                "type": "multilineText",
                "typeOptions": null
            },
            {
                "$$hashKey": "object:239",
                "id": "fldp2XB6qc40y1NP8",
                "name": "Logo",
                "type": "multipleAttachment",
                "typeOptions": null
            },
            {
                "$$hashKey": "object:240",
                "foreignTable": "tblDMQemuOnmzBTfy",
                "id": "fldfIkJJBkE5c5qQd",
                "name": "Sales Contact",
                "type": "foreignKey",
                "typeOptions": {
                    "foreignTableId": "tblDMQemuOnmzBTfy",
                    "relationship": "many",
                    "symmetricColumnId": "fldOvRw326aapb01g"
                }
            },
            {
                "$$hashKey": "object:241",
                "id": "fldTCYJFEu26K6iTh",
                "name": "Vendor Phone Number",
                "type": "phone",
                "typeOptions": null
            },
            {
                "$$hashKey": "object:242",
                "id": "fldVMlxj4GL8m1Tzd",
                "name": "Closest Showroom Address",
                "type": "multilineText",
                "typeOptions": null
            },
            {
                "$$hashKey": "object:243",
                "id": "fld2Ce9QNVuuT3CYW",
                "name": "Catalog Link",
                "type": "text",
                "typeOptions": {
                    "validatorName": "url"
                }
            },
            {
                "$$hashKey": "object:244",
                "id": "flddOLljCHoesFETI",
                "name": "Shipping Details",
                "type": "multipleAttachment",
                "typeOptions": null
            }
        ],
        "defaultView": {
            "id": "viwBWSqhsH0bZ6Q2w",
            "name": "Main View"
        },
        "id": "tblOkWWuabfI0840w",
        "isEmpty": false,
        "isEmptyDueToFilter": false,
        "name": "Vendors",
        "nameForUrl": "vendors",
        "numRecordsToList": 3,
        "primaryColumnName": "Name"
    },
*/



exports.Vendor = Montage.specialize(/** @lends Vendor.prototype */ {

    firstName: {
        value: undefined
    },
    lastName: {
        value: undefined
    },
    email: {
        value: undefined
    },
    phone: {
        value: undefined
    },
    addresses: {
        value: undefined
    },
    orders: {
        value: undefined
    }

});