var UserIdentityService = require("montage/data/service/user-identity-service").UserIdentityService,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    DataOperationType = require("montage/data/service/data-operation").DataOperationType,
    AmazonCognitoIdentity = require("amazon-cognito-identity-js"),
    AuthenticationDetails = AmazonCognitoIdentity.AuthenticationDetails,
    CognitoUserAttribute = AmazonCognitoIdentity.CognitoUserAttribute,
    CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool,
    CognitoUser = AmazonCognitoIdentity.CognitoUser,
    UserIdentity = require("data/main.datareel/model/user-identity").UserIdentity,
    Criteria = require("montage/core/criteria").Criteria,
    uuid = require("montage/core/uuid");


/*
    TODO:

    As a RawDataService, CognitoIdentityService should map a CognitoUser
    to a Phront User.

*/


CognitoIdentityService = exports.CognitoIdentityService = UserIdentityService.specialize({
    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function CognitoIdentityService() {
            UserIdentityService.call(this);
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
            var self = this,
                userInputNeeded = false,
                query =  stream.query,
                cognitoUser = this.userPool.getCurrentUser(),
                userIdentity;

            if (cognitoUser != null) {
                cognitoUser.getSession(function(err, session) {
                    if (err) {
                        if(err.message === 'Cannot retrieve a new session. Please authenticate.') {
                            userInputNeeded = true;
                        }
                        else {
                            console.error(err.message || JSON.stringify(err));
                            self.rawDataError(err);
                            return;
                        }
                    }

                    if(session.isValid()) {
                        // NOTE: getSession must be called to authenticate user before calling getUserAttributes
                        /*
                        from: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html
                        from: https://forums.aws.amazon.com/thread.jspa?threadID=309444
                        See also: https://serverless-stack.com/chapters/mapping-cognito-identity-id-and-user-pool-id.html
                        */
                        cognitoUser.id = cognitoUser.signInUserSession.idToken.payload.sub;
                        cognitoUser.getUserAttributes(function(err, attributes) {
                            if (err) {
                                // Handle error
                            } else {
                                // Do something with attributes
                                console.log("cognito user attributes",attributes);
                            }
                        });
                        self.addRawData(stream, [cognitoUser]);
                        self.rawDataDone(stream);
                        self.dispatchUserAuthenticationCompleted(stream.data[0]);
                        return;
                    } else {
                        //If the use is known seession is
                        userInputNeeded = true;
                    }


                    //Needed to establish a direct use of AWS own services
                    // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    //     IdentityPoolId: '...', // your identity pool id here
                    //     Logins: {
                    //         // Change the key below according to the specific region your user pool is in.
                    //         'cognito-idp.<region>.amazonaws.com/<YOUR_USER_POOL_ID>': session
                    //             .getIdToken()
                    //             .getJwtToken(),
                    //     },
                    // });

                    // Instantiate aws sdk service objects now that the credentials have been updated.
                    // example: var s3 = new AWS.S3();
                });
            } else {
                var userData = {
                    Username: "",
                    Pool: this.userPool
                };
                cognitoUser = new this.CognitoUser(userData);
                cognitoUser.id = uuid.generate();
                userIdentity = self.objectForTypeRawData(self.userIdentityDescriptor, cognitoUser);
                userInputNeeded = true;
            }

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
            if(userInputNeeded) {
                this._pendingStream = stream;

                //Keep track of the stream to complete when we get
                //all data
                this._fetchStreamByUser.set(cognitoUser,stream);

                var userInputOperation = new DataOperation(),
                    dataIdentifier = userIdentity ? this.dataIdentifierForObject(userIdentity) : null;

                //Set the righ type.
                userInputOperation.type = DataOperation.Type.UserAuthentication;

                //Needs to make that a separate property so this can be the cover that returns ths
                //local object as a convenience over doing it with a new dataDescriptorModuleId property
                userInputOperation.dataDescriptor = this.userIdentityDescriptor.module.id;

                //This criteria should describe the object for which we need input on with the identifier = ....
                //Required when for example requesting an update to a passord
                //What does it mean when we have no idea who the user is?
                //well, we should have an anonymous user created locally nonetheless,
                //or one created with an anonymous user name sent to Cognito?
                //But we can't change a user name once created?
                if(dataIdentifier) {
                    userInputOperation.criteria = Criteria.withExpression("identifier = $identifier", {"identifier":dataIdentifier});
                }

                //Specifies the properties we need input for
                userInputOperation.data = userIdentity;
                userInputOperation.requisitePropertyNames = ["username","password"];

                //TODO: Needs to wrap that in super class UserIdentityService in montage
                var myModule = module,
                    myRequire = require,
                    panelModuleId = require.resolve(this.authorizationPanel);

                    userInputOperation.dataServiceModuleId = myModule.id;
                    userInputOperation.authorizationPanelRequireLocation = myRequire.location;
                    userInputOperation.authorizationPanelModuleId = panelModuleId;

                this.userIdentityDescriptor.dispatchEvent(userInputOperation);
            }
        }
    },

    dispatchUserAuthenticationCompleted: {
        value: function(userIdentity) {
            var dataOperation = new DataOperation();

            dataOperation.type = DataOperation.Type.UserAuthenticationCompleted;
            dataOperation.dataDescriptor = this.userIdentityDescriptor.module.id;
            dataOperation.data = userIdentity;

            this.userIdentityDescriptor.dispatchEvent(dataOperation);
        }
    },

    dispatchUserAuthenticationFailed: {
        value: function(userIdentity) {
            var dataOperation = new DataOperation();

            dataOperation.type = DataOperation.Type.UserAuthenticationFailed;
            dataOperation.dataDescriptor = this.userIdentityDescriptor.module.id;
            dataOperation.data = userIdentity;

            this.userIdentityDescriptor.dispatchEvent(dataOperation);
        }
    },

    saveRawData: {
        value: function (record, object) {
            var self = this,
                cognitoUser = this.snapshotForDataIdentifier(object.identifier);
            if (cognitoUser) {
                cognitoUser.username = record.username;
                if (cognitoUser.signInUserSession) {
                    if (!object.isAuthenticated) {
                        cognitoUser.signOut();
                        return Promise.resolve();
                    }
                } else {
                    //This will do for now, but it needs to be replaced by the handling of an updateOperation which
                    //would carry directly the fact that the accountConfirmationCode property
                    //is what changed. In the meantime, while we're still in the same thred, we could ask the mainService what's the changed properties for that object, but it's still not tracked properly for some properties that don't have triggers doing so. Needs to clarify that.
                    if (!object.isAccountConfirmed && typeof object.accountConfirmationCode !== "undefined") {
                        return this._confirmUser(record, object, cognitoUser)
                        .then(function () {
                            return self._authenticateUser(record, object, cognitoUser)
                        })
                        .then(function() {
                            /*
                            UserIdentity is successfully confirmed, the resolved promise completes the
                            saveData call originating from the panels, here EnterVerificationCode.

                            From there it could tell it's AuthenticationPanel that the process is complete,
                            which itself could tell the UserIdentityManager, which ultimately is the one hiding (and showing) the montage level authenticationManagerPanel.

                            Right now, the UserIdentityManager listens to the main service for:
                                - this._mainService.addEventListener(DataOperation.Type.UserAuthentication, this);
                                - this._mainService.addEventListener(DataOperation.Type.UserAuthenticationCompleted, this);

                            positioning the UserIdentityService as the direct source of truth.

                            When the UserIdentityService ends up in a different thread/service/web worker, we'll need
                            data operations as the communication between
                            */
                            self.dispatchUserAuthenticationCompleted(object);
                        });
                    } else {
                        return this._authenticateUser(record, object, cognitoUser)
                        .then(function() {
                            self.dispatchUserAuthenticationCompleted(object);
                        });
                    }
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
                            dataIdentifier = object.identifier;
                        //If we had a temporary object, we need to update the primary key
                        if (dataIdentifier && dataIdentifier.primaryKey !== rawDataPrimaryKey) {
                            dataIdentifier.primaryKey = rawDataPrimaryKey;
                        } else if (!dataIdentifier) {
                            dataIdentifier = self.dataIdentifierForTypeRawData(self.userIdentityDescriptor, cognitoUser);
                            self.rootService.recordDataIdentifierForObject(dataIdentifier, object);
                            self.rootService.recordObjectForDataIdentifier(object, dataIdentifier);
                            self.recordSnapshot(dataIdentifier, cognitoUser);
                        }
                        object.isAccountConfirmed = true;
                        object.isAuthenticated = true;
                        if (stream) {
                            //Or shall we use addData??
                            self.addRawData(stream, [cognitoUser]);
                            self.rawDataDone(stream);
                        }
                        resolve(object);
                        self.dispatchUserAuthenticationCompleted(object);
                    },

                    onFailure: function (err) {
                        if (err.code === "NotAuthorizedException") {
                            var updateOperation = new DataOperation();
                            updateOperation.type = DataOperation.Type.UserAuthenticationFailed;
                            updateOperation.dataDescriptor = self.userIdentityDescriptor.module.id;
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
                                validateOperation.type = DataOperation.Type.ValidateFailed;
                                validateOperation.userMessage = "Invalid Verification Code";
                                validateOperation.dataDescriptor = self.userIdentityDescriptor.module.id;

                                /*
                                    this should describe the what the operation applies to
                                */
                                validateOperation.criteria = new Criteria().initWithExpression("identifier == $", object.identifier);

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
                                cognitoUser.resendConfirmationCode(function(resendConfirmationCodeError, result) {
                                    if (resendConfirmationCodeError) {
                                        //If that fails, not sure what we can do next?
                                        reject(resendConfirmationCodeError);
                                        if(stream) {
                                            self.rawDataError(stream,resendConfirmationCodeError);
                                        }
                                    } else {
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
                                        /*
                                            This needs to be handled in a way that it triggers the authentication
                                            panel to show the code verification sub-panel.

                                            Here we're using an update to sollicitate an input for the confirmation code, should it be a validateFailed operation instead?
                                            */
                                        var updateOperation = new DataOperation();
                                        updateOperation.type = DataOperation.Type.Update;
                                        // updateOperation.dataDescriptor = objectDescriptor.module.id;
                                        //Hack
                                        updateOperation.dataDescriptor = self.userIdentityDescriptor.module.id;

                                        /*
                                            Should be the criteria matching the UserIdentity
                                            whose password needs to change
                                        */
                                        //updateOperation.criteria = query.criteria;

                                        /*
                                            gives some information. It might be easier to use
                                            if the operation was more specific and hand more clearly defined properties?
                                        */
                                        updateOperation.context = result;

                                        updateOperation.data = {
                                            "accountConfirmationCode": undefined
                                        };

                                        reject(updateOperation);
                                    }
                                });
                            }
                        } else {
                            reject(err);
                            //reject(err.message || JSON.stringify(err));

                            if(stream) {
                                self.rawDataError(stream,err);
                            }
                        }
                    },

                    mfaRequired: function(codeDeliveryDetails) {
                        // MFA is required to complete user authentication.
                        // Get the code from user and call
                        cognitoUser.sendMFACode(mfaCode, this)
                    },

                    newPasswordRequired: function (userAttributes, requiredAttributes) {
                        var updateOperation = new DataOperation();
                        updateOperation.type = DataOperation.Type.Update;
                        // updateOperation.dataDescriptor = objectDescriptor.module.id;
                        //Hack
                        updateOperation.dataDescriptor = self.userIdentityDescriptor.module.id;
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

                        // the api doesn't accept this field back
                        delete userAttributes.email_verified;

                        // store userAttributes on global variable
                        self.sessionUserAttributes = userAttributes;

                        reject(updateOperation);
                    }
                };
                if (object.newPassword && self.sessionUserAttributes) {
                    cognitoUser.completeNewPasswordChallenge(object.newPassword, self.sessionUserAttributes, callback);
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
                    var cognitoUser, dataOperation, dataIdentifier;
                    if (err) {
                        if (err.code === "UsernameExistsException") {
                            cognitoUser = self.snapshotForDataIdentifier(object.identifier);
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
                            dataOperation.type = DataOperation.Type.ValidateFailed;
                            dataOperation.dataDescriptor = self.userIdentityDescriptor.module.id;
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
                        cognitoUser.id = uuid.generate();
                        dataIdentifier = object.identifier;
                        if (dataIdentifier) {
                            dataIdentifier.primaryKey = cognitoUser.id;
                        } else {
                            dataIdentifier = self.dataIdentifierForTypeRawData(self.userIdentityDescriptor, cognitoUser);
                            self.rootService.recordDataIdentifierForObject(dataIdentifier, object);
                            self.rootService.recordObjectForDataIdentifier(object, dataIdentifier);
                        }
                        self.recordSnapshot(object.identifier, cognitoUser);
                        object.isAccountConfirmed = false;
                        //For the saveRawData...
                        resolve(object);
                        //For the fetch for a user identity
                        if(stream) {
                            if(stream.data.length === 1) {
                                //we've already created a user identity...
                                //we need to remove it... fingers crossed
                                stream.data.splice(0,1); //it is done....
                            }
                            self.addRawData(stream, [cognitoUser]);
                            self.rawDataDone(stream);
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
                        dataOperation.type = DataOperation.Type.ValidateFailed;
                        dataOperation.userMessage = "Invalid Verification Code";
                        dataOperation.dataDescriptor = self.userIdentityDescriptor.module.id;
                        dataOperation.criteria = new Criteria().initWithExpression("identifier == $", object.identifier);
                        dataOperation.data = { accountConfirmationCode: undefined };
                        reject(dataOperation);
                    } else {
                        object.accountConfirmationCode = undefined;
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
