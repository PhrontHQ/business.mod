"use strict";

var parse = require("montage/core/frb/parse"),
    precedence = require("montage/core/frb/language").precedence,
    typeToToken = require("montage/core/frb/language").operatorTypes,
    tokenToType = require("montage/core/frb/language").operatorTokens,
    pgutils = require('./pg-utils'),
    prepareValue = pgutils.prepareValue,
    escapeIdentifier = pgutils.escapeIdentifier,
    escapeLiteral = pgutils.escapeLiteral,
    literal = pgutils.literal,
    escapeString = pgutils.escapeString,
    RangeDescriptor = require("montage/core/range.mjson").montageObject,
    Range = require("montage/core/range").Range,
    EqualsToken = "==",
    DataServiceUserLocales = "DataServiceUserLocales";

// module.exports.stringify = stringify;
// function stringify(syntax, scope) {
//     return stringify.semantics.stringify(syntax, scope);
// }

/*
    TODO: Add aliasing:

        SELECT column_name AS alias_name FROM table_name AS table_alias_name;

        The AS keyword is optional so

        SELECT column_name alias_name FROM table_name table_alias_name;


    - less bytes sent
    - only solution to support table self-joins as in:

        SELECT
            e.first_name employee,
            m .first_name manager
        FROM
            employee e
        INNER JOIN employee m
            ON m.employee_id = e.manager_id
        ORDER BY manager;

    - For columns, can only be used mopped as we need to have a mapping to build the final obects' expected property, but it could save quite some data, some already done by compression

    - https://www.postgresqltutorial.com/postgresql-alias/

*/

function makeBlockStringifier(type) {
    return function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
        /*
            Entering a blocl means we're entering an array so the syntax inside the block is built for the type of objects right before the block


        */
       var  _propertyNameStringifier = makeBlockStringifier._propertyName || (makeBlockStringifier._propertyName = dataService.stringifiers._propertyName),
            dataMappingStartLength = dataMappings.length,
            parentDataMapping = dataMappings[dataMappings.length - 1],
            parentObjectDescriptor = parentDataMapping.objectDescriptor,
            propertyFilteredSyntax = syntax.args[0],
            filteredPropertyName,
            filteredPropertyDescriptor,
            filteredPropertyValueDescriptor,
            result;

        if(propertyFilteredSyntax.args[0].type === "value") {
            filteredPropertyName = propertyFilteredSyntax.args[1].value;
        } else if(propertyFilteredSyntax.args[0].type === "parameters") {
            filteredPropertyName = scope[propertyFilteredSyntax.args[1].value];
        }

        /*
            First we need to take care of filteredPropertyName, which adds the mapping of filteredPropertyName's valueDescriptor if any to the dataMappings array.
        */
        var joinToFilteredProperty =  _propertyNameStringifier(filteredPropertyName, scope, syntax, dataService, dataMappings, locales, rawExpressionJoinStatements);


        //Then we need to stingify the content of the filter, but first we need to dive in one level:
        filteredPropertyDescriptor = parentObjectDescriptor.propertyDescriptorForName(filteredPropertyName);
        filteredPropertyValueDescriptor = filteredPropertyDescriptor ? filteredPropertyDescriptor._valueDescriptorReference : null;

        if(!filteredPropertyValueDescriptor) {
            console.error("Could not find value descriptor for property named '"+filteredPropertyName+"'");
        }
        //dataMappings.push(dataService.mappingForType(filteredPropertyValueDescriptor));
        //_propertyNameStringifier added the mapping of


        var filterExpressionStringified =  dataService.stringify(syntax.args[1], scope, dataMappings, locales, rawExpressionJoinStatements, syntax);

        //Remove whatever was added before we leave our scope:
        dataMappings.splice(dataMappingStartLength);

        result = ` ${joinToFilteredProperty} ${filterExpressionStringified}`;

        return result;

        // var chain = type + '{' + filterExpressionStringified + '}';
        // if (syntax.args[0].type === "value") {
        //     return chain;
        // } else {
        //     return dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements, syntax) + '.' + chain;
        // }
    };
}

