'use strict';

var Montage = require('montage/montage');
var PATH = require("path");
var workerPromise;

//Load Montage and Phront dependencies
workerPromise = Montage.loadPackage(PATH.join(__dirname, "."), {
  mainPackageLocation: PATH.join(__filename, ".")
})
.then(function (mr) {
  return mr.async('./main.mjson');
}).then(function (worker) {
    console.log("Phront Worker reporting for duty!");
    return worker;
});

exports.connect = (event, context, cb) => {
    const worker = await workerPromise;

    if(typeof worker.handleOpen === "function") {
        await worker.handleOpen(event, context, cb);
    }

    cb(null, {
        statusCode: 200,
        body: 'Connected.'
    });
};

exports.disconnect = (event, context, cb) => {
    const worker = await workerPromise;

    if(typeof worker.handleClose === "function") {
        await worker.handleClose(event, context, cb);
    }

    cb(null, {
        statusCode: 200,
        body: 'Disconnected.'
    });
};

exports.default = async (event, context, cb) => {
    const worker = await workerPromise;
    if(typeof worker.handleMessage === "function") {
        await worker.handleMessage(event, context, cb);
    }

    cb(null, {
        statusCode: 200,
        body: 'Sent.'
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


module.exports.auth = async (event, context) => {
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
