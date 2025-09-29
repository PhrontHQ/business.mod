var DataObject = require("mod/data/model/data-object").DataObject;

/**
 * @class MessageReaction
 * @extends DataObject
 *
 */


exports.MessageReaction = DataObject.specialize(/** @lends MessageReaction.prototype */ {
    author: {
        value: undefined
    },
    emojiReaction: {
        value: undefined
    },
    urlReaction: {
        value: undefined
    }
});
