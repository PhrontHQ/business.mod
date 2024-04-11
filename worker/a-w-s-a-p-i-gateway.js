'use strict';

const ApiGatewayManagementApi = require("@aws-sdk/client-apigatewaymanagementapi").ApiGatewayManagementApi;



// the following section injects the new ApiGatewayManagementApi service
// into the Lambda AWS SDK, otherwise you'll have to deploy the entire new version of the SDK

/* START ApiGatewayManagementApi injection */
/*
const { Service, apiLoader } = AWS

apiLoader.services['apigatewaymanagementapi'] = {}

const model = {
  metadata: {
    apiVersion: '2018-11-29',
    endpointPrefix: 'execute-api',
    signingName: 'execute-api',
    serviceFullName: 'AmazonApiGatewayManagementApi',
    serviceId: 'ApiGatewayManagementApi',
    protocol: 'rest-json',
    jsonVersion: '1.1',
    uid: 'apigatewaymanagementapi-2018-11-29',
    signatureVersion: 'v4'
  },
  operations: {
    PostToConnection: {
      http: {
        requestUri: '/@connections/{connectionId}',
        responseCode: 200
      },
      input: {
        type: 'structure',
        members: {
          Data: {
            type: 'blob'
          },
          ConnectionId: {
            location: 'uri',
            locationName: 'connectionId'
          }
        },
        required: ['ConnectionId', 'Data'],
        payload: 'Data'
      }
    },
    getConnection: {
        http: {
            requestUri: "/@connections/{connectionId}",
            responseCode: 200,
            method: "GET"
        },
        input: {
            type: "structure",
            members: {
                ConnectionId: {
                    location: "uri",
                    locationName: "connectionId"
                }
            },
            required: [
                "ConnectionId"
            ]
        }
    },
    DeleteConnection: {
        http: {
            requestUri: "/@connections/{connectionId}",
            responseCode: 200,
            method: "DELETE"
        },
        input: {
            type: "structure",
            members: {
                ConnectionId: {
                    location: "uri",
                    locationName: "connectionId"
                }
            },
            required: [
                "ConnectionId"
            ]
        }
    }
  },
  paginators: {},
  shapes: {}
}

AWS.ApiGatewayManagementApi = Service.defineService('apigatewaymanagementapi', ['2018-11-29']);
Object.defineProperty(apiLoader.services['apigatewaymanagementapi'], '2018-11-29', {
  // eslint-disable-next-line
  get: function get() {
    return model
  },
  enumerable: true,
  configurable: true
});
*/
/* END ApiGatewayManagementApi injection */


// exports.AWSAPIGateway = new AWS.ApiGatewayManagementApi({
//   apiVersion: '2018-11-29',
//   endpoint: (process.env.IS_OFFLINE === "true") ? 'http://localhost:3001' : process.env.APIG_ENDPOINT,
//   convertResponseTypes: false
// });


exports.AWSAPIGateway = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: (process.env.IS_OFFLINE === "true") ? 'http://localhost:3001' : ("https://"+process.env.APIG_ENDPOINT),
    //endpoint: (process.env.IS_OFFLINE === "true") ? 'http://localhost:3001' : (process.env.APIG_ENDPOINT),
    convertResponseTypes: false
  });

//   console.log("endpoint: ", ("wss://"+process.env.APIG_ENDPOINT+"/"));

//   console.log("GITHUB endpoint:"+ `${process.env.WEBSOCKET_API}.execute-api.${process.env.AWS_REGION}.amazonaws.com/${process.env.STAGE}`);

//   console.log("exports.AWSAPIGateway: ",exports.AWSAPIGateway);
