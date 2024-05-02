/**
 * @module business-data.mod/data/main.mod/converter/person-name-to-string-converter-private
 * @requires montage/core/converter/converter
 * @requires montage/core/enum
 */
var Converter = require("mod/core/converter/converter").Converter,
    Enum = require("mod/core/enum").Enum;


/*
    Not sure we'll need this here to properly deal with a wider range of languages/scripts
    Locale = (require)("mod/core/locale").Locale;

    First implementation adapted from
    https://github.com/gnustep/libs-base/blob/master/Source/NSPersonNameComponentsFormatter.m

*/

    var personNameToSringConverterStyle = [
        "Short",       /* Display shortened form appropriate for display in space-constrained settings. */
        "Medium",       /* The minimally necessary features for differentiation in a casual setting. */
        "Long",          /* The fully qualified name complete with all known components. */
        "Abbreviated"      /* The maximally abbreviated form of a name. */
    ],
    PersonNameToSringConverterStyle = exports.PersonNameToSringConverterStyle = new Enum().initWithMembersAndValues(personNameToSringConverterStyle),

    personNameToSringConverterShortStyleVariation = [
        "GivenName_FamilyInitial",
        "FamilyName_GivenInitial",
        "GivenNameOnly",
        "FamilyNameOnly"
    ],
    PersonNameToSringConverterShortStyleVariation = exports.PersonNameToSringConverterShortStyleVariation = new Enum().initWithMembersAndValues(personNameToSringConverterShortStyleVariation);

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
 * @extends Converter
 */
exports.PersonNameToSringConverter = Converter.specialize( /** @lends PersonNameToSringConverter */ {


    /**
     * The style of conversion. See PersonNameToSringConverterStyle enum
     *
     * @default PersonNameToSringConverterStyle.Medium
     * @property {PersonNameToSringConverterStyle}
     */
    style: {
        value: PersonNameToSringConverterStyle.Medium
    },

    /**
     * The short style variation selected
     *
     * @default PersonNameToSringConverterShortStyleVariation.GivenName_FamilyInitial
     * @property {PersonNameToSringConverterStyle}
     */
    shortStyleVariation: {
        value: PersonNameToSringConverterShortStyleVariation.GivenName_FamilyInitial
    },

    /**
     * Specifies whether the converter should use only the phonetic representations of name components.
     *
     * @default false
     * @property {boolean}
     */
    usePhonetic: {
        value: PersonNameToSringConverterStyle.Medium
    },

    /**
     * The locale of conversion. See PersonNameToSringConverterStyle enum
     *
     * @default PersonNameToSringConverterStyle.Medium
     * @property {PersonNameToSringConverterStyle}
     */
    /*
    locale: {
        value: Locale.systemLocale
    },
    */


    /**
     * Converts the specified PersonName value to a string according to receiver's style.
     * @function
     * @param {PersonName} v The PersonName value to format.
     * @returns {string} The value converted to a string format.
     */
    convert: {
        value: function (personName) {
            var result;
            switch (this.style) {

                case PersonNameToSringConverterStyle.Medium:
                    result = `${personName.givenName} ${personName.familyName}`;
                break;

                case PersonNameToSringConverterStyle.Short:
                    switch (this.shortStyleVariation) {
                        case PersonNameToSringConverterShortStyleVariation.GivenName_FamilyInitial:
                            result = `${personName.givenName} ${personName.familyName.charAt(0).toUpperCase()}`;
                            break;

                        case PersonNameToSringConverterShortStyleVariation.FamilyName_GivenInitial:
                            result = `${personName.familyName} ${personName.givenName.charAt(0).toUpperCase()}`;
                            break;

                        case PersonNameToSringConverterShortStyleVariation.GivenNameOnly:
                            result = personName.givenName;
                            break;

                        case PersonNameToSringConverterShortStyleVariation.FamilyNameOnly:
                            result = personName.familyName;
                            break;
                    }
                    break;

                case PersonNameToSringConverterStyle.Long:

                    if(personName.namePrefix && !personName.nameSuffix) {
                        result = `${personName.namePrefix} ${personName.givenName} ${personName.familyName}`;
                    } else if(!personName.namePrefix && personName.nameSuffix) {
                        result = `${personName.givenName} ${personName.familyName} ${personName.nameSuffix}`;
                    } else if(!personName.namePrefix && !personName.nameSuffix) {
                        result = `${personName.givenName} ${personName.familyName}`;
                    } else {
                        result = `${personName.namePrefix} ${personName.givenName} ${personName.familyName} ${personName.nameSuffix}`;
                    }
                    break;

                case PersonNameToSringConverterStyle.Abbreviated:
                    result = `${personName.givenName.charAt(0)}${personName.familyName.charAt(0)}`;
                    break;

                default:
                    result = "";
            }

            return result;
        }
    }
}, {
    Style: {
        value: PersonNameToSringConverterStyle
    }
});

