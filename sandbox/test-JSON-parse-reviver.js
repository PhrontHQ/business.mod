var aTestStr =
`{
    "root": {
        "prototype": "mod/core/meta/module-object-descriptor",
        "values": {
            "name": "Address",
            "propertyDescriptors": [
                {"@": "name"},
                {"@": "firstName"},
                {"@": "lastName"},
                {"@": "phone"},
                {"@": "company"},
                {"@": "address1"},
                {"@": "address2"},
                {"@": "locality"},
                {"@": "subLocality"},
                {"@": "primaryPostalCode"},
                {"@": "country"},
                {"@": "latitude"},
                {"@": "longitude"}
            ],
            "objectDescriptorModule": {
                "%": "data/main.mod/model/messaging-channel/postal-address.mjson"
            },
            "exportName": "Address",
            "module": {
                "%": "data/main.mod/model/messaging-channel/postal-address"
            },
            "object":{"@": "address"},
            "parent":{"@": "objectDescriptor"}
        }
    },
    "address": {
        "object": "data/main.mod/model/messaging-channel/postal-address"
    },
    "objectDescriptor": {
        "object": "data/main.mod/model/data-object.mjson"
    },
    "name": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "name",
            "valueType": "string"
        }
    },
    "firstName": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "firstName",
            "valueType": "string"
        }
    },
    "lastName": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "lastName",
            "valueType": "string"
        }
    },
        "phone": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "phone",
            "valueType": "string"
        }
    },
    "company": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "company",
            "valueType": "string"
        }
    },
    "address1": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "address1",
            "valueType": "string"
        }
    },
    "address2": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "address2",
            "valueType": "string"
        }
    },
    "locality": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "locality",
            "valueType": "string"
        }
    },
    "subLocality": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "subLocality",
            "valueType": "string"
        }
    },
    "primaryPostalCode": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "primaryPostalCode",
            "valueType": "string"
        }
    },
    "country": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "country",
            "valueType": "string"
        }
    },
    "latitude": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "latitude",
            "valueType": "number"
        }
    },
    "longitude": {
        "prototype": "mod/core/meta/property-descriptor",
        "values": {
            "name": "longitude",
            "valueType": "number"
        }
    }

}`;

/*
    would using a Proxy help during reviving for future objects like {"@": "name"} ?
*/


var prototypeOwner = null;
var prototypeOwnerValues = null;
var prototypeOwnerListeners = null;
var objectPath = [];

var aTestObj = JSON.parse(aTestStr, function(key, value) {
    //console.log("key:",key,", value:", JSON.stringify(value));
    //at this point, this refers to the object being revived
    //E.g., when key == 'prop1', this is an object with prop1 and prop2
    //when key == prop2B, this is an object with prop2A, prop2B and prop2C
    //So is this code reliable?
    if (key === "prototype"/* or object or value */) {
        prototypeOwner = this;
        objectPath.push(this);
        console.log("prototype/object is "+value);
        //Do something, add a prop to this:
        //this.prop2BDif = 100 - this.prop2B;
    }

    else if (key === "values" && prototypeOwner === this) {
        prototypeOwnerValues = this;
        console.log("values block is "+JSON.stringify(value));
        //Do something, add a prop to this:
        //this.prop2BDif = 100 - this.prop2B;
    }
    else if (key === "listeners" && prototypeOwner === this) {
        prototypeOwnerListeners = this;
        console.log("listeners block is "+JSON.stringify(value));
        //Do something, add a prop to this:
        //this.prop2BDif = 100 - this.prop2B;
    }
    else if(prototypeOwnerValues === this) {
        console.log("values key:",key,", value:", JSON.stringify(value));
    }
    else  {
        console.log("key:",key,", value:", JSON.stringify(value));
    }

    return value;
});

console.log("aTestObj is :",aTestObj);
