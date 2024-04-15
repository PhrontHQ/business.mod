/**
    @module phront/data/main.mod/model/aws/s3/object
*/

var DataObject = require("../../data-object").DataObject;

/**
 * @class Object
 * @extends DataObject
 *
 */



 /*

 RawData from AWS.S3.getObject() response:

 the de-serialized data returned from the request. Set to null if a request error occurs. The data object has the following properties:
Body — (Buffer(Node.js), Typed Array(Browser), ReadableStream)
Object data.

DeleteMarker — (Boolean)
Specifies whether the object retrieved was (true) or was not (false) a Delete Marker. If false, this response header does not appear in the response.

AcceptRanges — (String)
Indicates that a range of bytes was specified.

Expiration — (String)
If the object expiration is configured (see PUT Bucket lifecycle), the response includes this header. It includes the expiry-date and rule-id key-value pairs providing object expiration information. The value of the rule-id is URL encoded.

Restore — (String)
Provides information about object restoration operation and expiration time of the restored object copy.

LastModified — (Date)
Last modified date of the object

ContentLength — (Integer)
Size of the body in bytes.

ETag — (String)
An ETag is an opaque identifier assigned by a web server to a specific version of a resource found at a URL.

MissingMeta — (Integer)
This is set to the number of metadata entries not returned in x-amz-meta headers. This can happen if you create metadata using an API like SOAP that supports more flexible metadata than the REST API. For example, using SOAP, you can create metadata whose values are not legal HTTP headers.

VersionId — (String)
Version of the object.

CacheControl — (String)
Specifies caching behavior along the request/reply chain.

ContentDisposition — (String)
Specifies presentational information for the object.

ContentEncoding — (String)
Specifies what content encodings have been applied to the object and thus what decoding mechanisms must be applied to obtain the media-type referenced by the Content-Type header field.

ContentLanguage — (String)
The language the content is in.

ContentRange — (String)
The portion of the object returned in the response.

ContentType — (String)
A standard MIME type describing the format of the object data.

Expires — (Date)
The date and time at which the object is no longer cacheable.

WebsiteRedirectLocation — (String)
If the bucket is configured as a website, redirects requests for this object to another object in the same bucket or to an external URL. Amazon S3 stores the value of this header in the object metadata.

ServerSideEncryption — (String)
The server-side encryption algorithm used when storing this object in Amazon S3 (for example, AES256, aws:kms).

Possible values include:
"AES256"
"aws:kms"
Metadata — (map<String>)
A map of metadata to store with the object in S3.

SSECustomerAlgorithm — (String)
If server-side encryption with a customer-provided encryption key was requested, the response will include this header confirming the encryption algorithm used.

SSECustomerKeyMD5 — (String)
If server-side encryption with a customer-provided encryption key was requested, the response will include this header to provide round-trip message integrity verification of the customer-provided encryption key.

SSEKMSKeyId — (String)
If present, specifies the ID of the AWS Key Management Service (AWS KMS) symmetric customer managed customer master key (CMK) that was used for the object.

StorageClass — (String)
Provides storage class information of the object. Amazon S3 returns this header for all objects except for S3 Standard storage class objects.

Possible values include:
"STANDARD"
"REDUCED_REDUNDANCY"
"STANDARD_IA"
"ONEZONE_IA"
"INTELLIGENT_TIERING"
"GLACIER"
"DEEP_ARCHIVE"
"OUTPOSTS"
RequestCharged — (String)
If present, indicates that the requester was successfully charged for the request.

Possible values include:
"requester"
ReplicationStatus — (String)
Amazon S3 can return this if your request involves a bucket that is either a source or destination in a replication rule.

Possible values include:
"COMPLETE"
"PENDING"
"FAILED"
"REPLICA"
PartsCount — (Integer)
The count of parts this object has.

TagCount — (Integer)
The number of tags, if any, on the object.

ObjectLockMode — (String)
The Object Lock mode currently in place for this object.

Possible values include:
"GOVERNANCE"
"COMPLIANCE"
ObjectLockRetainUntilDate — (Date)
The date and time when this object's Object Lock will expire.

ObjectLockLegalHoldStatus — (String)
Indicates whether this object has an active legal hold. This field is only returned if you have permission to view an object's legal hold status.

Possible values include:
"ON"
"OFF"

 */

exports.Object = DataObject.specialize(/** @lends Object.prototype */ {

    key: {
        value: undefined
    },
    bucketName: {
        value: undefined
    },
    bucket: {
        value: undefined
    },
    content: {
        value: undefined
    },
    contentType: {
        value: undefined
    },
    contentLength: {
        value: undefined
    },
    ETag: {
        value: undefined
    },
    metadata: {
        value: undefined
    },
    accessControlList: {
        value: undefined
    }

});
