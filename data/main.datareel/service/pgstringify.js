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
    escapeString = pgutils.escapeString;

// module.exports.stringify = stringify;
// function stringify(syntax, scope) {
//     return stringify.semantics.stringify(syntax, scope);
// }

function makeBlockStringifier(type) {
    return function (syntax, scope, parent, dataService, dataMappings) {
        var chain = type + '{' + dataService.stringify(syntax.args[1], scope, dataMappings) + '}';
        if (syntax.args[0].type === "value") {
            return chain;
        } else {
            return dataService.stringify(syntax.args[0], scope, dataMappings) + '.' + chain;
        }
    };
}

module.exports = {

    makeBlockStringifier: makeBlockStringifier,

    stringifyChild: function stringifyChild(child, scope, dataMappings) {
        var arg = this.stringify(child, scope, dataMappings);
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

    stringify: function (syntax, scope, dataMappings, parent) {
        var stringifiers = this.stringifiers,
            stringifier,
            string,
            i, countI, args;

        if ((stringifier = stringifiers[syntax.type])) {
            // operators
            string = stringifier(syntax, scope, parent, this, dataMappings);
        } else if (syntax.inline) {
            // inline invocations
            string = "&";
            string += syntax.type;
            string += "(";

            args = syntax.args;
            for(i=0, countI = args.length;i<countI;i++) {
                string += i > 0 ? ", " : "";
                string += this.stringifyChild(args[i],scope);
            }
            string += ")";

        } else {
            // method invocations
            var chain;
            if (syntax.args.length === 1 && syntax.args[0].type === "mapBlock") {
                // map block function calls
                chain = syntax.type + "{" + this.stringify(syntax.args[0].args[1], scope, dataMappings) + "}";
                syntax = syntax.args[0];
            } else {
                // normal function calls
                if((stringifier = this.functionStringifiers[syntax.type])) {
                    chain = stringifier(syntax, scope, parent, this, dataMappings);

                } else {
                    chain = syntax.type;
                    chain += "(";

                    args = syntax.args;
                    for(i=1, countI = args.length;i<countI;i++) {
                        chain += i > 1 ? ", " : "";
                        chain += this.stringifyChild(args[i],scope, dataMappings);
                    }
                    chain += ")";
                }

            }
            // left-side if it exists
            if (syntax.args[0].type === "value" ||
                /*
                departure from frb stringify. watch that it doesn't break others use cases, possibly in a chain?
                */
                    syntax.type === "has") {
                string = chain;
            } else {
                string = this.stringify(syntax.args[0], scope, dataMappings) + "." + chain;
            }
        }

        // parenthesize if we're going backward in precedence
        if (
            !parent ||
            (parent.type === syntax.type && parent.type !== "if") ||
            // TODO check on weirdness of "if"
            precedence.get(parent.type).has(syntax.type)
        ) {
            return string;
        } else {
            return "(" + string + ")";
        }
    },

    functionStringifiers: {
        has: function(syntax, scope, parent, dataService, dataMappings) {
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
        }
    },

    stringifiers: {

        value: function (syntax, scope, parent, dataService, dataMappings) {
            return '';
        },

        literal: function (syntax, scope, parent, dataService, dataMappings) {
            if (typeof syntax.value === 'string') {
                return "'" + syntax.value.replace("'", "\\'") + "'";
            } else {
                return "" + syntax.value;
            }
        },

        parameters: function (syntax, scope, parent, dataService, dataMappings) {
            return typeof scope === "string" ? dataService.mapPropertyDescriptorValueToRawValue(undefined,scope) : '$';
        },

        record: function (syntax, scope, parent, dataService, dataMappings) {
            return "{" + Object.map(syntax.args, function (value, key) {
                var string;
                if (value.type === "value") {
                    string = "this";
                } else {
                    string = dataService.stringify(value, scope, dataMappings);
                }
                return key + ": " + string;
            }).join(", ") + "}";
        },

        tuple: function (syntax, scope, parent, dataService, dataMappings) {
            return "[" + Object.map(syntax.args, function (value) {
                if (value.type === "value") {
                    return "this";
                } else {
                    return dataService.stringify(value, scope, dataMappings);
                }
            }).join(", ") + "]";
        },

        component: function (syntax, scope, parent, dataService, dataMappings) {
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

        _propertyName: function (propertyName, scope, parent, dataService, dataMappings) {
            var dataMapping = dataMappings[dataMappings.length-1],
                objectDescriptor = dataMapping.objectDescriptor,
                rawPropertyValue = dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName),
                rule = dataMapping.rawDataMappingRules.get(rawPropertyValue),
                propertyDescriptor = objectDescriptor.propertyDescriptorForName(propertyName),
                //For backward compatibility, propertyDescriptor.valueDescriptor still returns a Promise....
                //propertyValueDescriptor = propertyDescriptor.valueDescriptor;
                //So until we fix this, tap into the private instance variable that contains what we want:
                propertyDescriptorValueDescriptor,
                //propertyDescriptorValueDescriptor = propertyDescriptor.valueDescriptor,
                result;

            //ToMany
            if(propertyDescriptor && propertyDescriptor.cardinality > 1) {

                propertyDescriptorValueDescriptor = propertyDescriptor._valueDescriptorReference;

                //This is the case where the table hosts the array of ids

                if(rule.targetPath !== "id") {
                /*
                    We're trying to transform Service's vendors into something like:

                    //test query:
                    SELECT * FROM "Service" JOIN "Organization"
                    ON "Organization".id = ANY ("Service"."vendorIds")
                    where "Organization".name = 'SISTRA';
                */

                    result = `JOIN "${propertyDescriptorValueDescriptor.name}" ON "${propertyDescriptorValueDescriptor.name}".id = ANY ("${objectDescriptor.name}"."${rawPropertyValue}")`;
                    dataMappings.push(dataService.mappingWithType(propertyDescriptorValueDescriptor));
                    return result;
                }
                //This is the case where we use the object's id to be found in the uuid[] on the other side
                else {
                    throw new Error("Implementation missing for toMany where mapping rule's target path is 'id'");
                }
            } else {
                return `"${objectDescriptor.name}".${escapeIdentifier(dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName))}`
                //return escapeIdentifier(dataMapping.mapObjectPropertyNameToRawPropertyName(propertyName));
            }

        },

        property: function _property(syntax, scope, parent, dataService, dataMappings) {
            var dataMapping = dataMappings[dataMappings.length-1],
                _propertyNameStringifier = _property._propertyName || (_property._propertyName = dataService.stringifiers._propertyName);

            if (syntax.args[0].type === "value") {
                if (typeof syntax.args[1].value === "string") {

                    return _propertyNameStringifier(syntax.args[1].value, scope, parent, dataService, dataMappings);

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
                    //         dataMappings.push(dataService.mappingWithType(propertyDescriptorValueDescriptor));
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
                    return "this[" + dataService.stringify(syntax.args[1], scope, dataMapping) + "]";
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
                //When processing "vendors.name == $.name", we end up here for "name"
                //and then call dataService.stringify(..) that handles "vendors,
                //and it's concatenated wirh a "." again.
                //So this is likely where we should handle joins.
                var dataMappingsLength = dataMappings.length,
                    argZeroStringified =  dataService.stringify(syntax.args[0], scope, dataMappings, {
                        type: "scope"
                    }),
                    argOneStringified =  _propertyNameStringifier(syntax.args[1].value, scope, {
                        type: "scope"
                    }, dataService, dataMappings),
                    lastDataMapping = dataMappings[dataMappings.length - 1],
                    result;

                    /*
                        Here the behavior is different if we go from a property/relation in [0] that requires a join
                        to a property that is a column of the last table joined to. If 2 relations across tables follow
                        on the 2 slots, we need to just chain the join

                        otherwise, we need to add an "and". Right now we look at the produced syntax, which isn't great
                        and we might need to bring the processing of the 2 sides in one place where we'd generate both sides
                        and be in a better position looking at the model to make the right decision than looking at the striong result.
                    */
                    if(argOneStringified.indexOf("JOIN") !== 0) {
                        result = `${argZeroStringified} AND ${argOneStringified}`;
                    } else {
                        result = `${argZeroStringified} ${argOneStringified}`;
                    }

                    //return argZeroStringified + '.' + syntax.args[1].value;
                    return result;
                } else {
                    return dataService.stringify(syntax.args[0], {
                        type: "scope"
                    }, dataMapping, scope) + '[' + dataService.stringify(syntax.args[1], scope, dataMappings) + ']';
            }
        },

        "with": function (syntax, scope, parent, dataService, dataMappings) {
            var right = dataService.stringify(syntax.args[1], scope, dataMappings, syntax);
            return dataService.stringify(syntax.args[0], scope, dataMappings) + "." + right;
        },

        not: function (syntax, scope, parent, dataService, dataMappings) {
            if (syntax.args[0].type === "equals") {
                return (
                    dataService.stringify(syntax.args[0].args[0], scope, dataMappings, {type: "equals"}) +
                    " != " +
                    dataService.stringify(syntax.args[0].args[1], scope, dataMappings, {type: "equals"})
                );
            } else {
                return '!' + dataService.stringify(syntax.args[0], scope, dataMappings, syntax)
            }
        },

        neg: function (syntax, scope, parent, dataService, dataMappings) {
            return '-' + dataService.stringify(syntax.args[0], scope, dataMappings, syntax)
        },

        toNumber: function (syntax, scope, parent, dataService, dataMappings) {
            return '+' + dataService.stringify(syntax.args[0], scope, dataMappings, syntax)
        },

        parent: function (syntax, scope, parent, dataService, dataMappings) {
            return '^' + dataService.stringify(syntax.args[0], scope, dataMappings, syntax)
        },

        if: function (syntax, scope, parent, dataService, dataMappings) {
            return (
                dataService.stringify(syntax.args[0], scope, dataMappings, syntax) + " ? " +
                dataService.stringify(syntax.args[1], scope, dataMappings) + " : " +
                dataService.stringify(syntax.args[2], scope, dataMappings)
            );
        },

        event: function (syntax, scope, parent, dataService, dataMappings) {
            return syntax.when + " " + syntax.event + " -> " + dataService.stringify(syntax.listener, scope, dataMappings);
        },

        binding: function (arrow, syntax, scope, parent, dataService, dataMappings) {

            var header = dataService.stringify(syntax.args[0], scope, dataMappings) + " " + arrow + " " + dataService.stringify(syntax.args[1], scope, dataMappings);
            var trailer = "";

            var descriptor = syntax.descriptor;
            if (descriptor) {
                for (var name in descriptor) {
                    trailer += ", " + name + ": " + dataService.stringify(descriptor[name], scope, dataMappings);
                }
            }

            return header + trailer;
        },

        bind: function (syntax, scope, parent, dataService, dataMappings) {
            return this.binding("<-", syntax, scope, dataService);
        },

        bind2: function (syntax, scope, parent, dataService, dataMappings) {
            return this.binding("<->", syntax, scope, dataService);
        },

        assign: function (syntax, scope, parent, dataService, dataMappings) {
            return dataService.stringify(syntax.args[0], scope, dataMappings) + ": " + dataService.stringify(syntax.args[1], scope, dataMappings);
        },

        block: function (syntax, scope, parent, dataService, dataMappings) {
            var header = "@" + syntax.label;
            if (syntax.connection) {
                if (syntax.connection === "prototype") {
                    header += " < ";
                } else if (syntax.connection === "object") {
                    header += " : ";
                }
                header += dataService.stringify({type: 'literal', value: syntax.module}, scope, dataMappings);
                if (syntax.exports && syntax.exports.type !== "value") {
                    header += " " + dataService.stringify(syntax.exports, scope, dataMappings);
                }
            }
            return header + " {\n" + syntax.statements.map(function (statement) {
                return "    " + dataService.stringify(statement, scope, dataMappings) + ";\n";
            }).join("") + "}\n";
        },

        sheet: function (syntax, scope, parent, dataService, dataMappings) {
            return "\n" + syntax.blocks.map(function (block) {
                return dataService.stringify(block, scope, dataMappings);
            }).join("\n") + "\n";
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
/*        ,

        equal: function (syntax, scope, parent, dataService, dataMappings) {
            var args = syntax.args,
                i, countI, result = "",
                mappedToken = dataService.mapTokenToRawToken(token);

            if (args[].args[0].type === "value") {
                    if (typeof syntax.args[1].value === "string") {

            for(i = 0, countI = args.length;i<countI;i++) {
                if(i > 0) {
                    result += " ";
                    result += mappedToken;
                    result += " ";
                }
                result += dataService.stringify(args[i],scope, dataMappings, syntax);
            }

            return result.trim();
        }
*/
    },

    tokenMappers: {
        "&&": function() {
            return "and";
        },
        "||": function() {
            return "or";
        },
        "==": function() {
            return "=";
        }
    },

    mapTokenToRawToken: function(token) {
        if(this.tokenMappers[token]) {
            return this.tokenMappers[token](token);
        } else {
            return token;
        }
    }

};

// book a dataService for all the defined symbolic operators
typeToToken.forEach(function (token, type) {

    if(typeof module.exports.stringifiers[type] !== "function") {
        module.exports.stringifiers[type] = function (syntax, scope, parent, dataService, dataMappings) {

            var args = syntax.args,
                i, countI, result = "",
                mappedToken = dataService.mapTokenToRawToken(token);
            for(i = 0, countI = args.length;i<countI;i++) {
                if(i > 0) {
                    result += " ";
                    result += mappedToken;
                    result += " ";
                }
                result += dataService.stringify(args[i],scope, dataMappings, syntax);
            }

            return result.trim();
        }
    }
});

