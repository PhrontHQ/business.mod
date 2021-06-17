/**
    @module phront/data/main.datareel/model/aws/secret
*/

var DataObject = require("../data-object").DataObject;

/**
 * @class UserPoolClient
 * @extends DataObject
 *
 * A UserPoolClient is the representatiom/registration of an  Application
 * in a UserPool for the sake of authentication.
 *
 * A User Pool can be provided by external services, in which case this acts as a cache.
 */

exports.UserPoolClient = DataObject.specialize(/** @lends Application.prototype */ {
    constructor: {
        value: function UserPoolClient() {
            this.super();
            return this;
        }
    },
    name: {
        value: undefined
    },
    identifier: {
        value: undefined
    },
    credentials: {
        value: undefined
    },
    cognitoUserPoolClient: {
        value: undefined
    },
    userPool: {
        value: undefined
    }
});
