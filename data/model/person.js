const Person = require("mod/data/model/person").Person,
    Montage = require("mod/core/core").Montage;

/**
 * @class Person
 * @extends Party
 */

exports.Person = Person;

Montage.defineProperties(Person.prototype, {
    employmentHistory: {
        value: undefined
    },
    respondentQuestionnaires: {
        value: undefined
    }
});