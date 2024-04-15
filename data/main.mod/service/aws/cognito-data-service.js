var fromIni,
    CognitoIdentityProviderClient,
    ListUserPoolsCommand,
    DescribeUserPoolCommand,
    CreateUserPoolCommand,
    ListUserPoolClientsCommand,
    DescribeUserPoolClientCommand,
    CreateUserPoolClientCommand,
    Criteria = require("montage/core/criteria").Criteria,
    AWSRawDataService = require("./a-w-s-raw-data-service").AWSRawDataService,
    SyntaxInOrderIterator = require("montage/core/frb/syntax-iterator").SyntaxInOrderIterator,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    crypto = require("crypto"),
    CognitoUserPoolDescriptor = require("../../model/aws/cognito/user-pool.mjson").montageObject,
    CognitoUserPoolClientDescriptor = require("../../model/aws/cognito/user-pool-client.mjson").montageObject;


/*
    https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cognito-identity-provider/index.htmls
*/

/**
* TODO: Document
*
* @class
* @extends AWSRawDataService
*/
exports.CognitoDataService = CognitoDataService = AWSRawDataService.specialize(/** @lends CognitoDataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function CognitoDataService() {
            this.super();
            return this;
            /*
                Currently CognitoObjects don't inherit from DataObjects, so the logical bug in event path delivery because of the inherirance causing to be routed to the PostgreSQL service instead doesn't apply here, so no need to register specificall on these object descriptors difectly.
            */
            // CognitoUserPoolDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);
            // CognitoUserPoolDescriptor.addEventListener(DataOperation.Type.CreateOperation,this,false);

            // CognitoUserPoolClientDescriptor.addEventListener(DataOperation.Type.ReadOperation,this,false);
            // CognitoUserPoolClientDescriptor.addEventListener(DataOperation.Type.CreateOperation,this,false);

        }
    },
    apiVersion: {
        value: "2016-04-18"
    },

    // __cognitoIdentityServiceProvider: {
    //     value: undefined
    // },

    // _cognitoIdentityServiceProvider: {
    //     get: function () {
    //         if (!this.__cognitoIdentityServiceProvider) {
    //             var connection = this.connection;

    //             if(connection) {
    //                 var region,
    //                     credentials = this._credentials;

    //                 if(connection.region) {
    //                     region = connection.region;
    //                 } else if(connection.resourceArn) {
    //                     region = connection.resourceArn.split(":")[3];
    //                 }

    //                 var cognitoIdentityServiceProviderOptions =  {
    //                     apiVersion: '2016-04-18',
    //                     region: region
    //                 };

    //                 if(credentials) {
    //                     cognitoIdentityServiceProviderOptions.credentials = credentials;
    //                 }

    //                 // this.__cognitoIdentityServiceProviderOld = new CognitoIdentityServiceProvider(cognitoIdentityServiceProviderOptions);
    //                 this.__cognitoIdentityServiceProvider = new CognitoIdentityProvider(cognitoIdentityServiceProviderOptions);


    //             } else {
    //                 throw "CognitoDataService could not find a connection for stage - "+this.currentEnvironment.stage+" -";
    //             }

    //         }
    //         return this.__cognitoIdentityServiceProvider;
    //     }
    // },
    instantiateAWSClientWithOptions: {
        value: function (awsClientOptions) {
            return new CognitoIdentityProviderClient(awsClientOptions);
        }
    },

    rawClientPromises: {
        get: function () {
            var promises = this.super();

            promises.push(
                require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/CognitoIdentityProviderClient").then(function(exports) { CognitoIdentityProviderClient = exports.CognitoIdentityProviderClient})
            );
            promises.push(
                require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/ListUserPoolsCommand").then(function(exports) { ListUserPoolsCommand = exports.ListUserPoolsCommand})
            );
            promises.push(
                require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/DescribeUserPoolCommand").then(function(exports) { DescribeUserPoolCommand = exports.DescribeUserPoolCommand})
            );
            promises.push(
                require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/CreateUserPoolCommand").then(function(exports) { CreateUserPoolCommand = exports.CreateUserPoolCommand})
            );
            promises.push(
                require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/ListUserPoolClientsCommand").then(function(exports) { ListUserPoolClientsCommand = exports.ListUserPoolClientsCommand})
            );
            promises.push(
                require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/DescribeUserPoolClientCommand").then(function(exports) { DescribeUserPoolClientCommand = exports.DescribeUserPoolClientCommand})
            );
            promises.push(
                require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/CreateUserPoolClientCommand").then(function(exports) { CreateUserPoolClientCommand = exports.CreateUserPoolClientCommand})
            );

            return promises;

                // this.__cognitoIdentityServiceProviderClientPromise = Promise.all(promises).then(() => { return this.rawClient;});

                this.__cognitoIdentityServiceProviderClientPromise = Promise.all([
                    // require.async("@aws-sdk/credential-provider-ini"),
                    // require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/CognitoIdentityProviderClient"),
                    // require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/ListUserPoolsCommand"),
                    // require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/DescribeUserPoolCommand"),
                    // require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/CreateUserPoolCommand"),
                    // require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/ListUserPoolClientsCommand"),
                    // require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/DescribeUserPoolClientCommand"),
                    // require.async("@aws-sdk/client-cognito-identity-provider/dist-cjs/commands/CreateUserPoolClientCommand")
                ])
                .then((resolvedModules) => {
                    fromIni = resolvedModules[0].fromIni;
                    CognitoIdentityProviderClient = resolvedModules[1].CognitoIdentityProviderClient;
                    ListUserPoolsCommand = resolvedModules[2].ListUserPoolsCommand;
                    DescribeUserPoolCommand = resolvedModules[3].DescribeUserPoolCommand;
                    CreateUserPoolCommand = resolvedModules[4].CreateUserPoolCommand;
                    ListUserPoolClientsCommand = resolvedModules[5].ListUserPoolClientsCommand;
                    DescribeUserPoolClientCommand = resolvedModules[6].DescribeUserPoolClientCommand;
                    CreateUserPoolClientCommand = resolvedModules[7].CreateUserPoolClientCommand;
                    return this.rawClient;

                });
            // return this.__cognitoIdentityServiceProviderClientPromise;
        }
    },

    mapCriteriaToRawCriteria: {
        value: function (criteria, mapping, locales, iteratorCallback) {
            var rawCriteria,
                rawCriteriaSyntax = Object.clone(criteria.syntax),
                rawCriteriaParameters = Object.clone(criteria.parameters,1),
                iterator, currentSyntax, propertyName, rawPropertyName, propertyValue, firstArgSyntax, secondArgSyntax,
                criteriaParameters = criteria.parameters,
                isCurrentSyntaxParameter,
                rawExpression,
                rawParameters

            if (!criteria) return undefined;

            /*
                Iterating to find property will only allow us to find property values that are in the parameters. If one were to bake the value in the expression string, not sure what will happen, needs to find out, I don't think this will work. The only alternative is to go though the whole tree so we can know that there's an operator above a property when one is found and find the other argument that is "baked in"
            */
            iterator = new SyntaxInOrderIterator(rawCriteriaSyntax, "equals");

            while ((currentSyntax = iterator.next("equals").value)) {
                firstArgSyntax = currentSyntax.args[0];
                secondArgSyntax = currentSyntax.args[1];

                if(firstArgSyntax.type === "property" && firstArgSyntax.args[0].type === "value") {
                    propertyName = firstArgSyntax.args[1].value;
                    rawPropertyName = firstArgSyntax.args[1].value = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                    if(secondArgSyntax.args) {
                        propertyValue = criteriaParameters[secondArgSyntax.args[1].value];
                    } else {
                        propertyValue = criteriaParameters;
                    }
                } else {
                    propertyName = secondArgSyntax.args[1].value;
                    rawPropertyName = secondArgSyntax.args[1].value = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                    propertyValue = criteriaParameters[firstArgSyntax.args[1].value];
                }

                if(iteratorCallback && rawPropertyName && propertyValue) {
                    iteratorCallback(rawPropertyName, propertyValue);
                }
            }

            // iterator = new SyntaxInOrderIterator(rawCriteriaSyntax, "property");

            // while ((currentSyntax = iterator.next("property").value)) {

            //     if((currentSyntax.args[0].type === "value") || (isCurrentSyntaxParameter = (currentSyntax.args[0].type === "parameters"))) {
            //         propertyName = currentSyntax.args[1].value;
            //         rawPropertyName = currentSyntax.args[1].value = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);

            //         if(isCurrentSyntaxParameter && rawCriteriaParameters.hasOwnProperty(propertyName)) {
            //             propertyValue = rawCriteriaParameters[currentSyntax.args[1].value] = rawCriteriaParameters[propertyName];
            //             delete rawCriteriaParameters[propertyName];
            //         }

            //         if(iteratorCallback && rawPropertyName && propertyValue) {
            //             iteratorCallback(rawPropertyName, propertyValue);
            //         }

            //     } else {
            //         throw "Couldn't find property name"
            //     }
            // }

            rawCriteria = new Criteria().initWithSyntax(rawCriteriaSyntax, criteria.parameters ? rawCriteriaParameters : null);

            return rawCriteria;
        }
    },

    _describeObjectPromiseForParams: {
        value: function(params, describeFunction) {
            var self = this;

            new Promise(function(resolve, reject) {

                describeFunction(params, function describeCallback(err, data) {
                    if (err) {
                        console.error(err, err.stack); // an error occurred
                        reject(err);
                    }
                    else {
                        //console.log(data);           // successful response
                        resolve(data[objectDescriptor.name]);
                    }
                })
            })
        }
    },

    callbackForDataPropertyNamed: {
        value: function callbackForDataPropertyNamed(objectDescriptor, readOperation, dataPropertyName, criteria, params, nextBatchFunction, describeFunction, qualifiedPropertySet) {
            var self = this;

            return function callback(err, data) {
                var error,
                    rawData,
                    rawDataPromise,
                    aRawData,
                    needsToDescribeRawData = false,
                    nextToken;
                if (err) {
                    console.error(err, err.stack); // an error occurred
                    error = err;
                    rawData = null;
                }
                else {
                    //console.log(data);           // successful response
                    error = null;
                    rawData = data[dataPropertyName];
                }

                nextToken =  data.NextToken;

                if(criteria) {
                    /*
                        Check that all properties involved in criteria are on rawData, if not, we need to get the detail of each object before being able to apply the criteria
                    */
                    if(rawData.length > 0) {
                        aRawData = rawData[0];
                        var iterator = qualifiedPropertySet.values(), iRawProperty;

                        while(iRawProperty = iterator.next().value) {
                            if(!aRawData.hasOwnProperty(iRawProperty)) {
                                needsToDescribeRawData = true;
                                break;
                            }
                        }

                        if(needsToDescribeRawData) {
                            var describeObjectPromises = [],
                                mapping = self.mappingForObjectDescriptor(objectDescriptor),
                                primaryKeyPropertyDescriptors = mapping.primaryKeyPropertyDescriptors;

                            for (var i=0, countI = rawData.length, iRawData, iParam, j, countJ; (i<countI); i++) {

                                iRawData = rawData[i];
                                iParam = {};
                                for(j=0, countJ = primaryKeyPropertyDescriptors.length ;(j<countJ); j++) {
                                    iParam[primaryKeyPropertyDescriptors[j]] = iRawData[primaryKeyPropertyDescriptors[j]];
                                }

                                describeObjectPromises.push(this._describeObjectPromiseForParams(iParam, describeFunction));
                            }
                            rawDataPromise = Promise.all(describeObjectPromises);

                        } else {
                            rawDataPromise = Promise.resolve(rawData);
                        }
                    }
                    else {
                        rawDataPromise = Promise.resolve(rawData);
                    }

                    rawDataPromise = rawDataPromise.then(function(resolvedRawData) {
                        return resolvedRawData.filter(criteria.predicateFunction);
                    });

                } else {
                    rawDataPromise = Promise.resolve(rawData);
                }

                rawDataPromise.then(function(resolvedRawData) {
                    operation = self.responseOperationForReadOperation(readOperation, error, resolvedRawData, !!nextToken/*isNotLast*/);
                    if(operation) {
                        objectDescriptor.dispatchEvent(operation);
                    }

                    if(nextToken) {
                        params.NextToken = nextToken;
                        nextBatchFunction(params, callback);
                    }
                });

            }

        }
    },

    _handleReadOperation: {
        value: function (readOperation, readFunction, params, mandatoryParamRawProperties, dataPropertyName, describeFunction) {
            console.log(readOperation);

            var self = this,
                objectDescriptor = readOperation.target,
                criteria = readOperation.criteria,
                params = params || {},
                mapping = this.mappingForObjectDescriptor(objectDescriptor),
                operationLocales = readOperation.locales,
                qualifiedProperties = new Set,
                rawCriteria = criteria ? this.mapCriteriaToRawCriteria(criteria, mapping, operationLocales, function(rawProperty, rawPropertyValue) {
                    if(mandatoryParamRawProperties && mandatoryParamRawProperties.indexOf(rawProperty) !== -1) {
                        params[rawProperty] = rawPropertyValue;
                    }
                    qualifiedProperties.add(rawProperty);
                }) : null,
                callback = this.callbackForDataPropertyNamed(objectDescriptor, readOperation, dataPropertyName || objectDescriptor.name, rawCriteria, params, readFunction, describeFunction, qualifiedProperties);

            //params.MaxResults = `${readOperation.data.readLimit ? readOperation.data.readLimit : 10}`; // required
            params.MaxResults = readOperation.data.readLimit ? Number(readOperation.data.readLimit) : 10; // required

            readFunction(params, callback);
        }
    },


    handleUserPoolReadOperation: {
        value: function (readOperation) {
            var self = this,
                objectDescriptor = readOperation.target,
                criteria = readOperation.criteria,
                qualifiedProperties = criteria && criteria.qualifiedProperties;

            console.log(readOperation);


            // function callbackForDataPropertyNamed(objectDescriptor, readOperation, dataPropertyName, criteria, params, nextBatchFunction) {
            //     return function callback(err, data) {
            //         var error,
            //             rawData,
            //             nextToken;
            //         if (err) {
            //             console.error(err, err.stack); // an error occurred
            //             error = err;
            //             rawData = null;
            //         }
            //         else {
            //             //console.log(data);           // successful response
            //             error = null;
            //             rawData = data[dataPropertyName];
            //         }

            //         nextToken =  data.NextToken;

            //         if(criteria) {
            //             rawData = rawData.filter(criteria.predicateFunction);
            //         }

            //         operation = self.responseOperationForReadOperation(readOperation, error, rawData, !!nextToken/*isNotLast*/);
            //         if(operation) {
            //             objectDescriptor.dispatchEvent(operation);
            //         }

            //         if(nextToken) {
            //             params.NextToken = nextToken;
            //             nextBatchFunction(params, callback);
            //         }
            //     }

            // }


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
                    Will need to add support for batch fetch
            */
           if(qualifiedProperties && qualifiedProperties.size === 1 && qualifiedProperties.has("Id")) {
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

                this.rawClientPromise.then(() => {
                    this.rawClient.send(new DescribeUserPoolCommand(params), this.callbackForDataPropertyNamed(objectDescriptor, readOperation, "UserPool"));
                    // this._cognitoIdentityServiceProvider.describeUserPool(params, this.callbackForDataPropertyNamed(objectDescriptor, readOperation, "UserPool"));
                });

           } else {

            /*
                watchout for criteria not being mapped to raw model
            */

                var params = {
                },
                mapping = this.mappingForObjectDescriptor(objectDescriptor),
                operationLocales = readOperation.locales,
                rawCriteria = criteria ? this.mapCriteriaToRawCriteria(criteria, mapping, operationLocales) : null,
                listUserPools = (params, callback) => {
                    this.rawClientPromise.then(() => {
                        this.rawClient.send(new ListUserPoolsCommand(params), callback);
                        //this._cognitoIdentityServiceProvider.listUserPools(params, callback);
                    });
                },
                callback = this.callbackForDataPropertyNamed(objectDescriptor, readOperation, "UserPools", rawCriteria, params, listUserPools);

                var describeUserPool = (params, callback) => {
                    this.rawClientPromise.then(() => {
                        this.rawClient.send(new DescribeUserPoolCommand(params), callback);
                        // this._cognitoIdentityServiceProvider.describeUserPool(params, callback);
                    });
                };

                this._handleReadOperation(readOperation, listUserPools, params, null, "UserPools", describeUserPool);

                //listUserPools(params, callback);
                //this._cognitoIdentityServiceProvider.listUserPools(params, callback);
            }
        }
    },

    handleUserPoolCreateOperation: {
        value: function (createOperation) {
            var self = this,
                //cognitoidentityserviceprovider = this._cognitoIdentityServiceProvider,
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

            //cognitoidentityserviceprovider.createUserPool(params, callback);
            this.rawClientPromise.then(() => {
                this.rawClient.send(new CreateUserPoolCommand(params), callback);
            });


        }
    },

    handleUserPoolClientReadOperation: {
        value: function(readOperation) {

            var self = this,
                objectDescriptor = readOperation.target,
                qualifiedProperties = readOperation.criteria.qualifiedProperties,
                readLimit = readOperation.data.readLimit,
                fetchCount = 0;

            //console.log(readOperation);

            if((qualifiedProperties.has("userPoolId") && qualifiedProperties.has("clientId")) || (qualifiedProperties.has("UserPoolId") && qualifiedProperties.has("ClientId"))) {
                let UserPoolId = readOperation.criteria.parameters.userPoolId || readOperation.criteria.parameters.UserPoolId,
                    ClientId = readOperation.criteria.parameters.clientId || readOperation.criteria.parameters.ClientId;

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
                this.rawClientPromise.then(() => {
                    this.rawClient.send(new DescribeUserPoolClientCommand(params), callback);
                });
            }
            /*
                There's something going on where we get both object-level properties ("userPoolId") and raw level ones ("UserPoolId")
            */
            else if(qualifiedProperties.length === 1 && (qualifiedProperties[0] === "userPoolId" || qualifiedProperties[0] === "UserPoolId")) {
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
                    params.MaxResults = Number(readLimit);
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
                        //If we're here we've already created the actual client, so no need to use this.rawClientPromise()
                        self.rawClient.send(new ListUserPoolClientsCommand(params), callback);
                    }
                }


                this.rawClientPromise.then(() => {
                    this.rawClient.send(new ListUserPoolClientsCommand(params), callback);
                });


            } else {
                var listUserPoolClients = (params, callback) => {
                    this.rawClientPromise.then(() => {
                        this.rawClient.send(new ListUserPoolClientsCommand(params), callback);
                        //this._cognitoIdentityServiceProvider.listUserPoolClients(params, callback);
                    });
                };

                var describeUserPoolClient = (params, callback) => {
                    this.rawClientPromise.then(() => {
                        this.rawClient.send(new DescribeUserPoolClientCommand(params), callback);
                        //this._cognitoIdentityServiceProvider.describeUserPoolClient(params, callback);
                    });
                };


                this._handleReadOperation(readOperation, listUserPoolClients, params, ["UserPoolId"], "UserPoolClients");
            }

        }
    },

    handleUserPoolClientCreateOperation: {
        value: function (createOperation) {
            var self = this,
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

            this.rawClientPromise.then(() => {
                this.rawClient.send(new CreateUserPoolClientCommand(params), callback);
            });
        }
    }


});
