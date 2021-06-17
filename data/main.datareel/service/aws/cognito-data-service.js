var AWS = require('aws-sdk'),
    CognitoIdentityServiceProvider =  AWS.CognitoIdentityServiceProvider,
    DataService = require("montage/data/service/data-service").DataService,
    RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    SyntaxInOrderIterator = require("montage/core/frb/syntax-iterator").SyntaxInOrderIterator,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    crypto = require("crypto"),
    CognitoUserPoolDescriptor = require("../../model/aws/cognito/user-pool.mjson").montageObject,
    CognitoUserPoolClientDescriptor = require("../../model/aws/cognito/user-pool-client.mjson").montageObject;

/**
* TODO: Document
*
* @class
* @extends RawDataService
*/
exports.CognitoDataService = CognitoDataService = RawDataService.specialize(/** @lends CognitoDataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function CognitoDataService() {
            RawDataService.call(this);

            /*
                Currently CognitoObjects don't inherit from DataObjects, so the logical bug in event path delivery because of the inherirance causing to be routed to the PostgreSQL service instead doesn't apply here, so no need to register specificall on these object descriptors difectly.
            */
            // CognitoUserPoolDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);
            // CognitoUserPoolDescriptor.addEventListener(DataOperation.Type.CreateOperation,this,false);

            // CognitoUserPoolClientDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);
            // CognitoUserPoolClientDescriptor.addEventListener(DataOperation.Type.CreateOperation,this,false);

        }
    },
    _connection: {
        value: undefined
    },

    connection: {
        get: function() {
            if(!this._connection) {
                this.connection = this.connectionForIdentifier(this.currentEnvironment.stage);
            }
            return this._connection;
        },
        set: function(value) {

            if(value !== this._connection) {
                this._connection = value;
            }
        }
    },

    __cognitoIdentityServiceProvider: {
        value: undefined
    },

    _cognitoIdentityServiceProvider: {
        get: function () {
            if (!this.__cognitoIdentityServiceProvider) {
                var connection = this.connection;

                if(connection) {
                    var region;

                    if(connection.region) {
                        region = connection.region;
                    } else if(connection.resourceArn) {
                        region = connection.resourceArn.split(":")[3];
                    }

                    var cognitoIdentityServiceProviderOptions =  {
                        apiVersion: '2016-04-18',
                        region: region
                    };

                    var credentials = new AWS.SharedIniFileCredentials({profile: connection.profile});
                    if(credentials && credentials.accessKeyId !== undefined && credentials.secretAccessKey !== undefined) {
                        cognitoIdentityServiceProviderOptions.credentials = credentials;
                    } else {
                        cognitoIdentityServiceProviderOptions.accessKeyId = process.env.aws_access_key_id;
                        cognitoIdentityServiceProviderOptions.secretAccessKey = process.env.aws_secret_access_key;
                    }

                    this.__cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider(cognitoIdentityServiceProviderOptions);

                } else {
                    throw "CognitoDataService could not find a connection for stage - "+this.currentEnvironment.stage+" -";
                }

            }
            return this.__cognitoIdentityServiceProvider;
        }
    },


    handleUserPoolReadOperation: {
        value: function (readOperation) {
            var self = this,
                objectDescriptor = readOperation.target;

            console.log(readOperation);


            function callbackForDataPropertyNamed(objectDescriptor, readOperation, dataPropertyName) {
                return function callback(err, data) {
                    var error, rawData;
                    if (err) {
                        console.error(err, err.stack); // an error occurred
                        error = err;
                        rawData = null;
                    }
                    else {
                        //console.log(data);           // successful response
                        error = null;
                        rawData = data;
                    }

                    operation = self.responseOperationForReadOperation(readOperation, error, rawData[dataPropertyName], false/*isNotLast*/);
                    objectDescriptor.dispatchEvent(operation);
                }

            }


            /*

                For reading A UserPool App clients
            */
            /*
                var params = {
                        UserPoolId: 'STRING_VALUE', // requireD
                        MaxResults: 'NUMBER_VALUE',
                        NextToken: 'STRING_VALUE'
                  };
                  cognitoidentityserviceprovider.listUserPoolClients(params, function(err, data) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else     console.log(data);           // successful response
                  });
            */

            /*
                  For reading all UserPools

                  var params = {
                        MaxResults: 'NUMBER_VALUE', // required
                        NextToken: 'STRING_VALUE'
                    };
                    cognitoidentityserviceprovider.listUserPools(params, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else     console.log(data);           // successful response
                    });
            */

            /*
                    Will need to add support for bactch fetch
            */
           if(!readOperation.criteria) {
                var params = {
                    MaxResults: `${readOperation.data.readLimit ? readOperation.data.readLimit : 10}` // required
                };
                this._cognitoIdentityServiceProvider.listUserPools(params, callbackForDataPropertyNamed(objectDescriptor, readOperation, "UserPools"));
            } else {
                var qualifiedProperties = readOperation.criteria.qualifiedProperties;

                if(qualifiedProperties.has("Id")) {
                    /*
                        For getting a UserPool's properties not returned by default by listUserPools:

                        var params = {
                            UserPoolId: 'STRING_VALUE' //required
                        };
                        cognitoidentityserviceprovider.describeUserPool(params, function(err, data) {
                        if (err) console.log(err, err.stack); // an error occurred
                        else     console.log(data);           // successful response
                        });
                    */

                    let UserPoolId = readOperation.criteria.parameters.Id;

                    var params = {
                        UserPoolId: UserPoolId /* required */
                    };

                    this._cognitoIdentityServiceProvider.describeUserPool(params, callbackForDataPropertyNamed(objectDescriptor, readOperation,"UserPool"));
                } else {
                    throw new Error("handleUserPoolReadOperation: criteria not handled: "+ JSON.stringify(readOperation.criteria));
                }
            }
        }
    },

    handleUserPoolCreateOperation: {
        value: function (createOperation) {
            var self = this,
                cognitoidentityserviceprovider = this._cognitoIdentityServiceProvider,
                objectDescriptor = createOperation.target,
                referrer = createOperation.referrer,
                referrerId = createOperation.referrerId,
                cognitoUserPoolData = createOperation.data;

            console.log(createOperation);

            var params = {
                PoolName: cognitoUserPoolData.name, // required
                AccountRecoverySetting: {
                  RecoveryMechanisms: [
                    {
                      Name: "admin_only", // required
                      Priority: 1 // required
                    }
                    //,
                    // more items
                  ]
                }
                /*
                ,
                AdminCreateUserConfig: {
                  AllowAdminCreateUserOnly: true || false,
                  InviteMessageTemplate: {
                    EmailMessage: 'STRING_VALUE',
                    EmailSubject: 'STRING_VALUE',
                    SMSMessage: 'STRING_VALUE'
                  },
                  UnusedAccountValidityDays: 'NUMBER_VALUE'
                },
                */
               /*
                AliasAttributes: [
                  phone_number | email | preferred_username,
                  // more items
                ],
                */
               /*
                AutoVerifiedAttributes: [
                  phone_number | email,
                  // more items
                ],
                */
               /*
                DeviceConfiguration: {
                  ChallengeRequiredOnNewDevice: true || false,
                  DeviceOnlyRememberedOnUserPrompt: true || false
                },
                */

               /*
                EmailConfiguration: {
                  ConfigurationSet: 'STRING_VALUE',
                  EmailSendingAccount: COGNITO_DEFAULT | DEVELOPER,
                  From: 'STRING_VALUE',
                  ReplyToEmailAddress: 'STRING_VALUE',
                  SourceArn: 'STRING_VALUE'
                },
                EmailVerificationMessage: 'STRING_VALUE',
                EmailVerificationSubject: 'STRING_VALUE',
                */

                /*
                LambdaConfig: {
                  CreateAuthChallenge: 'STRING_VALUE',
                  CustomEmailSender: {
                    LambdaArn: 'STRING_VALUE', // required
                    LambdaVersion: V1_0 // required
                  },
                  CustomMessage: 'STRING_VALUE',
                  CustomSMSSender: {
                    LambdaArn: 'STRING_VALUE', // required
                    LambdaVersion: V1_0 // required
                  },
                  DefineAuthChallenge: 'STRING_VALUE',
                  KMSKeyID: 'STRING_VALUE',
                  PostAuthentication: 'STRING_VALUE',
                  PostConfirmation: 'STRING_VALUE',
                  PreAuthentication: 'STRING_VALUE',
                  PreSignUp: 'STRING_VALUE',
                  PreTokenGeneration: 'STRING_VALUE',
                  UserMigration: 'STRING_VALUE',
                  VerifyAuthChallengeResponse: 'STRING_VALUE'
                },
                */

                /*
                MfaConfiguration: OFF | ON | OPTIONAL,
                Policies: {
                  PasswordPolicy: {
                    MinimumLength: 'NUMBER_VALUE',
                    RequireLowercase: true || false,
                    RequireNumbers: true || false,
                    RequireSymbols: true || false,
                    RequireUppercase: true || false,
                    TemporaryPasswordValidityDays: 'NUMBER_VALUE'
                  }
                },
                Schema: [
                  {
                    AttributeDataType: String | Number | DateTime | Boolean,
                    DeveloperOnlyAttribute: true || false,
                    Mutable: true || false,
                    Name: 'STRING_VALUE',
                    NumberAttributeConstraints: {
                      MaxValue: 'STRING_VALUE',
                      MinValue: 'STRING_VALUE'
                    },
                    Required: true || false,
                    StringAttributeConstraints: {
                      MaxLength: 'STRING_VALUE',
                      MinLength: 'STRING_VALUE'
                    }
                  },
                  // more items
                ],
                SmsAuthenticationMessage: 'STRING_VALUE',
                SmsConfiguration: {
                  SnsCallerArn: 'STRING_VALUE', // required
                  ExternalId: 'STRING_VALUE'
                },
                SmsVerificationMessage: 'STRING_VALUE',
                UserPoolAddOns: {
                  AdvancedSecurityMode: OFF | AUDIT | ENFORCED // required
                },
                UserPoolTags: {
                  '<TagKeysType>': 'STRING_VALUE',
                  // '<TagKeysType>': ...
                },
                UsernameAttributes: [
                  phone_number | email,
                  // more items
                ],
                UsernameConfiguration: {
                  CaseSensitive: true || false // required
                },
                VerificationMessageTemplate: {
                  DefaultEmailOption: CONFIRM_WITH_LINK | CONFIRM_WITH_CODE,
                  EmailMessage: 'STRING_VALUE',
                  EmailMessageByLink: 'STRING_VALUE',
                  EmailSubject: 'STRING_VALUE',
                  EmailSubjectByLink: 'STRING_VALUE',
                  SmsMessage: 'STRING_VALUE'
                }

                */
              };

              /*
                if there's a referrer or referrerId, we're in a transaction, we don't advertize the createCompletedOperation/createFailedOperation in that case.

                Otherwise, it's a one-off, we do send a createCompletedOperation/createFailedOperation.

                We could also return a promise if we wanted to guarantee that we're done before another operation is handled.

                We will need something like that in order to have UserPool (stored in postgresql that stores as foreign key the primary key of a CognitoUserPool, that we only get after create, so if both were in the same transaction, wether some externale logic does, or if it is the UserPool that takes care of creatigthe Cognito UserPoool it needs before being able to execute a create, one will have to happen before the other.

                Will we need to express explicitely a dependency between the operations? It would be bad to force an execution one after the other for every case as that would seriously impact performances.
              */

              function callback(err, data) {

                var error, rawData;
                if (err) {
                    console.error(err, err.stack); // an error occurred
                    error = err;
                    rawData = null;
                }
                else {
                    //console.log(data);           // successful response
                    error = null;
                    rawData = data;
                }

                if(!referrer && !referrerId) {
                    var operation = new DataOperation();
                    operation.referrerId = createOperation.id;
                    operation.clientId = createOperation.clientId;

                    operation.target = createOperation.target;
                    if (err) {
                        // an error occurred
                        console.log(err, err.stack, rawDataOperation);
                        operation.type = DataOperation.Type.CreateFailedOperation;
                        //Should the data be the error?
                        operation.data = err;
                    }
                    else {
                        // successful response
                        operation.type = DataOperation.Type.CreateCompletedOperation;
                        //We provide the inserted record as the operation's payload
                        operation.data = data.UserPool;
                    }

                    objectDescriptor.dispatchEvent(operation);
                }

            }

              cognitoidentityserviceprovider.createUserPool(params, callback);

        }
    },

    handleUserPoolClientReadOperation: {
        value: function(readOperation) {

            var self = this,
                cognitoidentityserviceprovider = this._cognitoIdentityServiceProvider,
                objectDescriptor = readOperation.target,
                qualifiedProperties = readOperation.criteria.qualifiedProperties,
                readLimit = readOperation.data.readLimit,
                fetchCount = 0;

            //console.log(readOperation);

            if(qualifiedProperties.has("UserPoolId") && qualifiedProperties.has("ClientId")) {
                let UserPoolId = readOperation.criteria.parameters.UserPoolId,
                    ClientId = readOperation.criteria.parameters.ClientId;

                /*
                var params = {
                    ClientId: 'STRING_VALUE', // required
                    UserPoolId: 'STRING_VALUE' // required
                };
                cognitoidentityserviceprovider.describeUserPoolClient(params, function(err, data) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else     console.log(data);           // successful response
                });
                */

                function callback(err, data) {
                    var error, rawData;
                    if (err) {
                        console.error(err, err.stack); // an error occurred
                        error = err;
                        rawData = null;
                    }
                    else {
                        //console.log(data);           // successful response
                        error = null;
                        rawData = data;
                    }

                    operation = self.responseOperationForReadOperation(readOperation, error, [rawData.UserPoolClient], false/*isNotLast*/);
                    objectDescriptor.dispatchEvent(operation);
                }

                var params = {
                    ClientId: ClientId, // required
                    UserPoolId: UserPoolId // required
                };
                cognitoidentityserviceprovider.describeUserPoolClient(params, callback);
            }
            else if(qualifiedProperties.length === 1 && qualifiedProperties[0] === "UserPoolId") {
                /*
                    Careful if that changes, but that's how we have mapping setup
                */
                var UserPoolId = readOperation.criteria.parameters;
                /*
                    For reading A UserPool App clients
                */

                // var params = {
                //         UserPoolId: STRING_VALUE, // requireD
                //         MaxResults: 'NUMBER_VALUE',
                //         NextToken: 'STRING_VALUE'
                // };

                var params = {
                    UserPoolId: UserPoolId // requireD
                };

                if(readLimit) {
                    params.MaxResults = readLimit.toString();
                }


                function callback(err, data) {
                    var nextToken, error, rawData;
                    if (err) {
                        console.error(err, err.stack); // an error occurred
                        error = err;
                        rawData = null;
                    }
                    else {
                        //console.log(data);           // successful response
                        error = null;
                        rawData = data;
                        nextToken = data.NextToken;
                        fetchCount += rawData.UserPoolClients.length;
                    }

                    isNotLast = nextToken && (!readLimit || (readLimit && fetchCount <= readLimit))

                    operation = self.responseOperationForReadOperation(readOperation, error, rawData.UserPoolClients, isNotLast/*isNotLast*/);
                    objectDescriptor.dispatchEvent(operation);

                    if(isNotLast) {
                        params.NextToken = nextToken;
                        cognitoidentityserviceprovider.listUserPoolClients(params, callback);
                    }
                }


                cognitoidentityserviceprovider.listUserPoolClients(params, callback);


            } else {
                throw new Error("Unable to perform readOperation: ", readOperation);
            }

        }
    },

    handleUserPoolClientCreateOperation: {
        value: function (createOperation) {
            var self = this,
                cognitoidentityserviceprovider = this._cognitoIdentityServiceProvider,
                objectDescriptor = createOperation.target,
                referrer = createOperation.referrer,
                referrerId = createOperation.referrerId,
                cognitoUserPoolData = createOperation.data;

            var params = {
                ClientName: cognitoUserPoolData.ClientName, // required
                UserPoolId: cognitoUserPoolData.UserPoolId // required

                /*
                ,
                AccessTokenValidity: 'NUMBER_VALUE',
                AllowedOAuthFlows: [
                  code | implicit | client_credentials,
                  // more items
                ],
                AllowedOAuthFlowsUserPoolClient: true || false,
                AllowedOAuthScopes: [
                  'STRING_VALUE',
                  // more items
                ],
                AnalyticsConfiguration: {
                  ApplicationArn: 'STRING_VALUE',
                  ApplicationId: 'STRING_VALUE',
                  ExternalId: 'STRING_VALUE',
                  RoleArn: 'STRING_VALUE',
                  UserDataShared: true || false
                },
                CallbackURLs: [
                  'STRING_VALUE',
                  // more items
                ],
                DefaultRedirectURI: 'STRING_VALUE',
                EnableTokenRevocation: true || false,
                ExplicitAuthFlows: [
                  ADMIN_NO_SRP_AUTH | CUSTOM_AUTH_FLOW_ONLY | USER_PASSWORD_AUTH | ALLOW_ADMIN_USER_PASSWORD_AUTH | ALLOW_CUSTOM_AUTH | ALLOW_USER_PASSWORD_AUTH | ALLOW_USER_SRP_AUTH | ALLOW_REFRESH_TOKEN_AUTH,
                  // more items
                ]
                */,
                GenerateSecret: cognitoUserPoolData.hasOwnProperty("GenerateSecret") ? cognitoUserPoolData.GenerateSecret : false //|| false
                /*,
                IdTokenValidity: 'NUMBER_VALUE',
                LogoutURLs: [
                  'STRING_VALUE',
                  // more items
                ],
                PreventUserExistenceErrors: LEGACY | ENABLED,
                ReadAttributes: [
                  'STRING_VALUE',
                  // more items
                ],
                RefreshTokenValidity: 'NUMBER_VALUE',
                SupportedIdentityProviders: [
                  'STRING_VALUE',
                  // more items
                ],
                TokenValidityUnits: {
                  AccessToken: seconds | minutes | hours | days,
                  IdToken: seconds | minutes | hours | days,
                  RefreshToken: seconds | minutes | hours | days
                },
                WriteAttributes: [
                  'STRING_VALUE',
                  // more items
                ]
                */
              };


              /*
                if there's a referrer or referrerId, we're in a transaction, we don't advertize the createCompletedOperation/createFailedOperation in that case.

                Otherwise, it's a one-off, we do send a createCompletedOperation/createFailedOperation.

                We could also return a promise if we wanted to guarantee that we're done before another operation is handled.

                We will need something like that in order to have UserPool (stored in postgresql that stores as foreign key the primary key of a CognitoUserPool, that we only get after create, so if both were in the same transaction, wether some externale logic does, or if it is the UserPool that takes care of creatigthe Cognito UserPoool it needs before being able to execute a create, one will have to happen before the other.

                Will we need to express explicitely a dependency between the operations? It would be bad to force an execution one after the other for every case as that would seriously impact performances.
              */

              function callback(err, data) {
                var error, rawData;

                if (err) {
                    console.error(err, err.stack); // an error occurred
                    error = err;
                    rawData = null;
                }
                else {
                    //console.log(data);           // successful response
                    error = null;
                    rawData = data;
                }

                if(!referrer && !referrerId) {
                    var operation = new DataOperation();
                    operation.referrerId = createOperation.id;
                    operation.clientId = createOperation.clientId;

                    operation.target = createOperation.target;
                    if (err) {
                        // an error occurred
                        console.log(err, err.stack, rawDataOperation);
                        operation.type = DataOperation.Type.CreateFailedOperation;
                        //Should the data be the error?
                        operation.data = err;
                    }
                    else {
                        // successful response
                        operation.type = DataOperation.Type.CreateCompletedOperation;
                        //We provide the inserted record as the operation's payload
                        operation.data = data.UserPoolClient;
                    }

                    objectDescriptor.dispatchEvent(operation);
                }

            }
            cognitoidentityserviceprovider.createUserPoolClient(params, callback);
        }
    }


});
