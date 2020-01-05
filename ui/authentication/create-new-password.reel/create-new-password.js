var Component = require("montage/ui/component").Component,
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
        value: function () {
            var self = this,
                userIdentity;
            if (this._isAuthenticating || !this.password) {
                return;
            }
            this.isAuthenticating = true;
            this.hadError = false;
            userIdentity = this.ownerComponent.userIdentity;
            userIdentity.password = this.oldPassword;
            userIdentity.newPassword = this.password;
            this.application.mainService.saveDataObject(userIdentity)
            .then(function () {
                // Don't keep any track of the password in memory.
                self.password = self.oldPassword = null;
            }, function (error) {
                if (error) {
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
    },

    handleTransitionend: {
        value: function (e) {
            if(this.ownerComponent.userIdentity.isAuthenticated && e.target == this.element && e.propertyName == 'opacity') {
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
