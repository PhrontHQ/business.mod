var Component = require("mod/ui/component").Component,
    KeyComposer = require("mod/composer/key-composer").KeyComposer,
    DataOperation = require("mod/data/service/data-operation").DataOperation;

var SignIn = exports.SignIn = Component.specialize({

    _isFirstTransitionEnd: {
        value: true
    },

    username: {
        value: void 0
    },

    password: {
        value: void 0
    },

    signInButton: {
        value: void 0
    },

    passwordTextField: {
        value: void 0
    },

    usernameTextField: {
        value: void 0
    },

    hasError: {
        value: false
    },

    hadError: {
        value: false
    },

    _errorMessage: {
        value: null
    },

    errorMessage: {
        get: function () {
            return this._errorMessage;
        },
        set: function (errorMessage) {
            this._errorMessage = errorMessage;
            this.hasError = !!errorMessage;
        }
    },

    isAuthenticating: {
        value: false
    },

    __keyComposer: {
        value: null
    },

    _keyComposer: {
        get: function () {
            if (!this.__keyComposer) {
                this.__keyComposer = new KeyComposer();
                this.__keyComposer.keys = "enter";
                this.__keyComposer.identifier = "enter";
                this.addComposerForElement(this.__keyComposer, this.element.ownerDocument.defaultView);
            }

            return this.__keyComposer;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.addEventListener("transitionend", this, false);
            }
            this.addEventListener("action", this, false);
            this._keyComposer.addEventListener("keyPress", this, false);
            // checks for disconnected hash
            if (location.href.indexOf(";disconnected") > -1) {
                this.hasError = true;
                this.errorMessage = "Oops! Your token has expired. \n Please log back in.";
                location.href = location.href.replace(/;disconnected/g, '');
            }
            if (this.userIdentity && this.userIdentity.isAccountConfirmed) {
                this.informationMessage = "Your account has been confirmed. Please sign in to continue.";
            }
            this.usernameTextField.focus();
            this.defineBinding("username", {"<->": "userIdentity.username"});
            this.defineBinding("password", {"<->": "userIdentity.password"});
        }
    },

    exitDocument: {
        value: function () {
            this.removeEventListener("action", this, false);
            this._keyComposer.removeEventListener("keyPress", this, false);
            // cancel bindings first to clear the username/password from this
            // component's memory without mutating the user identity
            this.cancelBinding("username");
            this.cancelBinding("password");
            self.username = self.password = null;
        }
    },

    handleKeyPress: {
        value: function (event) {
            if (event.identifier === "enter") {
                this.handleSignInAction();
            }
        }
    },

    handleSignInAction: {
        value: function() {
            var self = this;
            this.isAuthenticating = true;
            this.hadError = false;
            this.informationMessage = null;
            this.application.mainService.saveDataObject(this.userIdentity)
            .catch(function (error) {
                if (error instanceof DataOperation && error.type === DataOperation.Type.UserAuthenticationFailed) {
                    self.hadError = true;
                    self.errorMessage = error.userMessage;
                } else if (error instanceof DataOperation && error.data.hasOwnProperty("accountConfirmationCode")) {
                    self.ownerComponent.needsAccountConfirmation = true;
                    self.hadError = true;
                } else if (error instanceof DataOperation && error.data.hasOwnProperty("password")) {
                    self.ownerComponent.needsChangePassword = true;
                } else if (error instanceof DataOperation && error.data.hasOwnProperty("mfaCode")) {
                    self.ownerComponent.needsMfaCode = true;
                } else {
                    self.errorMessage = error.message || error;
                    self.hadError = true;
                }
            }).finally(function () {
                if (self.errorMessage) {
                    self.element.addEventListener(
                        typeof WebKitAnimationEvent !== "undefined" ? "webkitAnimationEnd" : "animationend", self, false
                    );
                }
                self.isAuthenticating = false;
            });
        }
    },

    handleTransitionend: {
        value: function (e) {
            if (this.ownerComponent.userIdentity.isAuthenticated && e.target == this.element && e.propertyName == 'opacity') {
                this.element.style.display = 'none';
            } else if (this._isFirstTransitionEnd) {
                this._isFirstTransitionEnd = false;
                this.usernameTextField.focus();
            }
        }
    },

    handleAnimationend: {
        value: function () {
            if (this.errorMessage) {
                this.passwordTextField.value = null;
                this.passwordTextField.element.focus();

                this.element.removeEventListener(
                    typeof WebKitAnimationEvent !== "undefined" ? "webkitAnimationEnd" : "animationend", this, false
                );
            }
        }
    }
});

SignIn.prototype.handleWebkitAnimationEnd = SignIn.prototype.handleAnimationend;
