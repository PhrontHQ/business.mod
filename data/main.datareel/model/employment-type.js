var DataObject = require("./data-object").DataObject;
/**
 * @class EmploymentType
 * @extends DataObject
 */


exports.EmploymentType = DataObject.specialize(/** @lends EmploymentType.prototype */ {

    name: {
        value: undefined
    }
    /*
        Contract would contain the template document for that an EmploymentType
    ,
    contract: {
        value: undefined
    }
    */

});
