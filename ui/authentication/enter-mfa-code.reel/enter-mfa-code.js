var Component = require("montage/ui/component").Component,
    currentEnvironment = require("montage/core/environment").currentEnvironment,
    KeyComposer = require("montage/composer/key-composer").KeyComposer,
    DataOperation = require("montage/data/service/data-operation").DataOperation;

var EnterMfaCode = exports.EnterMfaCode = Component.specialize({

    descriptionText: {
        value: "A code was sent to your device, please enter it below:"
    },

    _isFirstTransitionEnd: {
        value: true
    },

    mfaCode: {
        value: void 0
    },

    signInButton: {
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
            this.mfaCodeField.focus();
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
                this.handleSignInAction(event);
            }
        }
    },

    handleSignInAction: {
        value: function () {
            var self = this,
                userIdentity = this.ownerComponent.userIdentity;
            if (this._isAuthenticating || !this.mfaCode) {
                return;
            }
            this.isAuthenticating = true;
            this.hadError = false;
            userIdentity.mfaCode = this.mfaCode;
            this.application.mainService.saveDataObject(userIdentity)
            .then(function () {
                // Don't keep any track of the verificationCode in memory.
                self.mfaCode = null;
            }, function (error) {
                self.hadError = true;
                if (error instanceof DataOperation && error.type === DataOperation.Type.ValidateFailed) {
                    self.errorMessage = error.userMessage;
                } else {
                    self.errorMessage = error.message || error;
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
            if(this.ownerComponent.userIdentity.isAuthenticated && e.target == this.element && e.propertyName == 'opacity') {
                this.element.style.display = 'none';
            } else if (this._isFirstTransitionEnd) {
                this._isFirstTransitionEnd = false;
                this.mfaCodeField.focus();
            }
        }
    },

    handleAnimationend: {
        value: function () {
            if (this.errorMessage) {
                this.mfaCodeField.value = null;
                this.mfaCodeField.element.focus();

                this.element.removeEventListener(
                    typeof WebKitAnimationEvent !== "undefined" ? "webkitAnimationEnd" : "animationend", this, false
                );
            }
        }
    }
});

EnterMfaCode.prototype.handleWebkitAnimationEnd = EnterMfaCode.prototype.handleAnimationend;
