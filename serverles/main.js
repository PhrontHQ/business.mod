'use strict';

global.Promise = require("bluebird");
const Timer = require("../core/timer").Timer;

exports.initMainModuleWithRequire = function( mainModule, mainRequire) {

const successfullResponse = {
        statusCode: 200,
        body: 'Success'
    };

const failedResponse = (statusCode, error) => ({
        statusCode,
        body: error
    });

var mainTimer;

if(process.env.TIME_START) {
    console.log(process.version);
    mainTimer = new Timer('Main');
}

if(process.env.PROFILE_START) {
    const inspector = require('inspector');
    var fs = require('fs');
    var session = new inspector.Session();
    session.connect();

    session.post('Profiler.enable', () => {
        session.post('Profiler.start', () => {
        });
    });
}


/*
    workaround for the fact that mr doesn't find crypto which is a built-in module, needs to fix that for good.
*/
global.crypto = require('crypto');
const   Montage = require('montage/montage'),
        PATH = require("path"),
        useMr = true;

var workerPromise;


if(!global.cache) {
    global.cache = new Map();
}

if(!useMr) {

    const Module = require("module");
    const fs = require("fs");
    const createModuleMetadata = require("montage/core/mr/require").createModuleMetadata;

    const MontageDeserializer = require("montage/core/serialization/deserializer/montage-deserializer").MontageDeserializer;
    Montage.MontageDeserializer = MontageDeserializer;

    const node_createRequire = (require) ('module').createRequire;

    // Flags: --expose-internals

    // const internalModule = (require)('internal/module');
    // const makeRequireFunction = (require)('internal/modules/cjs/helpers').makeRequireFunction;


    const resolveMJSONFile = function (module, path) {
        //console.log(">> resolveMJSONFile: "+module.id);
        const content = fs.readFileSync(path).toString();
        module.text = content;
        module.parsedText = JSON.parse(content);

        //var mjsonModuleRequire = module.require;
        const mjsonModuleRequire = Module.createRequire(path);
        //const mjsonModuleRequire = makeRequireFunction(module,/*redirects*/);


        // const dependencies = Montage.parseMJSONDependencies(module.parsedText, function(moduleId) {
        //     if(moduleId !== "global") {
        //         mjsonModuleRequire(moduleId);
        //     }
        // });

        //module.deserializer = MontageDeserializer;
        Montage.MJSONCompilerFactory(mjsonModuleRequire, module.exports, module, global, module.filename, module.directory);

            //console.log("<< resolveMJSONFile: "+module.id +" with montageObject:",module.exports.montageObject);
        //module.exports = content;
    };

    Module._extensions[".mjson"] = resolveMJSONFile;

    const nodeNativeJsExtension = Module._extensions['.js'];

    /*
        FIXME!!!
        WARNING, when debugging locally with links, we end up with the same module loaded twice, causing errors, with filenames like:

            /Users/benoit/Sites/marchant/plum/plumming-data-worker/node_modules/phront/node_modules/montage/core/target.js
            and
            /Users/benoit/Sites/marchant/plum/plumming-data-worker/node_modules/montage/core/target.js

        need to find a way to set it up so it doesn't happen
    */

    Module._extensions['.js'] = function(module, filename) {

        nodeNativeJsExtension(module, filename);

        /*
            Ideally we should have access to the require function passed to the file code's but it's not available, so we create a new one.

            Module.createRequire(filename) seems to create a new Module object as well, which is less than ideal. The other way would be to capture it in the files themselves.
        */
        createModuleMetadata(module, Module.createRequire(filename), module.exports);
    }

    var computedModuleId = `${PATH.relative(module.path, mainModule.path)}/main.mjson`;
    /*
        For reducing code packaged and deployed, we need a valid moduleId for the main project's main.json file.
        Since phront is a direct dependency, we're pretty sure of the location this file will have regarding the project's root.mjson:

        '../../../main.mjson'

        So we're going to hard code it and throw if it turned out wrong at runtime.
    */
    if( computedModuleId !== '../../../main.mjson') {
        throw "Project's main.mjson - "+computedModuleId+" doesn't match expectected '../../../main.mjson'";
    }

    var worker = mainModule.exports.worker = exports.worker = mainRequire("./main.mjson").montageObject;
    Montage.application = worker;

    workerPromise = Promise.resolve(worker);
    console.log(mainTimer.runtimeMsStr());
    console.log("Phront Worker reporting for duty!");

} else {

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

        So we use mainModule to setup montage as if we were in that projet

        and we put the symbols we expect on parent's exports as well
    */
   const processPath = PATH.join(module.parent.path, ".");
    workerPromise = Montage.loadPackage(processPath, {
    mainPackageLocation: PATH.join(module.parent.filename, ".")
    })
    .then(function (mr) {
        //Inject current file:
        var currentMrModule = mr.inject("phront/serverles/main", exports),
            computedModuleId = `${PATH.relative(module.path, mainModule.path)}/main.mjson`;
        /*
            For reducing code packaged and deployed, we need a valid moduleId for the main project's main.json file.
            Since phront is a direct dependency, we're pretty sure of the location this file will have regarding the project's root.mjson:

            '../../../main.mjson'

            So we're going to hard code it and throw if it turned out wrong at runtime.
        */
        if( computedModuleId !== '../../../main.mjson') {
            throw "Project's main.mjson - "+computedModuleId+" doesn't match expectected '../../../main.mjson'";
        }
        return currentMrModule.require.async("../../../main.mjson");
    })
    .then(function (module) {
        var worker = module.montageObject;
        Montage.application = worker;

        if(process.env.TIME_START) {
            console.log(mainTimer.runtimeMsStr());
        }
        if(process.env.PROFILE_START) {
            session.post('Profiler.stop', (err, { profile }) => {
                // Write profile to disk, upload, etc.
                if (!err) {
                fs.writeFileSync(processPath+'/'+Date.now()+'-profile.cpuprofile', JSON.stringify(profile));
                }
            });
        }

        console.log("Phront Worker reporting for duty!");

        return worker;
    });

    mainModule.exports.worker = exports.worker = workerPromise;
}


/*
    calback()

    If there's an error, then one argument is used, the error is passed
    If there's not, the first argument being the error is null and the second is the response that should be returned:

    callback();                 //Indicates success but no information returned to the caller
    callback(null);             //Indicates success but no information returned to the caller
    callback(null, "success");  //Indicates success with information returned to the caller
    callback(error);            //Indicates error with error information returned to the caller
*/

mainModule.exports.connect = exports.connect = (event, context, callback) => {
    const isModStage = event.requestContext.stage === "mod",
    timer = isModStage ? new Timer('default') : null;

    workerPromise.then(function(worker) {
      if(typeof worker.handleConnect === "function") {
          return worker.handleConnect(event, context, function() {
            if(timer) console.log(timer.runtimeMsStr());
            callback.apply(global,arguments);
          });
      } else {
        callback(null, {
              statusCode: 200,
              body: 'Connected.'
          });
      }
    });
};

mainModule.exports.default = exports.default = async (event, context, callback) => {
    const isModStage = event.requestContext.stage === "mod",
    timer = isModStage ? new Timer('default') : null;

  const worker = await workerPromise;
  if(typeof worker.handleMessage === "function") {
    var result =  await worker.handleMessage(event, context, callback);
    if(timer) console.log(timer.runtimeMsStr());
    // console.log("default result is ",result);
    return result;

  } else {


//   const worker = await workerPromise;
//   if(typeof worker.handleMessage === "function") {
//       await worker.handleMessage(event, context, callback);
//   }

    return successfullResponse;
    // callback(null, {
    //         statusCode: 200,
    //         body: 'Sent.'
    //     });
    }

};

mainModule.exports.handlePerformTransaction = exports.handlePerformTransaction  = async function (event, context, callback) {
    const isModStage = event.requestContext.stage === "mod",
    timer = isModStage ? new Timer('handlePerformTransaction') : null;

  console.log("handlePerformTransaction event:",event,"context:",context);

  const worker = await workerPromise;
  if(typeof worker.handleMessage === "function") {
      await worker.handleMessage(event, context, callback);
  }

  if(timer) console.log(timer.runtimeMsStr());
  callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true // Required for cookies, authorization headers with HTTPS
      },
      body: 'Sent.'
  });

};


