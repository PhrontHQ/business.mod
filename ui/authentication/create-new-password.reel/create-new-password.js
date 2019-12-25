var Component = require("montage/ui/component").Component,
    currentEnvironment = require("montage/core/environment").currentEnvironment,
    KeyComposer = require("montage/composer/key-composer").KeyComposer;




/*
Minimum length: 8

Require numbers
Require special character
Require uppercase letters
Require lowercase letters

*/




var CreateNewPassword = exports.CreateNewPassword = Component.specialize({

    descriptionText: {
        value: `To protect your account, make sure your password:<br><br>
        - is at least 8 character long<br>
        - contains a number<br>
        - contains an uppercase letter<br>
        - contains a lowercase letter<br>`
    },

    _isFirstTransitionEnd: {
        value: true
    },

    oldPassword: {
        value: void 0
    },

    password: {
        value: void 0
    },

    isBrowserSupported: {
        get: function () {
            return currentEnvironment.browserName == 'chrome';
        }
    },

    changePasswordButton: {
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
            this.passwordTextField.focus();
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
                this.handleChangePasswordAction(event);
            }
        }
    },


    handleChangePasswordAction: {
        value: function(event) {
            if (!this._isAuthenticating && this.password) {
                var self = this;
                this.isAuthenticating = true;
                this.hadError = false;
                var password = this.password || "";

                this.service.changeUserPassword(this.oldPassword, this.password).then(function (authorization) {
                    self.isLoggedIn = true;
                    self.application.applicationModal.hide(self);

                    // Don't keep any track of the password in memory.
                    self.password = self.oldPassword = null;

                    //FIXME: kind of hacky
                    self.application.dispatchEventNamed("userLogged");

                }, function (error) {
                        if(error) {
                            self.errorMessage = error.message || error;
                            self.hadError = true;
                        } else {
                            self.errorMessage = null;
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
    },

    handleTransitionend: {
        value: function (e) {
            if(this.isLoggedIn && e.target == this.element && e.propertyName == 'opacity') {
                this.element.style.display = 'none';
            } else if (this._isFirstTransitionEnd) {
                this._isFirstTransitionEnd = false;
                this.passwordTextField.focus();
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
    },

    _toggleUserInteraction: {
        value: function () {
            this.changePasswordButton.disabled = this._isAuthenticating;
            this.passwordTextField.disabled = this._isAuthenticating;
        }
    }

});

CreateNewPassword.prototype.handleWebkitAnimationEnd = CreateNewPassword.prototype.handleAnimationend;
