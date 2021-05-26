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

    name: {
        value: undefined
    },
    identifier: {
        value: undefined
    },
    credentials: {
        value: undefined
    },
    controllingParty: {
        value: undefined
    },
    cognitouserPoolClient: {
        value: undefined
    },
    userPool: {
        value: undefined
    }
});
