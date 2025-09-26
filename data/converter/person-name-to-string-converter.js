/**
 * @module business.mod/data/converter/person-name-to-string-converter
 * @requires business.mod/data/model/person-name
 */
var _PersonNameToSringConverter = require("./person-name-to-string-converter-private").PersonNameToSringConverter,
    PersonName = require("../model/person-name").PersonName;


exports.PersonNameToSringConverterStyle = _PersonNameToSringConverter.PersonNameToSringConverterStyle;
exports.PersonNameToSringConverterShortStyleVariation = _PersonNameToSringConverter.PersonNameToSringConverterShortStyleVariation;

/**
 * @class PersonNameToSringConverter
 * @classdesc  A converter that provides localized representations a PersonName's properties.
 *
 * See https://developer.apple.com/documentation/foundation/personnamecomponentsformatter
 *
 * When determining how to represent a name in a particular style, a formatter takes a number of factors
 * into consideration, in order of priority:
 * 1. Script derived behaviors Scripts may specify a strict sort or display order of given and family names,
 * and the availability of styles.
 *
 * 2. User specified preferences Users can enable and configure the display of short names, as well as whether
 * or not to display nicknames when available. Users can also override the default sort and display order of
 * given and family names for their current locale.
 *
 * 3. Locale derived defaults Locales specify a default sort and display order for given and family names.
 *
 * 4. Developer specified configuration The style property value set for the NSPersonNameComponentsFormatter object.
 *
 * When the behavior specified in one factor conflicts with any other factors, the behavior specified by the factor
 * with the most precedence is used. For example, the U.S. English (en-US) locale specifies that names be displayed
 * in “given name followed by the family name” (for example,“John Appleseed”). This behavior would be overridden if
 * the user changed their system preferences to have names displayed as family name followed by given name (for example,
 * “Appleseed, John”), because user-specified preferences take precedence over locale-derived defaults.
 * Furthermore, if the name to be formatted were Japanese (for example, given name: “泰夫”, family name: “木田”),
 * the behavior derived for the name’s script (CJK, for Chinese, Japanese, and Korean languages) would take precedence
 * over any locale-derived defaults or user-specified preferences to have the name displayed as family name followed by
 * given name (for example, “木田 泰夫”).
 *
 * These considerations extend to the availability of certain formatter styles as well. Because developer-specified
 * configurations have the lowest precedence in determining behavior, the value set for the formatter’s style property
 * can be invalidated if it’s not supported for the locale, user preferences, or script. If the specified style is not
 * available, the next longest valid style is used. For example, a name in Arabic script (for example, “أحمد الراجحي”)
 * does not support the Abbreviated style, so the Short style is used instead.
 *
 *
 *     First implementation adapted from:
 *
 *     https://github.com/gnustep/libs-base/blob/master/Source/NSPersonNameComponentsFormatter.m
 *
 * @extends Converter
 */

exports.PersonNameToSringConverter = _PersonNameToSringConverter;

Montage.defineProperties(_PersonNameToSringConverter.prototype, {

    /**
     * Reverts a string to a PersonName
     * @function
     * @param {object} string The value to revert.
     * @returns {PersonName} personName
     */
    revert: {
        value: function (string) {
            var personName = new PersonName(),
                nameArray = string.split(" "),
                length = nameArray.length;

            switch(length) {
                case 1:
                    personName.nickname = nameArray[0];

                case 2:
                    personName.givenName = nameArray[0];
                    personName.familyName = nameArray[1];
                    break;

                case 3: {
                    var first = nameArray[0].toLowerCase();
                    if(first === "mr" ||
                        first === "ms" ||
                        first === "mrs" ||
                        first === "dr") {
                            personName.namePrefix = nameArray[0];
                            personName.givenName = nameArray[1];
                            personName.familyName = nameArray[2];
                        }
                        else {
                            personName.givenName = nameArray[0];
                            personName.middleName = nameArray[1];
                            personName.familyName = nameArray[2];
                            }
                    }
                    break;

                case 4: {
                        var first = nameArray[0].toLowerCase();
                        if([first === "mr."] ||
                        [first === "ms."] ||
                        [first === "mrs."] ||
                        [first === "dr."])
                        {
                        personName.namePrefix = nameArray[0];
                        personName.givenName = nameArray[1];
                        personName.middleName = nameArray[2];
                        personName.familyName = nameArray[3];
                        }
                    else
                        {
                        personName.givenName =   nameArray[0];
                        personName.middleName = nameArray[1];
                        personName.familyName = nameArray[2];
                        personName.nameSuffix = nameArray[3];
                        }
                    }
                    break;

                case 5: {
                        var first = nameArray[0].toLowerCase();
                        if([first === "mr."] ||
                        [first === "ms."] ||
                        [first === "mrs."] ||
                        [first === "dr."])
                        {
                        personName.namePrefix = nameArray[0];
                        personName.givenName =   nameArray[1];
                        personName.middleName = nameArray[2];
                        personName.familyName = nameArray[3];
                        personName.nameSuffix = nameArray[4];
                        }
                    }
                    break;

                default:
                    console.log("Not sure how to parse '"+ string+"'");
                    personName = null;
                    break;
            }
            return personName;
        }
    }

});

