/**
    @module business-data.mod/data/main.mod/model/app/app-client
*/

var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class AppClient
 * @extends DataObject
 *
 * An AppClient is the representatiom/registration of an application for the sake of authentication and authorization.
 *
 * A User Pool can be provided by external services, in which case this acts as a cache.
 */

exports.AppClient = DataObject.specialize(/** @lends Application.prototype */ {
    constructor: {
        value: function AppClient() {
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
