var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class MessagingChannel
 * @extends DataObject
 *
 * A way to reach someone:
 *  - a postal address,
 * - a phone number / SMS
 * - an email,
 * - an instant message (skype...)
 * - a social profile (public twitter @account or private DM)
 * - a push notification (through Apple and Google push notifications, tied to a user identity)
 * - an in-app messaging, either when user is in-App or async via service-worker.
 *
 */


exports.Message = DataObject.specialize(/** @lends MessagingChannel.prototype */ {
    deliveryTimeRange: {
        value: undefined
    },
    tags: {
        value: undefined
    },
    serviceProvider: {
        value: undefined
    },
    /*
        TODO: rename "Author"
    */
    sender: {
        value: undefined
    },
    recipients: {
        value: undefined
    },
    inputComponent: {
        value: undefined
    },
    outputComponent: {
        value: undefined
    },
    text: {
        value: undefined
    },
    context: {
        value: undefined
    },
    attachments: {
        value: undefined
    },
    reactions: {
        value: undefined
    },
    mentions: {
        value: undefined
    }
        
});
