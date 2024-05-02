var IdentityService = require("mod/data/service/identity-service").IdentityService,
    DataOperation = require("mod/data/service/data-operation").DataOperation,
    DataOperationType = require("mod/data/service/data-operation").DataOperationType,
    AmazonCognitoIdentity = require("amazon-cognito-identity-js"),
    AuthenticationDetails = AmazonCognitoIdentity.AuthenticationDetails,
    CognitoUserAttribute = AmazonCognitoIdentity.CognitoUserAttribute,
    CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool,
    CognitoUser = AmazonCognitoIdentity.CognitoUser,
    UserIdentity = require("../model/app/user-identity").UserIdentity,
    Criteria = require("mod/core/criteria").Criteria,
    uuid = require("mod/core/uuid");


/*
    TODO:

    - As a RawDataService, CognitoIdentityService should map a CognitoUser
    to a Phront Person.

    - Use https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminLinkProviderForUser-property

    to link third party ident and coginito users together.

    Model Devices: see

    https://www.npmjs.com/package/amazon-cognito-identity-js/v/3.0.16-unstable.61
    cognitoUser.listDevices




*/


CognitoIdentityService = exports.CognitoIdentityService = IdentityService.specialize({
    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function CognitoIdentityService() {
            this.super();
            this._usersByName = new Map();
            this._fetchStreamByUser = new WeakMap();
        }
    },

     /***************************************************************************
     * Serialization
     */

    deserializeSelf: {
        value:function (deserializer) {
            this.super(deserializer);

            value = deserializer.getProperty("userPoolId");
            if (value) {
                this.userPoolId = value;
            }

            value = deserializer.getProperty("clientId");
            if (value) {
                this.clientId = value;
            }


        }
    },

    _userIdentityDescriptor: {
        value: undefined
    },

    userIdentityDescriptor: {
        get: function() {
            if(!this._userIdentityDescriptor) {
                this._userIdentityDescriptor = this.rootService.objectDescriptorForType(UserIdentity);
            }
            return this._userIdentityDescriptor;
        }
    },

    userPoolId: {
        value: undefined
    },

    clientId: {
        value: undefined
    },

    CognitoUser: {
        value: CognitoUser
    },

    CognitoUserPool: {
        value: CognitoUserPool
    },

    _userPool: {
        value: undefined
    },
    userPool: {
        get: function() {
            if(!this._userPool) {
                var poolData = {
                    UserPoolId: this.userPoolId,
                    ClientId: this.clientId
                };
                this._userPool = new this.CognitoUserPool(poolData);
            }
            return this._userPool;
        }
    },

    _usersByName: {
        value: undefined
    },
    userNamed: {
        value: function(username) {
            var user = this._usersByName.get(username);
            if(!user) {
                var userData = {
                    Username: username,
                    Pool: this.userPool
                };
                user = new this.CognitoUser(userData);
                if(user) {
                    this._usersByName.set(username,user);
                }
            }
            return user;
        }
    },

    _user: {
        value: undefined
    },
    user: {
        get: function() {
            if(!this._user) {
                //Check if we may have a known current user:
                var cognitoUser = this.userPool.getCurrentUser();

                if(cognitoUser) {
                    this._user = cognitoUser;
                }
            }
            return this._user;
        },
        set: function(value) {
            this._user = value;
        }
    },
    userSession: {
        value: undefined
    },

    providesAuthorization: {
        value: true
    },
    authorizationPanel: {
        value: "ui/authentication/authentication-panel.reel"
    },

    fetchRawData: {
        value: function (stream) {
            var self = this;
            this._getCachedCognitoUser()
            .then(function (cognitoUser) {
                var userIdentity, userInputOperation;
                if (!cognitoUser) {
                    cognitoUser = self._createAnonymousCognitoUser();
                }
                if (cognitoUser.signInUserSession) {
                    self.addRawData(stream, [cognitoUser]);
                    self.rawDataDone(stream);
                    self.dispatchUserAuthenticationCompleted(cognitoUser);
                    return;
                } else if(cognitoUser.isAnonymous) {
                    self.addRawData(stream, [cognitoUser]);
                    self.rawDataDone(stream);
                    self.dispatchUserAuthenticationCompleted(cognitoUser);
                } else {
                    /*
                        Now we need to bring some UI to the user to be able to continue
                        This is intended to run in a web/service worker at some point, or why not node
                        so we need an event-driven way to signal that we need to show UI.
                        Because this is a fetch, the promise is already handled at the DataStream level
                        The authentication panel needs to provide us some data.
                        The need to show a UI might be driven by the need to confirm a password,
                        or some other reason, so it needs to provide enough info for the authentication
                        panel to do it's job.
                        Knowing the panel and the identity service may be in different thread, they may not be able to address each others. So we should probably use data operations to do the communication anyway
                    */
                    userIdentity = self.objectForTypeRawData(self.userIdentityDescriptor, cognitoUser);
                    // Rather annoying that objectForTypeRawData does not record a snapshot (when the service is uniquing)
                    self.recordSnapshot(userIdentity.dataIdentifier, cognitoUser);

                    self._pendingStream = stream;

                    // Keep track of the stream to complete when we get all data
                    self._fetchStreamByUser.set(cognitoUser, stream);

                    userInputOperation = new DataOperation();
                    userInputOperation.type = DataOperation.Type.UserAuthentication;

                    // Needs to make that a separate property so this can be the cover that returns ths
                    // local object as a convenience over doing it with a new dataDescriptorModuleId property
                    userInputOperation.target = self.userIdentityDescriptor;

                    // This criteria should describe the object for which we need input on with the identifier = ....
                    // Required when for example requesting an update to a passord
                    // What does it mean when we have no idea who the user is?
                    // well, we should have an anonymous user created locally nonetheless,
                    // or one created with an anonymous user name sent to Cognito?
                    // But we can't change a user name once created?
                    userInputOperation.criteria = Criteria.withExpression("identifier == $identifier", {
                        identifier: self.dataIdentifierForObject(userIdentity)
                    });

                    //Specifies the properties we need input for
                    userInputOperation.data = userIdentity;
                    userInputOperation.requisitePropertyNames = ["username", "password"];
                    userInputOperation.dataServiceModuleId = module.id;
                    userInputOperation.authorizationPanelRequireLocation = require.location;
                    userInputOperation.authorizationPanelModuleId = require.resolve(self.authorizationPanel);
                    self.userIdentityDescriptor.dispatchEvent(userInputOperation);

                    // Now the fetch will hang, until a saveDataObject picks up this pending stream
                    // and adds the raw data of an authenticated user to it
                }
            })
            .catch(function (err) {
                self.rawDataError(stream, err);
                self.rawDataDone(stream);
            });
        }
    },

    _getCachedCognitoUser: {
        value: function () {
            var self = this,
                cognitoUser = this.userPool.getCurrentUser();
            return new Promise(function (resolve, reject) {
                if (!cognitoUser) {
                    return resolve(null);
                }
                cognitoUser.getSession(function (err) {
                    if (err) {
                        if (err.message === 'Cannot retrieve a new session. Please authenticate.') {
                            return resolve(cognitoUser);
                        } else {
                            console.error(err.message || JSON.stringify(err));
                            return reject(err);
                        }
                    }
                    // NOTE: getSession must be called to authenticate user before calling getUserAttributes
                    /*
                    from: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html
                    from: https://forums.aws.amazon.com/thread.jspa?threadID=309444
                    See also: https://serverless-stack.com/chapters/mapping-cognito-identity-id-and-user-pool-id.html
                    */
                    cognitoUser.id = cognitoUser.signInUserSession.idToken.payload.sub;
                    resolve(self._fetchUserDataForCognitoUser(cognitoUser));
                });
            });
        }
    },

    _fetchUserDataForCognitoUser: {
        value: function (cognitoUser) {
            return new Promise(function (resolve, reject) {
                // user attributes (email, phone, etc.) and MFA options are
                // not normally on a CognitoUser, but that makes it hard to use
                // a CognitoUser as raw data
                cognitoUser.getUserData(function (err, userData) {
                    if (err) {
                        return reject(err);
                    }
                    cognitoUser.isSmsMfaEnabled = !!userData.UserMFASettingList && userData.UserMFASettingList.indexOf("SMS_MFA") !== -1;
                    userData.UserAttributes.forEach(function (userAttribute) {
                        var name = userAttribute.Name,
                            value = userAttribute.Value;
                        if (name === "email") {
                            cognitoUser.email = value;
                        } else if (name === "phone_number") {
                            cognitoUser.phone_number = value;
                        }
                    });
                    resolve(cognitoUser);
                }, { bypassCache: true });
            });
        }
    },

    _createAnonymousCognitoUser: {
        value: function () {
            var cognitoUser = new this.CognitoUser({
                Username: "",
                Pool: this.userPool
            });
            cognitoUser.id = uuid.generate();

            /*
                Custom addition for flagging Anonymous users.

                There might be a way using federated identities and Cognito Identity Pool to have
                a temporary anonymous user, but we could do that ourselfves.

                We may have to therefore create a UserIdenity table to track that,
                assuming we keep a reference client side. But with Apple going for a 7 days cleanup,
                we may end up with many orphaned identities.
            */
            cognitoUser.isAnonymous = true;
            return cognitoUser;
        }
    },

    dispatchUserAuthenticationCompleted: {
        value: function(userIdentity) {
            var dataOperation = new DataOperation();

            dataOperation.type = DataOperation.Type.UserAuthenticationCompleted;
            dataOperation.target = this.userIdentityDescriptor;
            dataOperation.data = userIdentity;

            this.userIdentityDescriptor.dispatchEvent(dataOperation);
        }
    },

    dispatchUserAuthenticationFailed: {
        value: function(userIdentity) {
            var dataOperation = new DataOperation();

            dataOperation.type = DataOperation.Type.UserAuthenticationFailed;
            dataOperation.target = this.userIdentityDescriptor;
            dataOperation.data = userIdentity;

            this.userIdentityDescriptor.dispatchEvent(dataOperation);
        }
    },

    saveRawData: {
        value: function (record, object) {
            var self = this,
                cognitoUser = this.snapshotForDataIdentifier(object.dataIdentifier);
            if (cognitoUser) {
                cognitoUser.username = record.username;
                if (cognitoUser.signInUserSession) {
                    if (!object.isAuthenticated) {
                        cognitoUser.signOut();
                    } else if (object.password && object.newPassword) {
                        return this._changePassword(record, object, cognitoUser);
                    } else if (object.isMfaEnabled !== cognitoUser.isSmsMfaEnabled) {
                        if (object.isMfaEnabled) {
                            return this._enableMfa(record, object, cognitoUser);
                        } else {
                            return this._disableMfa(record, object, cognitoUser);
                        }
                    } else if (record.phone_number !== cognitoUser.phone_number) {
                        return this._updateAttribute(record, object, cognitoUser, 'phone_number');
                    }
                    return Promise.resolve();
                } else if (object.needsNewConfirmationCode) {
                    return this._resendConfirmationCode(record, object, cognitoUser);
                } else if (object.accountConfirmationCode) {
                    //This will do for now, but it needs to be replaced by the handling of an updateOperation which
                    //would carry directly the fact that the accountConfirmationCode property
                    //is what changed. In the meantime, while we're still in the same thred, we could ask the mainService what's the changed properties for that object, but it's still not tracked properly for some properties that don't have triggers doing so. Needs to clarify that.
                    return this._confirmUser(record, object, cognitoUser)
                    .then(function () {
                        if (record.password) {
                            return self._authenticateUser(record, object, cognitoUser);
                        }
                    });
                } else {
                    return this._authenticateUser(record, object, cognitoUser);
                }
            } else {
                return this._signUpUser(record, object);
            }
        }
    },

    _authenticateUser: {
        value: function (record, object, cognitoUser) {
            var self = this,
                authenticationDetails = new AuthenticationDetails({
                    Username: record.username,
                    Password: record.password
                }),
                stream = this._fetchStreamByUser.get(cognitoUser);
            return new Promise(function (resolve, reject) {
                var callback = {
                    onSuccess: function () {
                        var rawDataPrimaryKey = cognitoUser.signInUserSession.idToken.payload.sub,
                            dataIdentifier = object.dataIdentifier;
                        //If we had a temporary object, we need to update the primary key
                        if (dataIdentifier && dataIdentifier.primaryKey !== rawDataPrimaryKey) {
                            dataIdentifier.primaryKey = rawDataPrimaryKey;
                        } else if (!dataIdentifier) {
                            dataIdentifier = self.dataIdentifierForTypeRawData(self.userIdentityDescriptor, cognitoUser);
                            self.rootService.recordDataIdentifierForObject(dataIdentifier, object);
                            self.rootService.recordObjectForDataIdentifier(object, dataIdentifier);
                            self.recordSnapshot(dataIdentifier, cognitoUser);
                        }
                        self._fetchUserDataForCognitoUser(cognitoUser)
                        .then(function () {
                            object.isAccountConfirmed = true;
                            object.password = undefined;
                            object.newPassword = undefined;
                            object.mfaCode = undefined;
                            return self.resetDataObject(object);
                        })
                        .then(function () {
                            if (stream) {
                                //Or shall we use addData??
                                self.addRawData(stream, [cognitoUser]);
                                self.rawDataDone(stream);
                            }
                            resolve(object);
                            self.dispatchUserAuthenticationCompleted(object);
                        }, reject);
                    },

                    onFailure: function (err) {
                        if (err.code === "NotAuthorizedException") {
                            var updateOperation = new DataOperation();
                            updateOperation.type = DataOperation.Type.UserAuthenticationFailed;
                            updateOperation.target = self.userIdentityDescriptor;
                            updateOperation.userMessage = err.message;
                            updateOperation.data = {
                                "username": undefined,
                                "password": undefined,
                            };
                            reject(updateOperation);
                        } else if (err.code === "UserNotConfirmedException") {
                            object.isAccountConfirmed = false;
                            if (object.accountConfirmationCode) {
                                //The user is already entering a accountConfirmationCode
                                //But it's not correct.
                                var validateOperation = new DataOperation();
                                validateOperation.type = DataOperation.Type.ValidateFailedOperation;
                                validateOperation.userMessage = "Invalid Verification Code";
                                validateOperation.target = self.userIdentityDescriptor;

                                /*
                                    this should describe the what the operation applies to
                                */
                                validateOperation.criteria = new Criteria().initWithExpression("identifier == $", object.dataIdentifier);

                                /*
                                    this is meant to provide the core of what the operation express. A validateFailed should explain
                                    what failed.
                                */
                                validateOperation.data = {
                                    "accountConfirmationCode": undefined
                                };

                                reject(validateOperation);
                            } else {
                                //We re-send it regardless to make it easy:
                                self._resendConfirmationCode(record, object, cognitoUser)
                                .catch(function (err) {
                                    if (!(err instanceof DataOperation)) {
                                        if (stream) {
                                            self.rawDataError(stream, err);
                                        }
                                    }
                                    // We expect a DataOperation rejection from
                                    // _resendConfirmationCode, it should never
                                    // resolve
                                    reject(err);
                                });
                            }
                        } else if (err.code === "CodeMismatchException") {
                            dataOperation = new DataOperation();
                            dataOperation.type = DataOperation.Type.ValidateFailedOperation;
                            dataOperation.userMessage = "Invalid MFA Code";
                            dataOperation.target = self.userIdentityDescriptor;
                            dataOperation.criteria = new Criteria().initWithExpression("identifier == $", object.dataIdentifier);
                            dataOperation.data = { mfaCode: undefined };
                            reject(dataOperation);
                        } else {
                            reject(err);
                            //reject(err.message || JSON.stringify(err));

                            if(stream) {
                                self.rawDataError(stream,err);
                            }
                        }
                    },

                    mfaRequired: function (codeDeliveryDetails) {
                        var updateOperation = new DataOperation();
                        updateOperation.type = DataOperation.Type.UpdateOperation;
                        updateOperation.target = self.userIdentityDescriptor;
                        updateOperation.context = {
                            codeDeliveryDetails: codeDeliveryDetails
                        };
                        updateOperation.data = {
                            "mfaCode": undefined
                        };
                        object.isMfaEnabled = cognitoUser.isSmsMfaEnabled = true;
                        reject(updateOperation);
                    },

                    newPasswordRequired: function (userAttributes, requiredAttributes) {
                        var updateOperation = new DataOperation();
                        updateOperation.type = DataOperation.Type.UpdateOperation;
                        // updateOperation.target = objectDescriptor;
                        //Hack
                        updateOperation.target = self.userIdentityDescriptor;
                        //Should be the criteria matching the User
                        //whose password needs to change
                        //updateOperation.criteria = query.criteria;
                        //Hack for now
                        updateOperation.context = {
                            userAttributes: userAttributes,
                            requiredAttributes: requiredAttributes
                        };
                        updateOperation.data = {
                            "password": undefined
                        };

                        // the api doesn't accept these fields back
                        delete userAttributes.email_verified;
                        delete userAttributes.phone_number_verified;

                        // store userAttributes on global variable
                        self.sessionUserAttributes = userAttributes;

                        reject(updateOperation);
                    }
                };
                if (object.newPassword && self.sessionUserAttributes) {
                    cognitoUser.completeNewPasswordChallenge(object.newPassword, self.sessionUserAttributes, callback);
                } else if (object.mfaCode) {
                    cognitoUser.sendMFACode(object.mfaCode, callback);
                } else {
                    cognitoUser.authenticateUser(authenticationDetails, callback);
                }
            });
        }
    },

    _signUpUser: {
        value: function (record, object) {
            var self = this,
                stream = this._pendingStream,
                cognitoUserAttributes = [
                    new CognitoUserAttribute({
                        Name: 'email',
                        Value: record.email
                    })
                ];
            return new Promise(function (resolve, reject) {
                self.userPool.signUp(record.username, record.password, cognitoUserAttributes, null, function (err, result) {
                    var cognitoUser, dataOperation, dataIdentifier, confirmation, codeDeliveryDetails;
                    if (err) {
                        if (err.code === "UsernameExistsException") {
                            cognitoUser = self.snapshotForDataIdentifier(object.dataIdentifier);
                            if (!cognitoUser) {
                                cognitoUser = new self.CognitoUser({
                                    Username: record.username,
                                    Pool: self.userPool
                                });
                                cognitoUser.id = uuid.generate();
                                if (stream) {
                                    self._fetchStreamByUser.set(cognitoUser, stream);
                                }
                            }

                            //Since it exists, we try to authenticate with what we have
                            self._authenticateUser(record, object, cognitoUser)
                            .then(function () {
                                //It worked we're all good
                                resolve();
                            }, function (error) {
                                //Authentication failed, since the username exists,
                                //It's likely the passord is wrong.
                                //We need to communicate that back up
                                //and make sure we switch bacl to the signin panel
                                reject(error);
                            });
                        } else if (err.code === "InvalidParameterException") {
                            dataOperation = new DataOperation();
                            dataOperation.type = DataOperation.Type.ValidateFailedOperation;
                            dataOperation.target = self.userIdentityDescriptor;
                            dataOperation.userMessage = err.message;
                            dataOperation.data = {};
                            if (err.message.indexOf("username") !== -1) {
                                dataOperation.data["username"] = undefined;
                            }
                            if (err.message.indexOf("password") !== -1) {
                                dataOperation.data["password"] = undefined;
                            }
                            if (err.message.indexOf("email") !== -1) {
                                dataOperation.data["email"] = undefined;
                            }
                            reject(dataOperation);
                        } else {
                            reject(err);
                        }
                    } else {
                        cognitoUser = result.user;
                        cognitoUser.id = result.userSub;
                        dataIdentifier = object.dataIdentifier;
                        if (dataIdentifier) {
                            dataIdentifier.primaryKey = cognitoUser.id;
                        } else {
                            dataIdentifier = self.dataIdentifierForTypeRawData(self.userIdentityDescriptor, cognitoUser);
                            self.rootService.recordDataIdentifierForObject(dataIdentifier, object);
                            self.rootService.recordObjectForDataIdentifier(object, dataIdentifier);
                        }
                        self.recordSnapshot(object.dataIdentifier, cognitoUser);
                        object.isAccountConfirmed = result.userConfirmed;
                        if (object.isAccountConfirmed) {
                            return this._authenticateUser(record, object, cognitoUser);
                        } else {
                            dataOperation = new DataOperation();
                            dataOperation.type = DataOperation.Type.UpdateOperation;
                            dataOperation.target = self.userIdentityDescriptor;
                            dataOperation.data = {
                                accountConfirmationCode: undefined
                            };
                            dataOperation.context = result.codeDeliveryDetails;
                            reject(dataOperation);
                        }
                    }
                });
            });
        }
    },

    _confirmUser: {
        value: function(record, object, cognitoUser) {
            var self = this,
                accountConfirmationCode = object.accountConfirmationCode;
            return new Promise(function (resolve, reject) {
                cognitoUser.confirmRegistration(accountConfirmationCode, true, function (err) {
                    var dataOperation;
                    if (err) {
                        dataOperation = new DataOperation();
                        dataOperation.type = DataOperation.Type.ValidateFailedOperation;
                        dataOperation.userMessage = "Invalid Verification Code";
                        dataOperation.target = self.userIdentityDescriptor;
                        dataOperation.criteria = new Criteria().initWithExpression("identifier == $", object.dataIdentifier);
                        dataOperation.data = { accountConfirmationCode: undefined };
                        reject(dataOperation);
                    } else {
                        object.accountConfirmationCode = undefined;
                        object.isAccountConfirmed = true;
                        resolve();
                    }
                });
            });
        }
    },

    _resendConfirmationCode: {
        value: function (record, object, cognitoUser) {
            var self = this;
            return new Promise(function (resolve, reject) {
                cognitoUser.resendConfirmationCode(function (err, result) {
                    var dataOperation;
                    if (err) {
                        reject(err);
                    } else {
                        dataOperation = new DataOperation();
                        dataOperation.type = DataOperation.Type.UpdateOperation;
                        dataOperation.target = self.userIdentityDescriptor;
                        dataOperation.data = {
                            "accountConfirmationCode": undefined
                        };
                        /*
                            console.log('result: ' + result);
                            {
                            "CodeDeliveryDetails": {
                                "AttributeName":"email",
                                "DeliveryMedium":"EMAIL",
                                "Destination":"m***@g***.com"}
                            }
                            The message communicated to the user should use this
                            to craft the right message indicating the medium used
                            to send the confirmation code (email, SMS..) and the obfuscated details of the address/id used for that medium.
                        */
                        dataOperation.context = result;
                        object.needsNewConfirmationCode = false;
                        reject(dataOperation);
                    }
                });
            });
        }
    },

    _changePassword: {
        value: function (record, object, cognitoUser) {
            var self = this;
            return new Promise(function (resolve, reject) {
                cognitoUser.changePassword(object.password, object.newPassword, function (err) {
                    var dataOperation;
                    if (err) {
                        if (err.code === "InvalidPasswordException") {
                            dataOperation = new DataOperation();
                            dataOperation.type = DataOperation.Type.ValidateFailedOperation;
                            dataOperation.target = self.userIdentityDescriptor;
                            dataOperation.userMessage = err.message;
                            dataOperation.data = {
                                "password": undefined
                            };
                            reject(dataOperation);
                        } else if (err.code === "NotAuthorizedException") {
                            dataOperation = new DataOperation();
                            dataOperation.type = DataOperation.Type.UserAuthenticationFailed;
                            dataOperation.target = self.userIdentityDescriptor;
                            dataOperation.userMessage = err.message;
                            dataOperation.data = {
                                "username": undefined,
                                "password": undefined
                            };
                            reject(dataOperation);
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve();
                    }
                });
            });
        }
    },

    _enableMfa: {
        value: function (record, object, cognitoUser) {
            return new Promise(function (resolve, reject) {
                var smsMfaSettings = {
                    PreferredMfa: true,
                    Enabled: true
                };
                cognitoUser.setUserMfaPreference(smsMfaSettings, null, function (err, result) {
                    if (err) {
                        return reject(err);
                    }
                    cognitoUser.isSmsMfaEnabled = true;
                    resolve();
                });
            });
        }
    },

    _disableMfa: {
        value: function (record, object, cognitoUser) {
            return new Promise(function (resolve, reject) {
                var smsMfaSettings = {
                    PreferredMfa: false,
                    Enabled: false
                };
                cognitoUser.setUserMfaPreference(smsMfaSettings, null, function (err, result) {
                    if (err) {
                        return reject(err);
                    }
                    cognitoUser.isSmsMfaEnabled = false;
                    resolve();
                });
            });
        }
    },

    _updateAttribute: {
        value: function (record, object, cognitoUser, attributeName) {
            var self = this,
                attributeList = [new CognitoUserAttribute({
                    Name: attributeName,
                    Value: record[attributeName]
                })];
            return new Promise(function (resolve, reject) {
                cognitoUser.updateAttributes(attributeList, function (err) {
                    var dataOperation;
                    if (err && err.code === "InvalidParameterException") {
                        dataOperation = new DataOperation();
                        dataOperation.type = DataOperation.Type.ValidateFailedOperation;
                        dataOperation.target = self.userIdentityDescriptor;
                        dataOperation.userMessage = err.message;
                        dataOperation.data = {};
                        dataOperation.data[attributeName] = undefined;
                        reject(dataOperation);
                    } else if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
    },

    _connectionInfo: {
        value: null
    },

    /**
     * Passes information necessary to Auth0 authorization API/libraries
     *      name: standard ConnectionDescriptor property ("production", "development", etc...)
     *      clientId:,{String} Required parameter. Your application's clientId in Auth0.
     *      domain:  {String}: Required parameter. Your Auth0 domain. Usually your-account.auth0.com.
     *      options:  {Object}: Optional parameter. Allows for the configuration of Lock's appearance and behavior.
     *                  See https://auth0.com/docs/libraries/lock/v10/customization for details.
     *
     * enforces that.
     *
     * @class
     * @extends external:Montage
     */
    connectionInfo: {
        get: function() {
            return this._connectionInfo;
        },
        set: function(value) {
            this._connectionInfo = value;
            //TODO Revisit when implementing support for UI Less method directly
            // if(this._connectionDescriptor.clientId && this._connectionDescriptor.domain) {
            //     this._auth0 = new Auth0(
            //         this._connectionDescriptor.clientId,
            //         this._connectionDescriptor.domain
            //         );
            // }
        }
    }

});
