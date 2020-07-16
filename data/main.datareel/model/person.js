var Party = require("./party").Party;
/**
 * @class Person
 * @extends Object
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
    }

});
