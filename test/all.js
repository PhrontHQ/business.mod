console.log('Phront testing', 'Start');

module.exports = require("montage/testing/run").run(require, [
    // TODO: Broken
    // "spec/phront-service",
    "spec/data-models/role-spec",
    //"spec/data-models/event-spec",
    //"spec/data-models/service-spec"
    //"spec/cognito-identity-service-spec"
]).then(function () {
    console.log('montage-testing', 'End');
}, function (err) {
    console.log('montage-testing', 'Fail', err, err.stack);
    throw err;
});
