var AWS = require('aws-sdk'),
    CognitoIdentityServiceProvider =  AWS.CognitoIdentityServiceProvider,
    DataService = require("montage/data/service/data-service").DataService,
    RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    SyntaxInOrderIterator = require("montage/core/frb/syntax-iterator").SyntaxInOrderIterator,
    DataOperation = require("montage/data/service/data-operation").DataOperation,
    crypto = require("crypto"),
    BucketDescriptor = require("../../model/aws/s3/bucket.mjson").montageObject,
    ObjectDescriptor = require("../../model/aws/s3/object.mjson").montageObject,
    ExpiringObjectDownloadDescriptor = require("../../model/aws/s3/expiring-object-download.mjson").montageObject,
    CognitoDataService;



/**
* TODO: Document
*
* @class
* @extends RawDataService
*/
exports.CognitoDataService = CognitoDataService = RawDataService.specialize(/** @lends CognitoDataService.prototype */ {

    /***************************************************************************
     * Initializing
     */

    constructor: {
        value: function CognitoDataService() {
            RawDataService.call(this);

        }
    },
    _connection: {
        value: undefined
    },

    connection: {
        get: function() {
            if(!this._connection) {
                this.connection = this.connectionForIdentifier(this.currentEnvironment.stage);
            }
            return this._connection;
        },
        set: function(value) {

            if(value !== this._connection) {
                this._connection = value;
            }
        }
    },

});
