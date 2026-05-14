const DataObject = require("mod/data/model/data-object").DataObject;
const Montage = require("mod/core/core").Montage;

/**
 * @class EmploymentOffer
 * @extends DataObject
 */
exports.EmploymentOffer = class EmploymentOffer extends DataObject {
    static {
        Montage.defineProperties(this.prototype, {
            /**
             * @property {EmploymentPosition} employmentPosition
             */
            employmentPosition: { value: undefined },

            /**
             * @property {Person} recipient
             */
            recipient: { value: undefined },

            /**
             * @property {Person} sender
             */
            sender: { value: undefined },

            /**
             * The date when the employee will start work at the position
             * @property {Date} startDate
             */
            startDate: { value: undefined },

            /**
             * The date the offer was received by the employee
             * @property {Date} receiptDate
             */
            receiptDate: { value: undefined },

            /**
             * Placeholder to indicate that EmploymentOffer should capture 
             * financial information. We do not have a model
             * salary/benefits so this is noop for now
             * 
             */
            salary: {value: undefined}
        });
    }
};
