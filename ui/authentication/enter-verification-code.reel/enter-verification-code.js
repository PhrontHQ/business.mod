var Component = require("montage/ui/component").Component,
    currentEnvironment = require("montage/core/environment").currentEnvironment,
    KeyComposer = require("montage/composer/key-composer").KeyComposer,
    DataOperation = require("montage/data/service/data-operation").DataOperation;

var EnterVerificationCode = exports.EnterVerificationCode = Component.specialize({

    descriptionText: {
        value: "A verification code was sent by email, please enter it below:"
    },

    _isFirstTransitionEnd: {
        value: true
    },

    verificationCode: {
        value: void 0
    },

    confirmAccountButton: {
        value: void 0
    },

    codeVerificationField: {
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
                if (this.userIdentity.username && this.userIdentity.accountConfirmationCode) {
                    this.verificationCode = this.userIdentity.accountConfirmationCode;
                    this.confirmAccount();
                }
            }
            this.addEventListener("action", this, false);
            this._keyComposer.addEventListener("keyPress", this, false);
            this.codeVerificationField.focus();
        }
    },

    exitDocument: {
        value: function () {
            this.removeEventListener("action", this, false);
            this._keyComposer.removeEventListener("keyPress", this, false);
            this.verificationCode = this.username = null;
        }
    },


    handleKeyPress: {
        value: function (event) {
            if (event.identifier === "enter") {
                this.handleConfirmAccountAction(event);
            }
        }
    },

    handleConfirmAccountAction: {
        value: function () {
            this.userIdentity.accountConfirmationCode = this.verificationCode;
            this.confirmAccount();
        }
    },

    handleResendVerificationCodeAction: {
        value: function () {
            var self = this;
            this.isAuthenticating = true;
            this.hadError = false;
            this.userIdentity.needsNewConfirmationCode = true;
            this.application.mainService.saveDataObject(this.userIdentity)
            .catch(function () {
                self.errorMessage = null;
                self.hasError = false;
            })
            .finally(function () {
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
                this.codeVerificationField.focus();
            }
        }
    },

    handleAnimationend: {
        value: function () {
            if (this.errorMessage) {
                this.codeVerificationField.value = null;
                this.codeVerificationField.element.focus();

                this.element.removeEventListener(
                    typeof WebKitAnimationEvent !== "undefined" ? "webkitAnimationEnd" : "animationend", this, false
                );
            }
        }
    },

    confirmAccount: {
        value: function () {
            var self = this;
            this.isAuthenticating = true;
            this.hadError = false;
            this.application.mainService.saveDataObject(this.userIdentity)
            .then(function () {
                if (!self.userIdentity.isAuthenticated) {
                    // this happens if we confirmed the account but don't have
                    // the necessary credentials to actually authenticate,
                    // e.g. using an activation link
                    // with a smart substitution value we could probably
                    // do this automatically, the user identity's
                    // isAccountConfirmed being set to true without
                    // isAuthenticated set to true should bring us back to
                    // sign in
                    self.ownerComponent.substitutionPanel = "signIn";
                }
            }, function (error) {
                self.hadError = true;
                if (error instanceof DataOperation && error.type === DataOperation.Type.ValidateFailed) {
                    self.errorMessage = error.userMessage;
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
    }
});

EnterVerificationCode.prototype.handleWebkitAnimationEnd = EnterVerificationCode.prototype.handleAnimationend;
