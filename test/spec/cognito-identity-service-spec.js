// TODO: Can't require anything from montage/data before CognitoIdentityService or we get a circular reference error
var cognitoIdentityService = require("phront/data/main.datareel/cognito-identity-service.mjson").montageObject,
    UserIdentity = require("phront/data/main.datareel/model/user-identity").UserIdentity,
    DataService = require("montage/data/service/data-service").DataService,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
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
            }
            pendingIdentityFetch = mainService.fetchData(UserIdentity);
        })
    });

    describe("sign up", function () {
        describe("validation", function () {
            it("rejects with a ValidateFailed DataOperation if the password is rejected", function () {
                var userIdentity = mainService.createDataObject(UserIdentity);
                userIdentity.username = "newuser";
                userIdentity.password = "short";
                userIdentity.email = "newuser@mail.com";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error("Did not return an error");
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.type).toBe(DataOperation.Type.ValidateFailed);
                    expect(err.data.hasOwnProperty('password')).toBe(true);
                });
            });

            it("rejects with a ValidateFailed DataOperation if the email is rejected", function () {
                var userIdentity = mainService.createDataObject(UserIdentity);
                userIdentity.username = "newuser";
                userIdentity.password = "password";
                userIdentity.email = "not_an_email_format";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    throw new Error("Did not return an error");
                }, function (err) {
                    expect(err instanceof DataOperation).toBe(true);
                    expect(err.type).toBe(DataOperation.Type.ValidateFailed);
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
            it("marks the user as unconfirmed", function () {
                var userIdentity = mainService.createDataObject(UserIdentity);
                userIdentity.username = "newuser";
                userIdentity.password = "password";
                userIdentity.email = "newuser@mail.com";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    expect(userIdentity.isAccountConfirmed).toBe(false);
                });
            });

            it("resolves the pending UserIdentity fetch", function (done) {
                var userIdentity = mainService.createDataObject(UserIdentity);
                pendingIdentityFetch.then(function (data) {
                    expect(data[0]).toBe(userIdentity);
                    done();
                });
                userIdentity.username = "newuser";
                userIdentity.password = "password";
                userIdentity.email = "newuser@mail.com";
                mainService.saveDataObject(userIdentity);
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
                var originalPkey = userIdentity.identifier.primaryKey;
                userIdentity.username = "confirmed";
                userIdentity.password = "password";
                return mainService.saveDataObject(userIdentity)
                .then(function () {
                    expect(userIdentity.identifier.primaryKey).toBeTruthy();
                    expect(userIdentity.identifier.primaryKey).not.toBe(originalPkey);
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
                        expect(err.type).toBe(DataOperation.Type.ValidateFailed);
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
                    expect(err.type).toBe(DataOperation.Type.Update);
                    expect(err.data.hasOwnProperty("password")).toBe(true);
                });
            });

            describe("with a valid new password", function () {
                it("updates user's the password", function () {
                    userIdentity.username = "requiresNewPassword";
                    userIdentity.password = "password";
                    return mainService.saveDataObject(userIdentity)
                    .catch(function () {
                        userIdentity.newPassword = "newpassword";
                        return mainService.saveDataObject(userIdentity);
                    })
                    .then(function () {
                        expect(cognitoMock.userInfos["requiresNewPassword"].password).toBe(userIdentity.newPassword);
                    });
                });

                it("signs the user in", function () {
                    userIdentity.username = "requiresNewPassword";
                    userIdentity.password = "password";
                    return mainService.saveDataObject(userIdentity)
                    .catch(function () {
                        userIdentity.newPassword = "newpassword";
                        return mainService.saveDataObject(userIdentity);
                    })
                    .then(function () {
                        expect(userIdentity.isAuthenticated).toBe(true);
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
        })

        it("rejects the UserIdentity save with a DataOperation that indicates an incorrect password if the new password is rejected", function () {
            userIdentity.newPassword = "short";
            return mainService.saveDataObject(userIdentity)
            .then(function () {
                throw new Error("did not reject");
            }, function (err) {
                expect(err instanceof DataOperation).toBe(true);
                expect(err.type).toBe(DataOperation.Type.ValidateFailed);
                expect(err.data.hasOwnProperty("password")).toBe(true);
            });
        });
    });
});
