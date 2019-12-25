var uuid = require("montage/core/uuid");

var userInfos = {
    "confirmed": {
        username: "confirmed",
        password: "password",
        sub: uuid.generate()
    },
    "unconfirmed": {
        username: "unconfirmed",
        password: "password",
        sub: uuid.generate(),
        unconfirmed: true
    }
};

var emailedConfirmationCodes = [];

/**
 * @typedef {object} CognitoUserPoolSignUpResult
 * @property {CognitoUser} user
 * @property {boolean} userConfirmed
 * @property {string} userSub
 * @property {CognitoCodeDeliveryDetails} codeDeliveryDetails
 */

/**
 * @typedef {object} CognitoCodeDeliveryDetails
 * @property {string} AttributeName e.g. "email"
 * @property {string} DeliveryMedium e.g. "EMAIL"
 * @property {string} Destination e.g. "a***@g***.com"
 */

function CognitoUser(data) {
    this.username = data.Username || '';
    this.pool = data.Pool;
    this.signInUserSession = null;
    this.authenticationFlowType = 'USER_SRP_AUTH';
}

Object.defineProperties(CognitoUser.prototype, {
    authenticateUser: {
        value: function (authDetails, callback) {
            var username = authDetails.username,
                password = authDetails.password,
                userInfo = userInfos[username];
            if (!userInfo || userInfo.password !== password) {
                callback.onFailure({
                    code: "NotAuthorizedException",
                    name: "NotAuthorizedException",
                    message: "Incorrect username or password."
                });
                return;
            }
            if (userInfo.unconfirmed) {
                callback.onFailure({
                    code: "UserNotConfirmedException",
                    name: "UserNotConfirmedException",
                    message: "User is not confirmed."
                });
                return;
            }
            this.signInUserSession = {
                idToken: {
                    jwtToken: "abc",
                    payload: {
                        sub: userInfo.sub
                    }
                },
                accessToken: {
                    jwtToken: "abc"
                },
                refreshToken: {
                    jwtToken: "abc"
                }
            };
            callback.onSuccess(this.signInUserSession);
        }
    },

    confirmRegistration: {
        value: function (confirmationCode, forceAliasCreation, callback, clientMetadata) {
            if (confirmationCode === '123456') {
                userInfos[this.username].unconfirmed = false;
                callback(null, "SUCCESS");
            } else {
                callback({
                    code: "CodeMismatchException",
                    name: "CodeMismatchException",
                    message: "Invalid verification code provided, please try again."
                });
            }
        }
    },

    resendConfirmationCode: {
        value: function (callback) {
            emailedConfirmationCodes.push(this.username);
            callback(null, {
                "AttributeName": "email",
                "DeliveryMedium": "EMAIL",
                "Destination": "a***@g***.com"
            });
        }
    }
});

function CognitoUserPool(data) {
    data = data || {};
    this._requireEmailVerification = data.requireEmailVerification;
}

Object.defineProperties(CognitoUserPool.prototype, {
    /**
     * @param {nodeCallback<CognitoUserPoolSignUpResult>} callback
     */
    signUp: {
        value: function (username, password, attributeList, validationdata, callback, clientMetadata) {
            var user, emailAttribute, userInfo;
            if (Object.keys(userInfos).indexOf(username) !== -1) {
                return callback({
                    code: "UsernameExistsException",
                    name: "UsernameExistsException",
                    message: "User already exists"
                });
            }
            emailAttribute = attributeList.filter(function (attribute) {
                return attribute.Name === "email"
            })[0];
            if (!emailAttribute) {
                return callback({
                    code: "InvalidParameterException",
                    name: "InvalidParameterException",
                    message: "Attributes did not conform to the schema: email: The attribute is required\n"
                });
            } else if (!emailAttribute.Value || !/.*@.*/.test(emailAttribute.Value)) {
                return callback({
                    code: "InvalidParameterException",
                    name: "InvalidParameterException",
                    message: "Invalid email address format."
                });
            }
            if (!password || password.length < 6) {
                return callback({
                    code: "InvalidParameterException",
                    name: "InvalidParameterException",
                    message: "1 validation error detected: Value at 'password' failed to satisfy constraint: Member must have length greater than or equal to 6"
                });
            }
            user = new CognitoUser({
                Username: username,
                Pool: this
            });
            userInfo = {
                username: username,
                password: password,
                sub: uuid.generate()
            };
            userInfos[username] = userInfo;
            callback(null, {
                user: user,
                userConfirmed: !this.requireEmailVerification,
                userSub: userInfo.sub,
                codeDeliveryDetails: {
                    AttributeName: "email",
                    DeliveryMedium: "EMAIL",
                    Destination: "a**@g**.com"
                }
            });
        }
    },

    getCurrentUser: {
        value: function () {
            if (this._lastAuthUser) {
                return new CognitoUser({
                    Username: this._lastAuthUser,
                    Pool: this
                });
            }
            return null;
        }
    }
});

module.exports = {
    CognitoUser: CognitoUser,
    CognitoUserPool: CognitoUserPool,
    userInfos: userInfos,
    emailedConfirmationCodes: emailedConfirmationCodes
};
