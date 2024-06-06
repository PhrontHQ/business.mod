var AuthenticationPanel = require("mod/ui/authentication-panel").AuthenticationPanel;

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
    },

    enterDocument: {
        value: function (firstTime) {
            var params;
            if (firstTime) {
                /*
                Ideally we don't want authentication panel to have to
                imperatively get the parameters, it should just have the
                parameters it is interested in passed to it. Maybe this
                component just "declares" which parameters it's interested in
                up front, and they will be passed to it automatically.

                OR
                perhaps parameters shouldn't be given to components, and
                anything that can be controlled by a parameter from the URL
                should just be in our application's data model? It would
                certainly reduce the complexity of tracking an entire app's
                state and recording it + exposing the right parts via URL
                params.
                */
                params = this.params;
                if (params.username && params.confirmationCode) {
                    this.userIdentity.username = params.username;
                    this.userIdentity.accountConfirmationCode = params.confirmationCode;
                    // with a smarter substitution value we should just show the
                    // enterVerificationCode as soon as we see that the user
                    // needs to be confirmed
                    this.substitutionPanel = "enterVerificationCode";
                }
            }
        }
    },

    exitDocument: {
        value: function () {
            var params = this.params;
            if (params.username || params.confirmationCode) {
                params = Object.assign({}, params, {
                    username: undefined,
                    confirmationCode: undefined
                });
                this.params = params;
            }
        }
    },

    /*
    The following parameter APIs don't belong here.
    It seems like montage application should be the one to handle
    parameters, reading them from the URL and setting the history
    state accordingly when our application updates these parameters.
    In Node these parameters would be derived from the process argv,
    though that seems like a less important use case.
    */

    params: {
        get: function () {
            if (!this._params) {
                if (typeof window !== "undefined") {
                    this._params = this._getUrlParams();
                } else {
                    this._params = {};
                }
            }
            return this._params;
        },
        set: function (value) {
            if (value !== this._params) {
                this._params = value;
                if (typeof window !== "undefined") {
                    this._setUrlParams(value);
                }
            }
        }
    },

    _getUrlParams: {
        value: function () {
            var search = window.location.search,
                map = {},
                parts;
            if (search) {
                parts = search.slice(1).split("&");
                parts.forEach(function (part) {
                    var entry = part.split("=");
                    if (entry.length === 2) {
                        map[entry[0]] = entry[1];
                    } else if (entry.length === 1) {
                        map[entry[0]] = true;
                    }
                });
            }
            return map;
        }
    },

    _setUrlParams: {
        value: function (params) {
            var parts, search;
            if (params && typeof params === "object") {
                parts = [];
                Object.keys(params).forEach(function (key) {
                    var value = params[key],
                        entry;
                    if (typeof value !== "undefined") {
                        var entry = encodeURIComponent(key);
                        entry += "=";
                        entry += encodeURIComponent(value);
                        parts.push(entry);
                    }
                });
                search = "?";
                search += parts.join("&");
                window.history.replaceState({}, document.title, search);
            }
        }
    }
});