module.exports = {

    makeBlockStringifier: makeBlockStringifier,

    stringifyChild: function stringifyChild(child, scope, dataMappings, locales, rawExpressionJoinStatements) {
        var arg = this.stringify(child, scope, dataMappings, locales, rawExpressionJoinStatements);
        if (!arg) return "this";
        return arg;
    },


    /**
     * stringifies a criteria to SQL, criteria expressed for the objectDescriptor's that's in dataMapping
     * as dataMapping.objectDescriptor.
     * @deprecated
     * @function
     * @param {object} syntax name of the property descriptor to create
     * @param {object} scope
     * @param {ExpressionDataMapping[]} dataMappings a stack of dataMappings as expression traverses relationships starting with the type searched
     * @param {object} parent syntax's parent in the AST.
     * @returns {string}
     */

    stringify: function (syntax, scope, dataMappings, locales, rawExpressionJoinStatements, parent) {
        var stringifiers = this.stringifiers,
            stringifier,
            string,
            i, countI, args,
            parentPrecedence;

        if(!syntax) return "";

        if ((stringifier = stringifiers[syntax.type])) {
            // operators
            string = stringifier(syntax, scope, parent, this, dataMappings, locales, rawExpressionJoinStatements);
        } else if (syntax.inline) {
            // inline invocations
            string = "&";
            string += syntax.type;
            string += "(";

            args = syntax.args;
            for(i=0, countI = args.length;i<countI;i++) {
                string += i > 0 ? ", " : "";
                string += this.stringifyChild(args[i],scope, dataMappings, locales, rawExpressionJoinStatements);
            }
            string += ")";

        } else {
            // method invocations
            var chain;
            if (syntax.args.length === 1 && syntax.args[0].type === "mapBlock") {
                // map block function calls
                chain = syntax.type + "{" + this.stringify(syntax.args[0].args[1], scope, dataMappings, locales, rawExpressionJoinStatements) + "}";
                syntax = syntax.args[0];
            } else {
                // normal function calls
                if((stringifier = this.functionStringifiers[syntax.type])) {
                    chain = stringifier(syntax, scope, parent, this, dataMappings, locales, rawExpressionJoinStatements);

                } else {
                    chain = syntax.type;
                    chain += "(";

                    args = syntax.args;
                    for(i=1, countI = args.length;i<countI;i++) {
                        chain += i > 1 ? ", " : "";
                        chain += this.stringifyChild(args[i],scope, dataMappings, locales, rawExpressionJoinStatements);
                    }
                    chain += ")";
                }

            }
            // left-side if it exists
            if (syntax.args[0].type === "value") {
                /*
                departure from frb stringify. watch that it doesn't break others use cases, possibly in a chain?
                */
               //|| syntax.type === "has") {
                //string = chain;

                string = this.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements, /*parent*/syntax);
                string += " ";
                string += chain;

            } else {
                //string = this.stringify(syntax.args[0], scope, dataMappings) + "." + chain;
                string = this.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements, /*parent*/syntax);
                string += " ";
                string += chain;
            }
        }

        // parenthesize if we're going backward in precedence
        if (
            !parent ||
            (parent.type === syntax.type && parent.type !== "if") ||
            (
                // TODO check on weirdness of "if"
                (parentPrecedence = precedence.get(parent.type)) && parentPrecedence.has(syntax.type)
            )
        ) {
            return string;
        } else {
            return "(" + string + ")";
        }
    },

    _rawOperatorByMethodInvocationType: {
        value: {
            "has": "@>",
            "overlaps": "&&"
        }
    },

    rawOperatorForMethodInvocationType: {
        value: function(methodInvocation) {
            return this._rawOperatorByMethodInvocationType[methodInvocation];
        }

    },

    _stringifyCollectionOperator: function(syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements, operator, operatorForId) {
        var chain = "",
            value, propertyName, rawProperty, escapedRawProperty, escapedValue, condition,
            i, countI, args,
            dataMapping = dataMappings[dataMappings.length-1],
            objectDescriptor = dataMapping.objectDescriptor,
            propertyDescriptor, propertyValueDescriptor;

            //chain = "(";

        args = syntax.args;

        if(args[0].type === "parameters") {
            if(args[1].type === "property") {
                propertyName = args[1].args[1].value;
                propertyDescriptor = objectDescriptor ? objectDescriptor.propertyDescriptorForName(propertyName) : null;
                propertyValueDescriptor = propertyDescriptor ? propertyDescriptor._valueDescriptorReference : null;

                if((propertyName === "id" || (propertyDescriptor && propertyDescriptor.cardinality === 1)) && Array.isArray(scope)) {
                    propertyName = `ARRAY[${propertyName}]`;
                }
                // if((propertyName === "id" || (propertyDescriptor && propertyDescriptor.cardinality === 1))) {
                //     propertyName = `ARRAY[${propertyName}]`;
                // }
            }
            else {
                throw new Error("pgstringify.js: unhandled syntax in has functionStringifiers syntax: "+JSON.stringify(syntax)+"objectDescriptor: "+dataMapping.objectDescriptor.name);
            }
            value = scope;
            // rawProperty = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
            // escapedValue = dataService.mapPropertyValueToRawTypeExpression(rawProperty,value,"list");
            escapedValue = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);

        } else if(args[0].type === "property") {
            propertyName = args[0].args[1].value;
            propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName);
            propertyValueDescriptor = propertyDescriptor ? propertyDescriptor._valueDescriptorReference : null;

            if(!propertyDescriptor) {
                //Might be a rawDataProeprty already, we check:
                var rawDataMappingRule = dataMapping.rawDataMappingRules.get(propertyName);

                if(rawDataMappingRule) {
                    propertyDescriptor = objectDescriptor.propertyDescriptorForName(rawDataMappingRule.sourcePath);
                    propertyValueDescriptor = propertyDescriptor ? propertyDescriptor._valueDescriptorReference : null;
                }
            }

            if(args[0].type === "parameters") {
                value = scope;
                rawProperty = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                escapedValue = dataService.mapPropertyValueToRawTypeExpression(rawProperty,value,"list");
            }
            else if(args[1].type === "parameters") {
                value = scope;
                if(!Array.isArray(value)) {
                    value = [value];
                }
                rawProperty = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                escapedValue = dataService.mapPropertyValueToRawTypeExpression(rawProperty,value);
            } else if(args[1].type === "property" && args[1].args[0].type === "parameters") {
                var parametersKey = args[1].args[1].value;
                value = scope[parametersKey];

                if((propertyValueDescriptor && propertyValueDescriptor.name !== "Range") && !Array.isArray(value)) {
                    value = [value];
                }

                rawProperty = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                escapedValue = dataService.mapPropertyValueToRawTypeExpression(rawProperty,value);
            } else if(args[1].type === "property" && args[0].args[0].type === "parameters") {
                propertyName = args[1].args[1].value;
                var parametersKey = args[0].args[1].value;
                value = scope[parametersKey];
                propertyDescriptor = objectDescriptor ? objectDescriptor.propertyDescriptorForName(propertyName) : null;
                propertyValueDescriptor = propertyDescriptor ? propertyDescriptor._valueDescriptorReference : null;

                if((propertyName === "id" || (propertyDescriptor && propertyDescriptor.cardinality === 1)) && Array.isArray(value)) {
                    propertyName = `ARRAY[${propertyName}]`;
                }
                escapedValue = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
            }

        } else if(args[0].type === "value") {

            propertyName = args[1].args[1].value;
            propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName);
            propertyValueDescriptor = propertyDescriptor ? propertyDescriptor._valueDescriptorReference : null;

            value = scope;
            if(!Array.isArray(value)) {
                value = [value];
            }

            if((propertyName === "id" || (propertyDescriptor && propertyDescriptor.cardinality === 1)) && Array.isArray(scope)) {
                propertyName = `ARRAY[${propertyName}]`;
                escapedValue = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
            } else {
                rawProperty = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                escapedValue = dataService.mapPropertyValueToRawTypeExpression(rawProperty,value);
            }
        } else {
            throw new Error("phront-service.js: unhandled syntax in mapCriteriaToRawStatement(criteria: "+JSON.stringify(criteria)+"objectDescriptor: "+mapping.objectDescriptor.name);
        }
        // rawProperty = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
        //escapedRawProperty = escapeIdentifier(rawProperty);

        // if(rawProperty === "id")  {
        //     //<@ should work here as well as in:
        //     //SELECT * FROM phront."Event" where '2020-04-09 12:38:00+00'::TIMESTAMPTZ <@ "timeRange"  ;
        //     //condition = `${escapedRawProperty} ${operatorForId} ${escapedValue}`
        //     condition = `${operatorForId} ${escapedValue}`
        // } else {
            //condition = `${escapedRawProperty} ${operator} ${escapedValue}`
            condition = `${operator} ${escapedValue}`
       // }


        chain += condition;
