'use strict';
var Montage = require('montage/montage');
var PATH = require("path");
var workerPromise;


//console.log("module:",module,"filename:",__filename,"dirname",__dirname);
//Load Montage and Phront dependencies
// workerPromise = Montage.loadPackage(PATH.join(__dirname, "."), {
//     mainPackageLocation: PATH.join(__filename, ".")
//   })

/*
    The idea here is to run main.js as if it were in the final function itself,
    to standaardize and reuse shared logic and shift it to our own objects,
    the worker that can be subclassed, and other setups that can be serialized
    and where serialization can be reused.

    So we use module.parent to setup montage as if we were in that projet

    and we put the symbols we expect on parent's exports as well
*/
workerPromise = Montage.loadPackage(PATH.join(module.parent.path, "."), {
mainPackageLocation: PATH.join(module.parent.filename, ".")
}).then(function (mr) {
    return mr.async("./main.mjson");
}).then(function (module) {
    console.log("Phront Worker reporting for duty!");
    var worker = module.montageObject;
    return worker;
});

module.parent.exports.worker = exports.worker = workerPromise;

module.parent.exports.connect = exports.connect = (event, context, cb) => {
    workerPromise.then(function(worker) {
      if(typeof worker.handleConnect === "function") {
          return worker.handleConnect(event, context, cb);
      } else {
          cb(null, {
              statusCode: 200,
              body: 'Connected.'
          });
      }
    });
};

module.parent.exports.default = exports.default = async (event, context, cb) => {
  const worker = await workerPromise;
  if(typeof worker.handleMessage === "function") {
      await worker.handleMessage(event, context, cb);
  }

  cb(null, {
      statusCode: 200,
      body: 'Sent.'
  });
};

module.parent.exports.disconnect = exports.disconnect = (event, context, cb) => {
  workerPromise.then(function(worker) {

      if(typeof worker.handleDisconnect === "function") {
          return worker.handleDisconnect(event, context, cb);
      } else {
          cb(null, {
              statusCode: 200,
              body: 'Disconnected.'
          });
      }
  });
};



/*

    For WebSocket authorization See:

    https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-mapping-template-reference.html
    https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-lambda-auth.html
    https://medium.com/@lancers/using-custom-authorizer-for-websocket-apis-on-api-gateway-95abb517acab
    https://github.com/serverless/examples/tree/master/aws-node-websockets-authorizers
    https://www.serverless.com/framework/docs/providers/aws/events/websocket/
*/


module.parent.exports.auth = module.exports.auth = async (event, context) => {
    // return policy statement that allows to invoke the connect function.
    // in a real world application, you'd verify that the header in the event
    // object actually corresponds to a user, and return an appropriate statement accordingly
    return {
      "principalId": "user",
      "policyDocument": {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "execute-api:Invoke",
            "Effect": "Allow",
            "Resource": event.methodArn
          }
        ]
      }
    };
  };
