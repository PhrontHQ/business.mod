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
    to standardize and reuse shared logic and shift it to our own objects,
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

module.parent.exports.connect = exports.connect = (event, context, callback) => {
    workerPromise.then(function(worker) {
      if(typeof worker.handleConnect === "function") {
          return worker.handleConnect(event, context, callback);
      } else {
        callback(null, {
              statusCode: 200,
              body: 'Connected.'
          });
      }
    });
};

module.parent.exports.default = exports.default = async (event, context, callback) => {
  const worker = await workerPromise;
  if(typeof worker.handleMessage === "function") {
      await worker.handleMessage(event, context, callback);
  }

  callback(null, {
      statusCode: 200,
      body: 'Sent.'
  });
};

module.parent.exports.handlePerformTransaction = exports.handlePerformTransaction  = async function (event, context, callback) {
  console.log("handlePerformTransaction event:",event,"context:",context);

  const worker = await workerPromise;
  if(typeof worker.handleMessage === "function") {
      await worker.handleMessage(event, context, callback);
  }

  callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true // Required for cookies, authorization headers with HTTPS
      },
      body: 'Sent.'
  });

};

module.parent.exports.disconnect = exports.disconnect = (event, context, callback) => {
  workerPromise.then(function(worker) {

      if(typeof worker.handleDisconnect === "function") {
          return worker.handleDisconnect(event, context, callback);
      } else {
            callback(null, {
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

/*

{
  "Version": "2012-10-17",
  "Id": "default",
  "Statement": [
    {
      "Sid": "plumming-data-worker-staging-DefaultLambdaPermissionWebsockets-58YRP6F1TUNQ",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "lambda:InvokeFunction",
      "Resource": "arn:aws:lambda:us-west-2:545740467277:function:plumming-data-worker-staging-default"
    }
  ]
}

*/


module.parent.exports.authorize = module.exports.authorize = async (event, context, callback) => {


    const worker = await workerPromise;
    var authResponse;

    if(typeof worker.handleAuthorize === "function") {
        authResponse = await worker.handleAuthorize(event, context, callback);
    }

    if(authResponse === undefined) {

        // return policy statement that allows to invoke the connect function.
        // in a real world application, you'd verify that the header in the event
        // object actually corresponds to a user, and return an appropriate statement accordingly
        authResponse = {
            "principalId": "me",
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
            /*,
            context: {
                "A": "a",
                "OneTwoThree": 123,
                "true": true
            }
            */
        };

    }

    var statements = authResponse.policyDocument.Statement,
        iStatement,
        countI = statements.length,
        i = 0;

    for(; ( i < countI); i++ ) {
        if(statements[i].Effect !== "Allow") {
            console.log("main authorize authResponse Deny:",authResponse);
            callback("Unauthorized");
            return;
        }
    }

    console.log("main authorize authResponse Allow:",authResponse);
    callback(null, authResponse);

  };



/*
//From https://docs.amazonaws.cn/en_us/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html

exports.handler = function(event, context, callback) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // A simple request-based authorizer example to demonstrate how to use request
    // parameters to allow or deny a request. In this example, a request is
    // authorized if the client-supplied headerauth1 header, QueryString1
    // query parameter, and stage variable of StageVar1 all match
    // specified values of 'headerValue1', 'queryValue1', and 'stageValue1',
    // respectively.

    // Retrieve request parameters from the Lambda function input:
    var headers = event.headers;
    var queryStringParameters = event.queryStringParameters;
    var pathParameters = event.pathParameters;
    var stageVariables = event.stageVariables;

    // Parse the input for the parameter values
    var tmp = event.methodArn.split(':');
    var apiGatewayArnTmp = tmp[5].split('/');
    var awsAccountId = tmp[4];
    var region = tmp[3];
    var restApiId = apiGatewayArnTmp[0];
    var stage = apiGatewayArnTmp[1];
    var method = apiGatewayArnTmp[2];
    var resource = '/'; // root resource
    if (apiGatewayArnTmp[3]) {
        resource += apiGatewayArnTmp[3];
    }

    // Perform authorization to return the Allow policy for correct parameters and
    // the 'Unauthorized' error, otherwise.
    var authResponse = {};
    var condition = {};
    condition.IpAddress = {};

    if (headers.headerauth1 === "headerValue1"
        && queryStringParameters.QueryString1 === "queryValue1"
        && stageVariables.StageVar1 === "stageValue1") {
        callback(null, generateAllow('me', event.methodArn));
    }  else {
        callback("Unauthorized");
    }
}

// Help function to generate an IAM policy
var generatePolicy = function(principalId, effect, resource) {
    // Required output:
    var authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = {
        "stringKey": "stringval",
        "numberKey": 123,
        "booleanKey": true
    };
    return authResponse;
}

var generateAllow = function(principalId, resource) {
    return generatePolicy(principalId, 'Allow', resource);
}

var generateDeny = function(principalId, resource) {
    return generatePolicy(principalId, 'Deny', resource);
}

  */
