'use strict';

var Montage = require('montage/montage');
var PATH = require("path");
global.XMLHttpRequest = require('xhr2');
var OperationCoordinatorPromise;

// //From Montage
// Load package
OperationCoordinatorPromise = Montage.loadPackage(PATH.join(__dirname, "."), {
  mainPackageLocation: PATH.join(__filename, ".")
})
.then(function (mr) {
  return mr.async('phront-data/spec/phront-service-usage/phront-service-usage');
})
.then(function (module) {
  module.promise.then(function(resolved) {
    console.log(resolved);

  }, function rejected(rejected) {
    console.error(rejected);
  });
});


