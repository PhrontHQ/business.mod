var DataObject = require("./data-object").DataObject;

/**
 * @class ServiceQuestionnaire
 * @extends DataObject
 */

/*

requiredResources: This can be anything from person to tools, to consumable materials. It is an open relatiionship. Could be modeled as a hstore key is uuid, value the tableName?

*/

exports.ServiceQuestionnaire = DataObject.specialize(/** @lends ServiceQuestionnaire.prototype */ {

    service: {
        value: undefined
    },
    questionnaire: {
        value: undefined
    },
    rolesRequiredToComplete: {
        value: undefined
    },
    rolesOptionalToComplete: {
        value: undefined
    }

});