mainModule.exports.authorizeSend = module.exports.authorizeSend = async (event, context, callback) => {
    console.log("authorizeSend:","event:", event, "context:", context, "callback:", callback , "_authorize:", _authorize);
    return _authorize.call(this, event, context, callback);
};

mainModule.exports.send = exports.send  = async function (event, context, callback) {
    console.log("send event:",event,"context:",context);

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

mainModule.exports.disconnect = exports.disconnect = (event, context, callback) => {
  workerPromise.then(function(worker) {
    const isModStage = event.requestContext.stage === "mod",
            timer = isModStage ? new Timer('disconnect') : null;

      if(typeof worker.handleDisconnect === "function") {
          return worker.handleDisconnect(event, context, function() {
            if(timer) console.log(timer.runtimeMsStr());
            callback.apply(global,arguments);
          });
      } else {
            callback(null, {
                statusCode: 200,
                body: 'Disconnected.'
            });
        }
  });
};


mainModule.exports.authenticate = module.exports.authenticate = async (event, context, callback) => {
    console.log("authenticate:"," event:", event, " context:", context);

    callback(null, {
        statusCode: 200,
        body: 'Received.'
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

/*
    http example:

    https://github.com/awslabs/aws-apigateway-lambda-authorizer-blueprints/blob/master/blueprints/nodejs/index.js
*/

const _authorize = async (event, context, callback) => {
    const isModStage = event.requestContext.stage === "mod",
            timer = isModStage ? new Timer('authorize') : null;

    //console.log("_authorize:","event:", event, "context:", context, "callback:", callback);

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
            if(timer) console.log(timer.runtimeMsStr());

            return "Unauthorized";
            // callback("Unauthorized");
            // return;
        }
    }

    if(timer) console.log(timer.runtimeMsStr());
    //console.log("main authorize authResponse Allow:",authResponse);
    //callback(null, authResponse);
    return authResponse;
  };

  mainModule.exports.authorize = module.exports.authorize = async (event, context, callback) => {
    //console.log("authorize:","event:", event, "context:", context, "callback:", callback, "_authorize:", _authorize );
    return _authorize.call(this, event, context, callback);
  }

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
}
