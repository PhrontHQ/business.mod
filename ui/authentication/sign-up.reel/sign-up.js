var Component = require("montage/ui/component").Component,
    currentEnvironment = require("montage/core/environment").currentEnvironment,
    KeyComposer = require("montage/composer/key-composer").KeyComposer,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    UserIdentity = require("data/main.mod/model/app/user-identity").UserIdentity;


var SignUp = exports.SignUp = Component.specialize({

    _isFirstTransitionEnd: {
        value: true
    },

    username: {
        value: void 0
    },

    password: {
        value: void 0
    },

    signUpButton: {
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
            this.usernameTextField.focus();
        }
    },

    exitDocument: {
        value: function () {
            this.removeEventListener("action", this, false);
            this._keyComposer.removeEventListener("keyPress", this, false);
            this.password = this.username = this.email = null;
        }
    },

    handleKeyPress: {
        value: function (event) {
            if (event.identifier === "enter") {
                this.handleSignUpAction();
            }
        }
    },

    handleSignInAction: {
        value: function() {
            this.ownerComponent.substitutionPanel = "signIn";
        }
    },

    handleSignUpAction: {
        value: function() {
            var self = this,
                newIdentity = this.application.mainService.createDataObject(UserIdentity);
            this.isAuthenticating = true;
            this.hadError = false;
            newIdentity.username = this.username;
            newIdentity.email = this.email;
            newIdentity.password = this.password;
            this.application.mainService.saveDataObject(newIdentity)
            .then(function () {
                // we'll get here if confirmation is not required, in which case
                // we have a signed in user identity
                self.userIdentity = newIdentity;
            }, function (error) {
                if (error instanceof DataOperation && error.data.hasOwnProperty("accountConfirmationCode")) {
                    // this is the other "success" path... awkward that it's a
                    // reject, but we need data operations to get context on how
                    // the code was sent. Unless we modeled the confirmation
                    // message differently, as a separate data model...
                    self.userIdentity = newIdentity;
                    self.ownerComponent.substitutionPanel = "enterVerificationCode";
                } else {
                    self.hadError = true;
                    self.errorMessage = error.userMessage || error.message || error;
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
            if(this.isLoggedIn && e.target == this.element && e.propertyName == 'opacity') {
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

SignUp.prototype.handleWebkitAnimationEnd = SignUp.prototype.handleAnimationend;
