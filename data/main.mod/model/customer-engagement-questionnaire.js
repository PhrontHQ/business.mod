var DataObject = require("./data-object").DataObject;

/**
 * @class CustomerEngagementQuestionnaire
 * @extends DataObject
 */

/*

    We'll need to add information to the model about when in a flow of a service enagement's fullfiling should a questionnaire be filled by a customer. Tied with the ServiceEngagement's event participation status like ?
        - A qualificating form would have to be filled before scheduling
        - A consent form for a medical procedure has to be filled before a patient can be invited in
        - A satisfaction survey should be filled once the participationStatus is Completed or CheckedOut

    How do we model/name the relation with participationStatus?
    How do we model/name the before/after that participationStatus?

*/

exports.CustomerEngagementQuestionnaire = DataObject.specialize(/** @lends CustomerEngagementQuestionnaire.prototype */ {

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
    },

    completionRequiredBeforeParticipationStatus: {
        value: undefined /* a participation status */
    },
    completionRequiredAfterParticipationStatus: {
        value: undefined /* a participation status */
    },
    completionOptionalBeforeParticipationStatus: {
        value: undefined /* a participation status */
    },
    completionOptionalAfterParticipationStatus: {
        value: undefined /* a participation status */
    },

    /*
        or
    */

    requiredToCompleteBeforeParticipationStatus: {
        value: undefined /* a participation status */
    },
    requiredToCompleteAfterParticipationStatus: {
        value: undefined /* a participation status */
    },
    optionalToCompleteBeforeParticipationStatus: {
        value: undefined /* a participation status */
    },
    optionalToCompleteAfterParticipationStatus: {
        value: undefined /* a participation status */
    },

    /*
        or
    */

    completionRequiredForParticipationStatus: {
        value: undefined
    },
    completionOptionalForParticipationStatus: {
        value: undefined
    }


});
