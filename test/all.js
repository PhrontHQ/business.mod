console.log('montage-testing', 'Start');

module.exports = require("montage-testing").run(require, [
    // TODO: Broken
    // "spec/phront-service",
    "spec/cognito-identity-service-spec"
]).then(function () {
    console.log('montage-testing', 'End');
}, function (err) {
    console.log('montage-testing', 'Fail', err, err.stack);
    throw err;
});
