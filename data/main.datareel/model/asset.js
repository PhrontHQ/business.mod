var Object = require("./object").Object;

/**
 * @class Asset
 * Models https://help.shopify.com/en/api/graphql-admin-api/reference/object/image
 * @extends Object
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


exports.Asset = Object.specialize(/** @lends Asset.prototype */ {
    constructor: {
        value: function Asset() {
            this.super();
            return this;
        }
    },

    altText: {
        value: undefined
    },
    originalSrc: {
        value: undefined
    },
    transformedSrc: {
        value: undefined
    }

});