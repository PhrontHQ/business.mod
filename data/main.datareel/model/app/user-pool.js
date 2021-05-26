/**
    @module phront/data/main.datareel/model/aws/secret
*/

var DataObject = require("../data-object").DataObject;

/**
 * @class UserPool
 * @extends UserPool
 *
 * An UserPool creates the structure to host collections of users, app clients, devices
 * that typically belongs to an organization. There might be multiple reason and strategies
 * for on party (Organization, person) to use multiple pools.
 *
 */

exports.UserPool = DataObject.specialize(/** @lends UserPool.prototype */ {

    name: {
        value: undefined
    },
    applications: {
        value: undefined
    }
});
