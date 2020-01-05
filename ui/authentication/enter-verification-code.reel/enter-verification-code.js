var Component = require("montage/ui/component").Component,
    currentEnvironment = require("montage/core/environment").currentEnvironment,
    KeyComposer = require("montage/composer/key-composer").KeyComposer,
    DataOperation = require("montage/data/service/data-operation").DataOperation;




/*
Minimum length: 8

Require numbers
Require special character
Require uppercase letters
Require lowercase letters

*/




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
        value: function () {
            this.addEventListener("action", this, false);
            this._keyComposer.addEventListener("keyPress", this, false);
            this.element.addEventListener("transitionend", this, false);
            this.codeVerificationField.focus();
        }
    },

    exitDocument: {
        value: function () {
            this.removeEventListener("action", this, false);
            this._keyComposer.removeEventListener("keyPress", this, false);
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
            var self = this;
                userIdentity = this.ownerComponent.userIdentity;
            if (this._isAuthenticating || !this.verificationCode) {
                return;
            }
            this.isAuthenticating = true;
            this.hadError = false;
            userIdentity.accountConfirmationCode = this.verificationCode;
            this.application.mainService.saveDataObject(userIdentity)
            .then(function () {
                // Don't keep any track of the verificationCode in memory.
                self.verificationCode = self.username = null;
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
    },

    handleResendVerificationCodeAction: {
        value: function () {
            var self = this;
                userIdentity = this.ownerComponent.userIdentity;
            if (this._isAuthenticating) {
                return;
            }
            this.isAuthenticating = true;
            this.hadError = false;
            // simulates logging in to an unconfirmed account
            userIdentity.accountConfirmationCode = undefined;
            this.application.mainService.saveDataObject(userIdentity)
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
    }
});

EnterVerificationCode.prototype.handleWebkitAnimationEnd = EnterVerificationCode.prototype.handleAnimationend;