/*
        for(i=1, countI = args.length;i<countI;i++) {
            chain += i > 1 ? ", " : "";
            chain += dataService.stringifyChild(args[i],scope, dataMapping);
        }
*/
        //commenting out parenthesis here as it's too ealy to know if we need some here. Could create regression with has()
        //chain += ")";
        return chain;
    },


    functionStringifiers: {
        has: function(syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {

            return dataService._stringifyCollectionOperator(syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements, "@>", "in");

            /*
                The (first) implementation bellow ends up inversing array parameter on the left and property on the right
                but it doesn't play well with the rest of the chaining as the part before "has(..)" is added by another
                part of the code.

                If for some (performance?) reason we needed to revert to that, we'd have to single it out more so it stand on it's own for dealing with both left and right.
            */
            var chain,
                value, propertyName, rawProperty, escapedRawProperty, escapedValue, condition,
                i, countI, args,
                dataMapping = dataMappings[dataMappings.length-1];

            chain = "(";

            args = syntax.args;

            if(args[0].type === "parameters") {
                if(args[1].type === "property") {
                    propertyName = args[1].args[1].value;
                }
                else {
                    throw new Error("pgstringify.js: unhandled syntax in has functionStringifiers syntax: "+JSON.stringify(syntax)+"objectDescriptor: "+dataMapping.objectDescriptor.name);
                }
                value = scope;
                rawProperty = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                escapedValue = dataService.mapPropertyValueToRawTypeExpression(rawProperty,value,"list");

            } else if(args[0].type === "property") {
                propertyName = args[0].args[1].value;

                if(args[0].type === "parameters") {
                    value = scope;
                    rawProperty = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                    escapedValue = dataService.mapPropertyValueToRawTypeExpression(rawProperty,value,"list");
                }
                else if(args[1].type === "parameters") {
                    value = scope;
                    if(!Array.isArray(value)) {
                        value = [value];
                    }
                    rawProperty = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                    escapedValue = dataService.mapPropertyValueToRawTypeExpression(rawProperty,value);
                } else if(args[1].type === "property" && args[1].args[0].type === "parameters") {
                    var parametersKey = args[1].args[1].value;
                    value = scope[parametersKey];
                    if(!Array.isArray(value)) {
                        value = [value];
                    }
                    rawProperty = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName);
                    escapedValue = dataService.mapPropertyValueToRawTypeExpression(rawProperty,value);
                }

            } else {
                throw new Error("phron-service.js: unhandled syntax in mapCriteriaToRawStatement(criteria: "+JSON.stringify(criteria)+"objectDescriptor: "+mapping.objectDescriptor.name);
            }
            // rawProperty = mapping.mapObjectPropertyNameToRawPropertyName(propertyName);
            escapedRawProperty = escapeIdentifier(rawProperty);

            if(rawProperty === "id")  {
                //<@ should work here as well as in:
                //SELECT * FROM phront."Event" where '2020-04-09 12:38:00+00'::TIMESTAMPTZ <@ "timeRange"  ;
                condition = `${escapedRawProperty} in ${escapedValue}`
            } else {
                condition = `${escapedRawProperty} @> ${escapedValue}`
            }


            chain += condition;
/*
            for(i=1, countI = args.length;i<countI;i++) {
                chain += i > 1 ? ", " : "";
                chain += dataService.stringifyChild(args[i],scope, dataMapping);
            }
*/
            chain += ")";
            return chain;
        },
        overlaps: function _overlaps(syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return dataService._stringifyCollectionOperator(syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements, "&&", "<@");
        },
        intersects: function _intersects(syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return dataService._stringifyCollectionOperator(syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements, "@>", "<@");
        }

    },

    stringifiers: {

        value: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            //return '';
            return dataService.mapPropertyDescriptorValueToRawValue(undefined,scope && (scope.value || scope));
        },

        literal: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            if (typeof syntax.value === 'string') {
                return "'" + syntax.value.replace("'", "\\'") + "'";
            } else {
                return "" + syntax.value;
            }
        },

        parameters: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return dataService.mapPropertyDescriptorValueToRawValue(undefined, scope && (scope.parameters || scope));
            //return typeof scope === "string" ? dataService.mapPropertyDescriptorValueToRawValue(undefined,scope) : '$';
        },

        record: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return "{" + Object.map(syntax.args, function (value, key) {
                var string;
                if (value.type === "value") {
                    string = "this";
                } else {
                    string = dataService.stringify(value, scope, dataMappings, locales, rawExpressionJoinStatements);
                }
                return key + ": " + string;
            }).join(", ") + "}";
        },

        tuple: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return "[" + Object.map(syntax.args, function (value) {
                if (value.type === "value") {
                    return "this";
                } else {
                    return dataService.stringify(value, scope, dataMappings, locales, rawExpressionJoinStatements);
                }
            }).join(", ") + "]";
        },

        component: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            var label;
            if (scope && scope.components && syntax.component) {
                if (scope.components.getObjectLabel) {
                    label = scope.components.getObjectLabel(syntax.component);
                } else if (scope.components.getLabelForObject) {
                    // I am hoping that we will change Montage to use this API
                    // for consistency with document.getElementById,
                    // components.getObjectByLabel, & al
                    label = scope.components.getLabelForObject(syntax.component);
                }
            } else {
                label = syntax.label;
            }
            return '@' + label;
        },

        element: function (syntax) {
            return '#' + syntax.id;
        },

        mapBlock: makeBlockStringifier("map"),
        filterBlock: makeBlockStringifier("filter"),
        someBlock: makeBlockStringifier("some"),
        everyBlock: makeBlockStringifier("every"),
        sortedBlock: makeBlockStringifier("sorted"),
        sortedSetBlock: makeBlockStringifier("sortedSet"),
        groupBlock: makeBlockStringifier("group"),
        groupMapBlock: makeBlockStringifier("groupMap"),
        minBlock: makeBlockStringifier("min"),
        maxBlock: makeBlockStringifier("max"),

        inlineCriteriaParameters: true,

        _propertyName: function (propertyName, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {

            var dataMapping = dataMappings[dataMappings.length-1],
                objectDescriptor = dataMapping.objectDescriptor,
                schemaName = dataService.connection.schema,
                tableName = dataService.tableForObjectDescriptor(objectDescriptor),
                rawPropertyValue = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName),
                // rule = dataMapping.rawDataMappingRules.get(rawPropertyValue),
                objectRule = dataMapping.objectMappingRules.get(propertyName),
                propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName),
                isLocalizable = propertyDescriptor && propertyDescriptor.isLocalizable,
                //For backward compatibility, propertyDescriptor.valueDescriptor still returns a Promise....
                //propertyValueDescriptor = propertyDescriptor.valueDescriptor;
                //So until we fix this, tap into the private instance variable that contains what we want:
                propertyDescriptorValueDescriptor = propertyDescriptor ? propertyDescriptor._valueDescriptorReference : null,
                language, region,
                //propertyDescriptorValueDescriptor = propertyDescriptor.valueDescriptor,
                result;

            if(locales) {
                language = locales[0].language;
                region = locales[0].region;
            } else if(isLocalizable) {
                //Use at least a default to be correct
                language = "en";
                region = "*";
            }

            //ToMany
            //if(propertyDescriptor && propertyDescriptor.cardinality > 1) {
            if(propertyDescriptor && propertyDescriptorValueDescriptor) {

                //propertyDescriptorValueDescriptor = propertyDescriptor._valueDescriptorReference;

                /*
                    This is the case where the table hosts the array of ids
                    We don't support (we haven't ran into) the case where we'd join from a foreignKey in a table to an array of values on the other side. To do so we might have to introduce
                    a formal relational mapping vs leveraging/abusing the exression data mapping as w've been doing so far.
                */
                if(objectRule.sourcePath !== "id") {

                    /*
                        If dataMappings.length === 1, we're evaluating a column on the "root" table
                        or if we're the end of a path.

                        But if we're entering a block we need to do a join.
                    */
                    if(
                        (dataMappings.length === 1 && !propertyDescriptorValueDescriptor) ||
                        (parent.type !== "scope" && !parent.type.endsWith("Block"))
                    ) {
                        result = `${escapeIdentifier(tableName)}.${escapeIdentifier(rawPropertyValue)}`;
                    } else {

                    /*
                        We're trying to transform Service's vendors into something like:

                        //test query:
                        SELECT * FROM "Service" JOIN "Organization"
                        ON "Organization".id = ANY ("Service"."vendorIds")
                        where "Organization".name = 'SISTRA';

                        The following is working for this case.
                    */
                        if(locales && isLocalizable) {
                            //    JOIN "tableName" ON "tableName"."columnName"->>'jsonbKey' = text(res.id) ;
                            //    JOIN "tableName" ON "tableName"."columnName"->>'jsonbKey'::uuid = "otherTable".id ;
                            //join_type JOIN table_name2 ON (join_condition)
                        /*
                            return `COALESCE("${tableName}".${rawPropertyValue}::jsonb #>> '{${language},${region}}', "${tableName}".${rawPropertyValue}::jsonb #>> '{${language},*}')`;
                        */

                            if(propertyDescriptor.cardinality > 1) {
                                result = `JOIN "${schemaName}"."${propertyDescriptorValueDescriptor.name}" ON "${propertyDescriptorValueDescriptor.name}".id = ANY (COALESCE("${tableName}".${rawPropertyValue}::jsonb #>> '{${language},${region}}', "${tableName}".${rawPropertyValue}::jsonb #>> '{${language},*}'))`;
                            } else {
                                result = `JOIN "${schemaName}"."${propertyDescriptorValueDescriptor.name}" ON "${tableName}".id = COALESCE("${tableName}".${rawPropertyValue}::jsonb #>> '{${language},${region}}', "${tableName}".${rawPropertyValue}::jsonb #>> '{${language},*}')`;
                            }

                        } else {
                            if(propertyDescriptor.cardinality > 1) {
                                result = `JOIN "${schemaName}"."${propertyDescriptorValueDescriptor.name}" ON "${propertyDescriptorValueDescriptor.name}".id = ANY ("${tableName}"."${rawPropertyValue}")`;
                            } else {
                                result = `JOIN "${schemaName}"."${propertyDescriptorValueDescriptor.name}" ON "${propertyDescriptorValueDescriptor.name}".id = "${tableName}"."${rawPropertyValue}"`;
                            }
                        }

                        rawExpressionJoinStatements.add(result);
                        dataMappings.push(dataService.mappingForType(propertyDescriptorValueDescriptor));

                        result = "";
                    }

                    return result;
                }
                //This is the case where we use the object's id to be found in the uuid[] on the other side
                //So we should always join.
                else {

                                        //If dataMappings.length === 1, we're evaluating a column on the "root" table
                    //or if we're the end of a path
                    if (parent.type !== "scope" && !parent.type.endsWith("Block")) {
                        result = `${escapeIdentifier(tableName)}.${escapeIdentifier(rawPropertyValue)}`;
                    } else {

                        var converterSyntax = objectRule.converter.convertSyntax,
                            syntaxProperty = converterSyntax.args[0].type === 'property'
                                ? converterSyntax.args[0]
                                : converterSyntax.args[1],
                            inversePropertyDescriptor = propertyDescriptor._inversePropertyDescriptor;

                            rawPropertyValue = syntaxProperty.args[1].type === 'literal'
                                ? syntaxProperty.args[1].value
                                : syntaxProperty.args[0].value;

                        // if(converterSyntax.type !== "equals") {
                        //     console.warn("Creaating a join where rule.reverter syntax operator isn't 'equals' but '"+converterSyntax.type+"'");
                        // }

                        if(locales && isLocalizable) {
                            if(inversePropertyDescriptor.cardinality > 1) {
                                result = `JOIN "${schemaName}"."${propertyDescriptorValueDescriptor.name}" ON "${tableName}".id = ANY (COALESCE("${tableName}".${rawPropertyValue}::jsonb #>> '{${language},${region}}', "${tableName}".${rawPropertyValue}::jsonb #>> '{${language},*}'))`;
                            } else {
                                result = `JOIN "${schemaName}"."${propertyDescriptorValueDescriptor.name}" ON "${tableName}".id = COALESCE("${tableName}".${rawPropertyValue}::jsonb #>> '{${language},${region}}', "${tableName}".${rawPropertyValue}::jsonb #>> '{${language},*}')`;
                            }
                        } else {
                            if((converterSyntax && converterSyntax.type === "has") || (inversePropertyDescriptor && inversePropertyDescriptor.cardinality > 1)) {

                            //if(converterSyntax && converterSyntax.type === "has") {
                            // if(inversePropertyDescriptor && inversePropertyDescriptor.cardinality > 1) {
                                result = `JOIN "${schemaName}"."${propertyDescriptorValueDescriptor.name}" ON "${tableName}".id = ANY ("${propertyDescriptorValueDescriptor.name}"."${rawPropertyValue}")`;
                            } else {
                                result = `JOIN "${schemaName}"."${propertyDescriptorValueDescriptor.name}" ON "${tableName}".id = "${propertyDescriptorValueDescriptor.name}"."${rawPropertyValue}"`;
                            }
                        }

                        rawExpressionJoinStatements.add(result);

                        dataMappings.push(dataService.mappingForType(propertyDescriptorValueDescriptor));
                        result = "";

                    }

                    return result;
                }

                // dataMappings.push(dataService.mappingForType(propertyDescriptorValueDescriptor));
                // return result;

            } else {
                if(locales && isLocalizable) {
                    /*
                        A criteria like name = "aName", can only really be meaningful for 1 locale, so we take the first.
                        Later on we'll add a fullTextSearch operator that will be able to use an index that contains all languages' values.
                    */

                    rawPropertyValue = escapeIdentifier(rawPropertyValue);

                    if(region && region !== "") {
                        return `COALESCE("${tableName}".${rawPropertyValue}::jsonb #>> '{${language},${region}}', "${tableName}".${rawPropertyValue}::jsonb #>> '{${language},*}')`;
                    } else {
                        return `"${tableName}".${rawPropertyValue}::jsonb #>> '{${language},*}'`;
                    }


                } else {
                    if(propertyDescriptorValueDescriptor) {
                        console.warn("shouldn't be here - DEBUG ME");
                        dataMappings.push(dataService.mappingForType(propertyDescriptorValueDescriptor));
                        return `"${tableName}".${escapeIdentifier(rawPropertyValue)}`
                    } else {
                        return `"${tableName}".${escapeIdentifier(rawPropertyValue)}`
                        //return escapeIdentifier(dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName));
                    }
                }
            }

        },

        property: function _property(syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            var dataMappingStartLength = dataMappings.length,
                dataMapping = dataMappings[dataMappingStartLength-1],
                objectDescriptor = dataMapping.objectDescriptor,
                propertyName,
                propertyDescriptor,
                _propertyNameStringifier = _property._propertyName || (_property._propertyName = dataService.stringifiers._propertyName);

            if (syntax.args[0].type === "value") {
                if (typeof syntax.args[1].value === "string") {
                    return _propertyNameStringifier(syntax.args[1].value, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements, objectDescriptor);

                    // var propertyValue = syntax.args[1].value,
                    //     objectDescriptor = dataMapping.objectDescriptor,
                    //     rawPropertyValue = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyValue),
                    //     rule = dataMapping.rawDataMappingRules.get(rawPropertyValue),
                    //     propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyValue),
                    //     //For backward compatibility, propertyDescriptor.valueDescriptor still returns a Promise....
                    //     //propertyValueDescriptor = propertyDescriptor.valueDescriptor;
                    //     //So until we fix this, tap into the private instance variable that contains what we want:
                    //     propertyDescriptorValueDescriptor = propertyDescriptor._valueDescriptorReference,
                    //     //propertyDescriptorValueDescriptor = propertyDescriptor.valueDescriptor,
                    //     result;

                    // //ToMany
                    // if(propertyDescriptor.cardinality > 1) {

                    //     //This is the case where the table hosts the array of ids

                    //     if(rule.targetPath !== "id") {
                    //     /*
                    //         We're trying to transform Service's vendors into something like:

                    //         //test query:
                    //         SELECT * FROM "Service" JOIN "Organization"
                    //         ON "Organization".id = ANY ("Service"."vendorIds")
                    //         where "Organization".name = 'SISTRA';
                    //     */

                    //         result = `JOIN "${propertyDescriptorValueDescriptor.name}" ON "${propertyDescriptorValueDescriptor.name}".id = ANY ("${objectDescriptor.name}"."${rawPropertyValue}")`;
                    //         dataMappings.push(dataService.mappingForType(propertyDescriptorValueDescriptor));
                    //         return result;
                    //     }
                    //     //This is the case where we use the object's id to be found in the uuid[] on the other side
                    //     else {

                    //     }
                    // } else {
                    //     return escapeIdentifier(dataMapping.mapObjectPropertyNameToRawPropertyName(syntax.args[1].value));
                    // }

                }
                /*
                    ?
                    String literals take the form of any characters between single quotes. Any character can be escaped with a back slash.
                    Number literals are digits with an optional mantissa.
                */
                else if (syntax.args[1].type === "literal") {
                    //It likely that "." needs to be transformed into a "and"
                    return "." + syntax.args[1].value;
                } else {
                    return "this[" + dataService.stringify(syntax.args[1], scope, dataMappings, locales, rawExpressionJoinStatements) + "]";
                }
            } else if (syntax.args[0].type === "parameters") {
                if(dataService.inlineCriteriaParameters) {
                    //We need to find the type of the property to know how to format the value
                    var parameterName = syntax.args[1].value,
                        parameterValue = scope[parameterName],
                        propertyValueSyntax = parent.args[0],
                        propertyName = propertyValueSyntax.args[1].value,
                        objectRule = dataMapping.objectMappingRules.get(propertyName),
                        propertyDescriptor,
                        type,
                        escapedValue;

                        if(objectRule) {
                          propertyDescriptor = objectRule.propertyDescriptor;
                        }
                        escapedValue = dataService.mapPropertyDescriptorValueToRawValue(propertyDescriptor, parameterValue, type);

                    return escapedValue;
                } else {
                    return ":" + syntax.args[1].value;
                }
            } else if (
                syntax.args[1].type === "literal" &&
                /^[\w\d_]+$/.test(syntax.args[1].value)
            ) {

                /*
                    Where there are chained properies, the deapest one in the proeprty sub-tree is actually the first in the expresssion-form chain.
                */

                //When processing "vendors.name == $.name", we end up here for "name"
                //and then call dataService.stringify(..) that handles "vendors,
                //and it's concatenated wirh a "." again.
                //So this is likely where we should handle joins.
                var dataMappingsLength = dataMappings.length,
                    argZeroStringified,
                    argOneStringified,
                    lastDataMapping,
                    result;

                    argZeroStringified =  dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements, {
                        type: "scope"
                    });

                    // argOneStringified =  _propertyNameStringifier(syntax.args[1].value, scope, {
                    //     type: "scope"
                    // }, dataService, dataMappings, locales, rawExpressionJoinStatements);
                    /*
                        Changes to make multiple joins work. I think passing parent vs {type: "scope"} allows us to know in _propertyNameStringifier that that part is the end before an actual operator.
                    */
                    argOneStringified =  _propertyNameStringifier(syntax.args[1].value, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements);

                    lastDataMapping = dataMappings[dataMappings.length - 1];


                    /*
                        Here the behavior is different if we go from a property/relation in [0] that requires a join
                        to a property that is a column of the last table joined to. If 2 relations across tables follow
                        on the 2 slots, we need to just chain the join

                        otherwise, we need to add an "and". Right now we look at the produced syntax, which isn't great
                        and we might need to bring the processing of the 2 sides in one place where we'd generate both sides
                        and be in a better position looking at the model to make the right decision than looking at the striong result.
                    */
                   if(argZeroStringified.length && argOneStringified.length) {
                        if(argOneStringified.indexOf("JOIN") !== 0) {
                            result = `${argZeroStringified} AND ${argOneStringified}`;
                        } else {
                            result = `${argZeroStringified} ${argOneStringified}`;
                        }
                   } else if(argZeroStringified.length) {
                        result = argZeroStringified;
                   } else if(argOneStringified.length) {
                        result = argOneStringified;
                   } else {
                        result = "";
                   }

                    //Needs to remove what nested property syntax may have added:
                    if(dataMappings && parent.type !== "scope") {
                        dataMappings.splice(dataMappingStartLength);
                    }

                    //return argZeroStringified + '.' + syntax.args[1].value;
                    return result;
                } else {
                    return dataService.stringify(syntax.args[0], {
                        type: "scope"
                    }, dataMappings, locales, rawExpressionJoinStatements, scope) + '[' + dataService.stringify(syntax.args[1], scope, dataMappings, locales, rawExpressionJoinStatements) + ']';
            }
        },

        "with": function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            var right = dataService.stringify(syntax.args[1], scope, dataMappings, locales, rawExpressionJoinStatements, syntax);
            return dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements) + "." + right;
        },

        not: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            if (syntax.args[0].type === "equals") {
                var left = dataService.stringify(syntax.args[0].args[0], scope, dataMappings, locales, rawExpressionJoinStatements, {type: "equals"}),
                    right = dataService.stringify(syntax.args[0].args[1], scope, dataMappings, locales, rawExpressionJoinStatements, {type: "equals"});

                if(right === "null") {
                    return `${left} is not NULL`;
                } else {
                    return `${left} != ${right}`;
                }

            } else {
                return '!' + dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements, syntax)
            }
        },

        neg: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return '-' + dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements, syntax)
        },

        toNumber: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return '+' + dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements, syntax)
        },

        parent: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return '^' + dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements, syntax)
        },

        if: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return (
                dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements, syntax) + " ? " +
                dataService.stringify(syntax.args[1], scope, dataMappings, locales, rawExpressionJoinStatements) + " : " +
                dataService.stringify(syntax.args[2], scope, dataMappings, locales, rawExpressionJoinStatements)
            );
        },

        event: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return syntax.when + " " + syntax.event + " -> " + dataService.stringify(syntax.listener, scope, dataMappings, locales, rawExpressionJoinStatements);
        },

        binding: function (arrow, syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {

            var header = dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements) + " " + arrow + " " + dataService.stringify(syntax.args[1], scope, dataMappings, locales, rawExpressionJoinStatements);
            var trailer = "";

            var descriptor = syntax.descriptor;
            if (descriptor) {
                for (var name in descriptor) {
                    trailer += ", " + name + ": " + dataService.stringify(descriptor[name], scope, dataMappings, locales, rawExpressionJoinStatements);
                }
            }

            return header + trailer;
        },

        bind: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return this.binding("<-", syntax, scope, dataService);
        },

        bind2: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return this.binding("<->", syntax, scope, dataService);
        },

        assign: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return dataService.stringify(syntax.args[0], scope, dataMappings, locales, rawExpressionJoinStatements) + ": " + dataService.stringify(syntax.args[1], scope, dataMappings, locales, rawExpressionJoinStatements);
        },

        block: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            var header = "@" + syntax.label;
            if (syntax.connection) {
                if (syntax.connection === "prototype") {
                    header += " < ";
                } else if (syntax.connection === "object") {
                    header += " : ";
                }
                header += dataService.stringify({type: 'literal', value: syntax.module}, scope, dataMappings, locales, rawExpressionJoinStatements);
                if (syntax.exports && syntax.exports.type !== "value") {
                    header += " " + dataService.stringify(syntax.exports, scope, dataMappings, locales, rawExpressionJoinStatements);
                }
            }
            return header + " {\n" + syntax.statements.map(function (statement) {
                return "    " + dataService.stringify(statement, scope, dataMappings, locales, rawExpressionJoinStatements) + ";\n";
            }).join("") + "}\n";
        },

        sheet: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {
            return "\n" + syntax.blocks.map(function (block) {
                return dataService.stringify(block, scope, dataMappings, locales, rawExpressionJoinStatements);
            }).join("\n") + "\n";
        },
        or: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {

            //a list of Or becomes a tree of as syntax args go by 2
            //If the value of properties/expression involved is boolean, than we should use "or" operator
            //however if it's a or of properties and they are not of type boolean, then we should use COALESCE()
            //and we should really use only one COALESCE for all.

            var args = syntax.args,
                i, countI, result = "";
            for(i = 0, countI = args.length;i<countI;i++) {
                if(i > 0) {
                    result += " ";
                    result += "or";
                    result += " ";
                }
                result += dataService.stringify(args[i],scope, dataMappings, locales, rawExpressionJoinStatements, syntax);
            }

            return result.trim();
        }
        /*
        ,

        has: function (syntax, scope, parent, dataService, dataMappings) {

            var args = syntax.args,
                i, countI, result = "",
                stringifiedArg,
                mappedToken = dataService.mapTokenToRawToken("has");
            for(i = 0, countI = args.length;i<countI;i++) {
                if(i > 0) {
                    result += " ";
                    result += mappedToken;
                    result += " ";
                }

                stringifiedArg = dataService.stringify(args[i],scope, dataMappings, syntax);

                result += stringifiedArg
            }

            return result.trim();
        }
*/
        ,

        equals: function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {

            var argsZeroValue = dataService.stringify(syntax.args[0],scope, dataMappings, locales, rawExpressionJoinStatements, syntax),
                argsOneValue = dataService.stringify(syntax.args[1],scope, dataMappings, locales, rawExpressionJoinStatements, syntax);

            return `${argsZeroValue} ${dataService.mapTokenToRawTokenForValue(EqualsToken,argsZeroValue)} ${argsOneValue}`;
        }

    },

    tokenMappers: {
        "&&": function() {
            return "AND";
        },
        "||": function() {
            return "OR";
        },
        "==": function(value) {
            if(arguments.length === 1 && (value === null || value === undefined)) {
                return "IS";
            } else {
                return "=";
            }
        }
        /*
        ,
        "!=": function(value) {
            if(arguments.length === 1 && (value === null || value === undefined)) {
                return "is not";
            } else {
                return "!=";
            }
        }
        */
    },

    mapTokenToRawTokenForValue: function(token, value) {
        var tokenMapper = this.tokenMappers[token];
        if(tokenMapper) {
            return tokenMapper(value);
        } else {
            return token;
        }
    }

};

