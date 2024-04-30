/**
    @module business-data.mod/data/main.mod/model/aws/secret
*/

var DataObject = require("montage/data/model/data-object").DataObject;

/**
 * @class Application
 * @extends Application
 *
 * An application is an instance of a project configured to run for a certain organization.
 *
 * The same source application could be configured differently
 * and at some point needs to be "owned" by an organization.
 * Needs to add source project aspects - like the GitHub project URL/ID
 *
 */

exports.Application = DataObject.specialize(/** @lends Application.prototype */ {
    constructor: {
        value: function Application() {
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
    controllingParty: {
        value: undefined
    },
    cognitoAppClient: {
        value: undefined
    },
    userPool: {
        value: undefined
    }
});
