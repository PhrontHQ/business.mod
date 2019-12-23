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
        value: `A verification code was sent by email, please enter it bellow:`
    },

    _isFirstTransitionEnd: {
        value: true
    },

    verificationCode: {
        value: void 0
    },

    isBrowserSupported: {
        get: function () {
            return currentEnvironment.browserName == 'chrome';
        }
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

    _isAuthenticating: {
        value: false
    },

    isAuthenticating: {
        set: function (isAuthenticating) {
            if (this._isAuthenticating !== isAuthenticating) {
                this._isAuthenticating = isAuthenticating;
                this._toggleUserInteraction();
            }
        },
        get: function () {
            return this._isAuthenticating;
        }
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
        value: function (isFirstTime) {
            this.addEventListener("action", this, false);
            this._keyComposer.addEventListener("keyPress", this, false);
            this.element.addEventListener("transitionend", this, false);

            // checks for disconnected hash
            if(location.href.indexOf(";disconnected") > -1) {
                this.hasError = true;
                this.errorMessage = "Oops! Your token has expired. \n Please log back in.";
                location.href = location.href.replace(/;disconnected/g, '');
            }
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
        value: function(event) {
            if (!this._isAuthenticating && this.verificationCode) {
                var self = this;
                    userIdentity = this.ownerComponent.userIdentity,
                    this.isAuthenticating = true;
                    this.hadError = false;
                    var verificationCode = this.verificationCode || "";

                if(userIdentity.accountConfirmationCode !== this.verificationCode) {
                    userIdentity.accountConfirmationCode = this.verificationCode;
                }

                this.application.mainService.saveDataObject(userIdentity)
                .then(function (savedObject) {


                    self.isLoggedIn = true;
                    // self.application.applicationModal.hide(self);

                    // Don't keep any track of the verificationCode in memory.
                    self.verificationCode = self.userName = null;

                    //FIXME: kind of hacky
                    //self.application.dispatchEventNamed("userLogged");

                    /*
                        We need to now show the email verification code component.
                        We can hard-code that for now, but need to check if that's hinted by Cognito that this is happenning, as it's a configurable behavior in Cognito.
                    */

                }, function (error) {
                    if(error) {
                        self.hadError = true;

                        //Needs to handle a wrong verification code
                        if(error instanceof DataOperation && error.type === DataOperation.Type.ValidateFailed) {
                            self.errorMessage = error.userMessage;
                        }
                        else {
                            self.errorMessage = error.message || error;
                            self.hadError = true;
                        }
                    } else {
                        self.errorMessage = null;
                    }
                }).finally(function (value) {
                    if (self.errorMessage) {
                        self.element.addEventListener(
                            typeof WebKitAnimationEvent !== "undefined" ? "webkitAnimationEnd" : "animationend", self, false
                        );
                    }

                    self.isAuthenticating = false;
                });


            }
        }
    },

    handleTransitionend: {
        value: function (e) {
            if(this.isLoggedIn && e.target == this.element && e.propertyName == 'opacity') {
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

    _toggleUserInteraction: {
        value: function () {
            this.confirmAccountButton.disabled = this._isAuthenticating;
            this.codeVerificationField.disabled = this._isAuthenticating;
        }
    }

});

EnterVerificationCode.prototype.handleWebkitAnimationEnd = EnterVerificationCode.prototype.handleAnimationend;
