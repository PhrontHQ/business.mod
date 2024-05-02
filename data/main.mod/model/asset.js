var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class Asset
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends DataObject
 */

 /*
    Storing the possibly public URL of an asset served by s3:

    https://stackoverflow.com/questions/44400227/how-to-get-the-url-of-a-file-on-aws-s3-using-aws-sdk

    const getUrlFromBucket=(s3Bucket,fileName)=>{
    return `https://${s3Bucket.config.params.Bucket}.s3-${s3Bucket.config.region}.amazonaws.com/${fileName}`
    };

    https://stackoverflow.com/questions/44160422/aws-s3-get-object-using-url
 */


 /*
 attachment
"attachment": "R0lGODlhAQABAPABAP///wAAACH5Ow==\n"
A base64-encoded image.

content_type
READ-ONLY
"content_type": "image/gif"
The MIME representation of the content, consisting of the type and subtype of the asset.

created_at
READ-ONLY
"created_at": "2010-07-12T15:31:50-04:00"
The date and time (ISO 8601 format) when the asset was created.

key
"key": "assets/bg-body-green.gif"
The path to the asset within a theme. It consists of the file's directory and filename. For example, the asset assets/bg-body-green.gif is in the assets directory, so its key is assets/bg-body-green.gif.

public_url
READ-ONLY
"public_url": "http://static.shopify.com/assets/bg.gif?1"
The public-facing URL of the asset.

size
READ-ONLY
"size": 1542
The asset size in bytes.

theme_id
READ-ONLY
"theme_id": 828155753
The ID for the theme that an asset belongs to.

updated_at
READ-ONLY
"updated_at": "2010-07-12T15:31:50-04:00"
The date and time (ISO 8601 format) when an asset was last updated.

value
"value": "<div id=\"page\">\n<h1>404 Page not found</h1>\n<p>We couldn't find the page you were looking for.</p>\n</div>"
The text content of the asset, such as the HTML and Liquid markup of a template file.

*/

/*

For achieving point-in-time consistency for LOBs, you have to modify your application logic to store the version ID of the modified object in Amazon S3 along with the transaction in the relational database. This change in the application is minimal compared to the TCO savings and performance improvement of the overall application.

https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html

https://docs.aws.amazon.com/AmazonS3/latest/dev/VirtualHosting.html#VirtualHostingCustomURLs
    Example CNAME Method

    To use this method, you must configure your DNS name as a CNAME alias for bucketname.s3.us-east-1.amazonaws.com. For more information, see Customizing Amazon S3 URLs with CNAMEs. This example uses the following:


*/


exports.Asset = DataObject.specialize(/** @lends Asset.prototype */ {
    constructor: {
        value: function Asset() {
            this.super();
            return this;
        }
    },
    s3Location: {
        value: undefined
    },
    originLocation: {
        value: undefined
    },
    description: {
        value: undefined
    },
    s3BucketName: {
        value: undefined
    },
    s3Bucket: {
        value: undefined
    },
    s3ObjectKey: {
        value: undefined
    },
    s3Object: {
        value: undefined
    }
});