// book a dataService for all the defined symbolic operators
typeToToken.forEach(function (token, type) {

    if(typeof module.exports.stringifiers[type] !== "function") {
        module.exports.stringifiers[type] = function (syntax, scope, parent, dataService, dataMappings, locales, rawExpressionJoinStatements) {

            /*
                TODO: Needs to finish transforming

                'name.givenName == $.givenName && name.familyName == $.familyName && name.namePrefix == $.namePrefix'

                into

                name @> '{"givenName":"Cathy"}' and name @> '{"familyName":"Smith"} and name @> '{"namePrefix":"Dr."}'

                or name->>'familyName' = 'Smith'

                select '{"a": {"b":{"c": "foo"}}}'::jsonb->'a'->'b'->'c' = '"foo"'
                //Note the double quote in '' around foo to make it a jsonb value compatible with the type returned by -> operator

                equal operator will have to adapt and know the column type to answer corretly? Not in the second option

            */

           var argsZeroValue = dataService.stringify(syntax.args[0],scope, dataMappings, locales, rawExpressionJoinStatements, syntax),
                argsOneValue = dataService.stringify(syntax.args[1],scope, dataMappings, locales, rawExpressionJoinStatements, syntax);

           if(argsZeroValue && argsOneValue) {
                return `${argsZeroValue} ${dataService.mapTokenToRawTokenForValue(token,argsZeroValue)} ${argsOneValue}`;
           } else {
               //In case one side doesn't lead to anything, we degrade to the side that did.
               return argsZeroValue || argsOneValue;
           }



            var args = syntax.args,
                i, countI, iValue, result = "";
                //mappedToken = dataService.mapTokenToRawToken(token);
            for(i = 0, countI = args.length;i<countI;i++) {
                if(i > 0) {
                    result += " ";
                }

                iValue = dataService.stringify(args[i],scope, dataMappings, locales, rawExpressionJoinStatements, syntax);

                if(i > 0) {
                    result += dataService.mapTokenToRawTokenForValue(token,result);
                    result += " ";
                }

                result += iValue
            }

            return result.trim();
        }
    }
});

