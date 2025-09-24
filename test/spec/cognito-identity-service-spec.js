// TODO: Can't require anything from montage/data before CognitoIdentityService or we get a circular reference error
var cognitoIdentityService = require("business.mod/data/cognito-identity-service.mjson").montageObject,
    UserIdentity = require("../model/app/user-identity").UserIdentity,
    DataService = require("mod/data/service/data-service").DataService,
    DataOperation = require("mod/data/service/data-operation").DataOperation,
    cognitoMock = require("mock/cognito"),
    mainService;

// TODO: This initialization is supposed to be done by a main.mjson, but it's broken in node
mainService = new DataService();
mainService.isUniquing = true;
cognitoIdentityService.userPoolId = "test_test";
cognitoIdentityService.clientId = "test";
cognitoIdentityService.CognitoUser = cognitoMock.CognitoUser;
cognitoIdentityService.CognitoUserPool = cognitoMock.CognitoUserPool;
mainService.addChildServices([cognitoIdentityService]);

function resetService() {
    cognitoIdentityService._typeIdentifierMap.clear();
    cognitoIdentityService._snapshot.clear();
    cognitoMock.reset();
}

describe("CognitoIdentityService", function () {
    var userIdentity,
        pendingIdentityFetch;
    beforeEach(function () {
        resetService();
        // We're forced to hack around the Montage event manager not working outside the browser
        return new Promise(function (resolve) {
            cognitoIdentityService.userIdentityDescriptor.dispatchEvent = function (dataOperation) {
                userIdentity = dataOperation.data;
                resolve();
            };
            pendingIdentityFetch = mainService.fetchData(UserIdentity);
        });
    });

    describe("sign up", function () {
        describe("validation", function () {
            it("rejects with a ValidateFailedOperation DataOperation if the password is rejected", function () {
                var userIdentity = mainService.createDataObject(UserIdentity);
                userIdentity.username = "newuser";
                userIdentity.password = "short";
                userIdentity.email = "newuser@mail.com";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error("Did not return an error");
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.type).toBe(DataOperation.Type.ValidateFailedOperation);
                    expect(err.data.hasOwnProperty('password')).toBe(true);
                });
            });

            it("rejects with a ValidateFailedOperation DataOperation if the email is rejected", function () {
                var userIdentity = mainService.createDataObject(UserIdentity);
                userIdentity.username = "newuser";
                userIdentity.password = "password";
                userIdentity.email = "not_an_email_format";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error("Did not return an error");
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.type).toBe(DataOperation.Type.ValidateFailedOperation);
                    expect(err.data.hasOwnProperty('email')).toBe(true);
                });
            });
        });

        describe("with an existing username", function () {
            describe("with an incorrect password", function () {
                it("rejects the UserIdentity save with a DataOperation that indicates a conflicting username", function () {
                    var userIdentity = mainService.createDataObject(UserIdentity);
                    userIdentity.username = "confirmed";
                    userIdentity.password = "not_the_password";
                    userIdentity.email = "confirmed@mail.com";
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        throw new Error("Did not return an error");
                    }, function (err) {
                        expect(err instanceof DataOperation).toBe(true);
                        // Debatable... should it be a CreateFailed?
                        expect(err.type).toBe(DataOperation.Type.UserAuthenticationFailed);
                    });
                });
            });

            describe("with the corresponding password", function () {
                it("resolves the pending UserIdentity fetch", function (done) {
                    var userIdentity = mainService.createDataObject(UserIdentity);
                    pendingIdentityFetch.then(function (data) {
                        expect(data[0]).toBe(userIdentity);
                        done();
                    });
                    userIdentity.username = "confirmed";
                    userIdentity.password = "password";
                    userIdentity.email = "confirmed@mail.com";
                    mainService.saveDataObject(userIdentity);
                });

                it("signs the user in", function () {
                    var userIdentity = mainService.createDataObject(UserIdentity);
                    userIdentity.username = "confirmed";
                    userIdentity.password = "password";
                    userIdentity.email = "confirmed@mail.com";
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        expect(userIdentity.isAuthenticated).toBe(true);
                    });
                });
            });
        });

        describe("with a nonexistent username", function () {
            it("rejects the UserIdentity save with a DataOperation indicating that a confirmation code was sent", function () {
                var userIdentity = mainService.createDataObject(UserIdentity);
                userIdentity.username = "newuser";
                userIdentity.password = "password";
                userIdentity.email = "newuser@mail.com";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error("did not reject");
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.type).toBe(DataOperation.Type.UpdateOperation);
                    expect(err.data.hasOwnProperty("accountConfirmationCode")).toBe(true);
                    expect(err.context.DeliveryMedium).toBe("EMAIL");
                });
            });

            it("marks the user as unconfirmed", function () {
                var userIdentity = mainService.createDataObject(UserIdentity);
                userIdentity.username = "newuser";
                userIdentity.password = "password";
                userIdentity.email = "newuser@mail.com";
                return mainService.saveDataObject(userIdentity)
                .catch(function () {
                    expect(userIdentity.isAccountConfirmed).toBe(false);
                });
            });
        });
    });

    describe("confirm account without a password", function () {
        it("confirms the account without authenticating", function () {
            userIdentity.username = "unconfirmed";
            userIdentity.accountConfirmationCode = "123456";
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                expect(userIdentity.isAccountConfirmed).toBe(true);
                expect(userIdentity.isAuthenticated).toBe(false);
                expect(cognitoMock.userInfos.unconfirmed.unconfirmed).toBe(false);
            });
        });
    });

    describe("resend confirmation code", function () {
        it("rejects the user identity save with a DataOperation indicating how the message was delivered", function () {
            userIdentity.username = "unconfirmed";
            userIdentity.needsNewConfirmationCode = true;
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                throw new Error("did not reject");
            }, function (err) {
                expect(err instanceof DataOperation).toBe(true);
                expect(err.type).toBe(DataOperation.Type.UpdateOperation);
                expect(err.data.hasOwnProperty("accountConfirmationCode")).toBe(true);
                expect(err.context.DeliveryMedium).toBe("EMAIL");
            });
        });

        it("resends the code", function () {
            var emailCount = cognitoMock.emailedConfirmationCodes.length;
            userIdentity.username = "unconfirmed";
            userIdentity.needsNewConfirmationCode = true;
            return mainService.saveDataObject(userIdentity)
            .catch(function () {
                expect(cognitoMock.emailedConfirmationCodes.length).toBe(emailCount + 1);
                expect(cognitoMock.emailedConfirmationCodes[cognitoMock.emailedConfirmationCodes.length - 1]).toBe("unconfirmed");
            });
        });
    });

    describe("sign in", function () {
        describe("with valid credentials to an active & confirmed account", function () {
            it("resolves the UserIdentity save", function () {
                userIdentity.username = "confirmed";
                userIdentity.password = "password";
                return mainService.saveDataObject(userIdentity);
            });

            it("resolves the pending UserIdentity fetch", function (done) {
                pendingIdentityFetch.then(function (data) {
                    expect(data[0]).toBe(userIdentity);
                    done();
                });
                userIdentity.username = "confirmed";
                userIdentity.password = "password";
                return mainService.saveDataObject(userIdentity);
            });

            it("updates the user identity's primary key if needed", function () {
                var originalPkey = userIdentity.dataIdentifier.primaryKey;
                userIdentity.username = "confirmed";
                userIdentity.password = "password";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    expect(userIdentity.dataIdentifier.primaryKey).toBeTruthy();
                    expect(userIdentity.dataIdentifier.primaryKey).not.toBe(originalPkey);
                });
            });

            it("signs the user in", function () {
                userIdentity.username = "confirmed";
                userIdentity.password = "password";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    expect(userIdentity.isAuthenticated).toBe(true);
                });
            });
        });

        describe("with invalid credentials", function () {
            it("rejects the UserIdentity save with a DataOperation that indicates incorrect credentials", function () {
                userIdentity.username = "confirmed";
                userIdentity.password = "not_the_password";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error("did not reject");
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.type).toBe(DataOperation.Type.UserAuthenticationFailed);
                    expect(err.data.hasOwnProperty("username")).toBe(true);
                    expect(err.data.hasOwnProperty("password")).toBe(true);
                });
            });
        });

        describe("with valid credentials to an unconfirmed account", function () {
            it("rejects the UserIdentity save with a DataOperation indicating that a confirmation code is required", function () {
                userIdentity.username = "unconfirmed";
                userIdentity.password = "password";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error("Did not reject");
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.data.hasOwnProperty('accountConfirmationCode')).toBeTruthy();
                });
            });

            it("sends a new confirmation email", function () {
                var emailCount = cognitoMock.emailedConfirmationCodes.length;
                userIdentity.username = "unconfirmed";
                userIdentity.password = "password";
                return mainService.saveDataObject(userIdentity)
                .catch(function () {})
                .then(function () {
                    expect(cognitoMock.emailedConfirmationCodes.length).toBe(emailCount + 1);
                    expect(cognitoMock.emailedConfirmationCodes[cognitoMock.emailedConfirmationCodes.length - 1]).toBe("unconfirmed");
                });
            });

            describe("with an incorrect confirmation code", function () {
                it("rejects the UserIdentity save with a DataOperation indicating that the confirmation code was wrong", function () {
                    userIdentity.username = "unconfirmed";
                    userIdentity.password = "password";
                    userIdentity.accountConfirmationCode = "abcdef";
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        throw new Error("Did not reject");
                    }, function (err) {
                        expect(err instanceof DataOperation).toBe(true);
                        expect(err.type).toBe(DataOperation.Type.ValidateFailedOperation);
                        expect(err.data.hasOwnProperty('accountConfirmationCode')).toBe(true);
                    });
                });
            });

            describe("with a correct confirmation code", function () {
                it("resolves the UserIdentity save", function () {
                    userIdentity.username = "unconfirmed";
                    userIdentity.password = "password";
                    userIdentity.accountConfirmationCode = "123456";
                    return mainService.saveDataObject(userIdentity);
                });

                it("signs the user in", function () {
                    userIdentity.username = "unconfirmed";
                    userIdentity.password = "password";
                    userIdentity.accountConfirmationCode = "123456";
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        expect(userIdentity.isAuthenticated).toBe(true);
                    });
                });

                it("marks the user as confirmed", function () {
                    userIdentity.username = "unconfirmed";
                    userIdentity.password = "password";
                    userIdentity.accountConfirmationCode = "123456";
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        expect(userIdentity.isAccountConfirmed).toBe(true);
                    });
                });

                it("unsets the accountConfirmationCode", function () {
                    userIdentity.username = "unconfirmed";
                    userIdentity.password = "password";
                    userIdentity.accountConfirmationCode = "123456";
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        expect(userIdentity.accountConfirmationCode).toBeFalsy();
                    });
                })
            });
        });

        describe("with valid credentials to an account that requires a new password", function () {
            it("rejects the UserIdentity save with a DataOperation that indicates a new password is required", function () {
                userIdentity.username = "requiresNewPassword";
                userIdentity.password = "password";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error("did not reject");
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.type).toBe(DataOperation.Type.UpdateOperation);
                    expect(err.data.hasOwnProperty("password")).toBe(true);
                });
            });

            describe("with a valid new password", function () {
                beforeEach(function () {
                    userIdentity.username = "requiresNewPassword";
                    userIdentity.password = "password";
                    return mainService.saveDataObject(userIdentity)
                    .catch(function () {});
                });

                it("updates user's the password", function () {
                    userIdentity.newPassword = "newpassword";
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        expect(cognitoMock.userInfos["requiresNewPassword"].password).toBe("newpassword");
                    });
                });

                it("signs the user in", function () {
                    userIdentity.newPassword = "newpassword";
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        expect(userIdentity.isAuthenticated).toBe(true);
                    });
                });

                it("resolves the pending UserIdentity fetch", function (done) {
                    pendingIdentityFetch.then(function (data) {
                        expect(data[0]).toBe(userIdentity);
                        done();
                    });
                    userIdentity.newPassword = "newpassword";
                    return mainService.saveDataObject(userIdentity);
                });

                it("unsets newPassword from the user identity", function () {
                    userIdentity.newPassword = "newpassword";
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        expect(userIdentity.newPassword).not.toBeDefined();
                    });
                });
            });
        });

        describe("with valid credentials to an account with MFA", function () {
            it("rejects the UserIdentity save with a DataOperation that indicates a mfaCode is required", function () {
                userIdentity.username = "smsMfa";
                userIdentity.password = "password";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error("did not reject");
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.type).toBe(DataOperation.Type.UpdateOperation);
                    expect(err.data.hasOwnProperty("mfaCode")).toBe(true);
                });
            });

            describe("with an incorrect MFA code", function () {
                it("rejects the UserIdentity save with a DataOperation that indicates the mfaCode was wrong", function () {
                    userIdentity.username = "smsMfa";
                    userIdentity.password = "password";
                    userIdentity.mfaCode = 123;
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        throw new Error("Did not reject");
                    }, function (err) {
                        expect(err instanceof DataOperation).toBe(true);
                        expect(err.type).toBe(DataOperation.Type.ValidateFailedOperation);
                        expect(err.data.hasOwnProperty('mfaCode')).toBe(true);
                    });
                });
            });

            describe("with a correct MFA code", function () {
                beforeEach(function () {
                    userIdentity.username = "smsMfa";
                    userIdentity.password = "password";
                    return mainService.saveDataObject(userIdentity)
                    .catch(function () {});
                });

                it("signs the user in", function () {
                    userIdentity.mfaCode = cognitoMock.userInfos.smsMfa.mfaCode;
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        expect(userIdentity.isAuthenticated).toBe(true);
                    });
                });

                it("resolves the pending UserIdentity fetch", function (done) {
                    pendingIdentityFetch.then(function (data) {
                        expect(data[0]).toBe(userIdentity);
                        done();
                    });
                    userIdentity.mfaCode = cognitoMock.userInfos.smsMfa.mfaCode;
                    return mainService.saveDataObject(userIdentity);
                });

                it("unsets mfaCode from the user identity", function () {
                    userIdentity.mfaCode = cognitoMock.userInfos.smsMfa.mfaCode;
                    return mainService.saveDataObject(userIdentity)
                    .then(function () {
                        expect(userIdentity.mfaCode).not.toBeDefined();
                    });
                });
            });
        });
    });

    describe("sign out", function () {
        beforeEach(function () {
            userIdentity.username = "confirmed";
            userIdentity.password = "password";
            return mainService.saveDataObject(userIdentity);
        });

        it("signs the cognito user out", function () {
            userIdentity.isAuthenticated = false;
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                var cognitoUser = cognitoIdentityService.snapshotForObject(userIdentity);
                expect(userIdentity.isAuthenticated).toBe(false);
                expect(cognitoUser.signInUserSession).toBeFalsy();
            });
        });
    });

    describe("change password", function () {
        beforeEach(function () {
            userIdentity.username = "confirmed";
            userIdentity.password = "password";
            return mainService.saveDataObject(userIdentity);
        });

        it("changes the password", function () {
            userIdentity.password = "password";
            userIdentity.newPassword = "newpassword";
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                expect(cognitoMock.userInfos["confirmed"].password).toBe(userIdentity.newPassword);
            });
        });

        it("rejects the UserIdentity save with a DataOperation that indicates an authentication failure if the current password is rejected", function () {
            userIdentity.password = "not_the_password";
            userIdentity.newPassword = "newpassword";
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                throw new Error("did not reject");
            }, function (err) {
                expect(err instanceof DataOperation).toBe(true);
                expect(err.type).toBe(DataOperation.Type.UserAuthenticationFailed);
                expect(err.data.hasOwnProperty("username")).toBe(true);
                expect(err.data.hasOwnProperty("password")).toBe(true);
            });
        });

        it("rejects the UserIdentity save with a DataOperation that indicates an incorrect password if the new password is rejected", function () {
            userIdentity.password = "password";
            userIdentity.newPassword = "short";
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                throw new Error("did not reject");
            }, function (err) {
                expect(err instanceof DataOperation).toBe(true);
                expect(err.type).toBe(DataOperation.Type.ValidateFailedOperation);
                expect(err.data.hasOwnProperty("password")).toBe(true);
            });
        });
    });

    describe("activate MFA", function () {
        beforeEach(function () {
            userIdentity.username = "confirmed";
            userIdentity.password = "password";
            return mainService.saveDataObject(userIdentity);
        });

        it("sets the user's MFA preference", function () {
            userIdentity.isMfaEnabled = true;
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                expect(userIdentity.isMfaEnabled).toBe(true);
                expect(cognitoMock.userInfos.confirmed.smsMfa).toBe(true);
            });
        });
    });

    describe("deactivate MFA", function () {
        beforeEach(function () {
            userIdentity.username = "confirmed";
            userIdentity.password = "password";
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                userIdentity.isMfaEnabled = true;
                return mainService.saveDataObject(userIdentity);
            });
        });

        it("sets the user's MFA preference", function () {
            userIdentity.isMfaEnabled = false;
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                expect(userIdentity.isMfaEnabled).toBe(false);
                expect(cognitoMock.userInfos.confirmed.smsMfa).toBe(false);
            });
        });
    });

    describe("update user attributes", function () {
        beforeEach(function () {
            userIdentity.username = "confirmed";
            userIdentity.password = "password";
            return mainService.saveDataObject(userIdentity);
        });

        describe("phone", function () {
            it("updates the user's phone_number attribute", function () {
                userIdentity.phone = "+10987654321";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    expect(userIdentity.phone).toBe("+10987654321");
                    expect(cognitoMock.userInfos.confirmed.attributes.filter(function (attribute) {
                        return attribute.Name === "phone_number";
                    })[0].Value).toBe("+10987654321");
                });
            });

            it("rejects with a DataOperation if the phone number is invalid", function () {
                userIdentity.phone = "1234567890";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error('did not reject');
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.type).toBe(DataOperation.Type.ValidateFailedOperation);
                });
            });
        });
    });
});
