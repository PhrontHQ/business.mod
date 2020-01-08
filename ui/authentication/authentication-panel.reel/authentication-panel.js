var AuthenticationPanel = require("montage/ui/authentication-panel").AuthenticationPanel;

/**
 * @class AuthenticationPanel
 * @extends Component
 */
exports.AuthenticationPanel = AuthenticationPanel.specialize(/** @lends AuthenticationPanel# */ {
    _userIdentity: {
        value: undefined
    },

    userIdentity: {
        get: function () {
            return this._userIdentity;
        },
        set: function(value) {
            this._userIdentity = value;
            if(!value || (value && !value.username)) {
                this.substitutionPanel = "signUp";
            }
        }
    },

    _needsChangePassword: {
        value: false
    },
    needsChangePassword: {
        get: function() {
            return this._needsChangePassword;
        },
        set: function(value) {
            if(!this._needsChangePassword && value) {
                this.substitutionPanel = "createNewPassword";
            }
            this._needsChangePassword = value;
        }
    },

    _needsAccountConfirmation: {
        value: false
    },
    needsAccountConfirmation: {
        get: function() {
            return this._needsAccountConfirmation;
        },
        set: function(value) {
            if(!this._needsAccountConfirmation && value) {
                this.substitutionPanel = "enterVerificationCode";
            }
            this._needsAccountConfirmation = value;
        }
    },

    needsMfaCode: {
        get: function () {
            return this._needsMfaCode;
        },
        set: function (value) {
            if (!this._needsMfaCode && value) {
                this.substitutionPanel = "enterMfaCode";
            }
            this._needsMfaCode = value;
        }
    },

    substitutionPanel: {
        value: "signIn"
    }

});
