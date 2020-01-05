var Target = require("montage/core/target").Target;
/**
 * @class UserIdentity
 * @extends Object
 */


exports.UserIdentity = Target.specialize(/** @lends UserIdentity.prototype */ {

    username: {
        value: undefined
    },
    password: {
        value: undefined
    },
    accountConfirmationCode: {
        value: undefined
    },
    isAccountConfirmed: {
        value: false
    },
    isAuthenticated: {
        value: false
    },
    isMfaEnabled: {
        value: false
    },
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
    image: {
        value: undefined
    },
    tags: {
        value: undefined
    },
    idToken: {
        value: undefined
    },
    accessToken: {
        value: undefined
    },
    mfaCode: {
        value: undefined
    }
});
