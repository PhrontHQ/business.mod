var Party = require("./party").Party;
/**
 * @class Person
 * @extends DataObject
 */


 /*
    Postgresql range. To find the current/active jobs/positions, we need to filter employmentHistory to kep those
    for which their existenceTimeRange upper bound is infinite, or if "now" overlaps with it, which would work for contracts
    for which the end is known.

    https://www.postgresql.org/docs/9.3/functions-range.html
    upper_inf(anyrange)	boolean	is the upper bound infinite?	upper_inf('(,)'::daterange)	true

    @>	contains element	'[2011-01-01,2011-03-01)'::tsrange @> '2011-01-10'::timestamp	true

 */


exports.Person = Party.specialize(/** @lends Person.prototype */ {
    constructor: {
        value: function Person() {
            this.super();
            return this;
        }
    },

    /**
     * name
     * 
     * Overrides Party's name that is just a String
     * 
     * An instance of PersonName, an object that encapsulates the components
     * of a person's name in an extendable, object-oriented manner.
     * It is used to specify a person's name by providing the components
     * comprising a full name: given name, middle name, family name, prefix,
     * suffix, nickname, and phonetic representation.
     *
     * @property {PersonName}
     */
    name: {
        value: undefined
    },

    /**
     * gender
     *
     * A Person's gender. We're going to use
     * - Male
     * - Female
     * - Other
     * - Undisclosed
     *
     * @property {PersonName}
     */
    gender: {
        value: undefined
    },

     /**
     * aliases
     *
     * An array of PersonName objects. Individuals may have one
     * or more valid names, or aliases. This may be the result of
     * adopting a new name in conjunction with a life event,
     * such as marriage. For example, the name “Marie Curie”
     * could have the corresponding alias “Maria Salomea Skłodowska.”
     * Because each alias represents a separate name, an individual with
     * one or more aliases would be modeled by a corresponding of number
     * of PersonName objects, each representing a single alias.
     *
     * @property {PersonName[]}
     */
    aliases: {
        value: undefined
    },

    preferredLocales: {
        value: undefined
    },

    firstName: {
        value: undefined
    },
    lastName: {
        value: undefined
    },
    email: {
        value: undefined
    },
    phone: {
        value: undefined
    },
    image: {
        value: undefined
    },
    addresses: {
        value: undefined
    },
    orders: {
        value: undefined
    },
    tags: {
        value: undefined
    },
    userIdentities: {
        value: undefined
    },
    employmentHistory: {
        value: undefined
    },
    respondentQuestionnaires: {
        value: undefined
    }

});
