/**
    @module phront/data/main.mod/model/aws/secret
*/

var Target = require("montage/core/target").Target;

/**
 * @class Application
 * @extends Application
 *
 */

exports.UserPool = Target.specialize(/** @lends Application.prototype */ {

    name: {
        value: undefined
    },
    secret: {
        value: undefined
    },
    refreshTokenValidityValue: {
        value: undefined
    },
    accessTokenValidityValue: {
        value: undefined
    },
    idTokenValidityValue: {
        value: undefined
    },
    tokenValidityUnits: {
        value: undefined
    }
});
