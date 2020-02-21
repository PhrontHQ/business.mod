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
    return function (syntax, scope, parent, dataService, dataMapping) {
        var chain = type + '{' + dataService.stringify(syntax.args[1], scope, dataMapping) + '}';
        if (syntax.args[0].type === "value") {
            return chain;
        } else {
            return dataService.stringify(syntax.args[0], scope, dataMapping) + '.' + chain;
        }
    };
}

module.exports = {

    makeBlockStringifier: makeBlockStringifier,

    stringifyChild: function stringifyChild(child, scope, dataMapping) {
        var arg = this.stringify(child, scope, dataMapping);
        if (!arg) return "this";
        return arg;
    },

    stringify: function (syntax, scope, dataMapping, parent) {
        var stringifiers = this.stringifiers,
            stringifier,
            string,
            i, countI, args;

        if ((stringifier = stringifiers[syntax.type])) {
            // operators
            string = stringifier(syntax, scope, parent, this, dataMapping);
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
                chain = syntax.type + "{" + this.stringify(syntax.args[0].args[1], scope, dataMapping) + "}";
                syntax = syntax.args[0];
            } else {
                // normal function calls
                if((stringifier = this.functionStringifiers[syntax.type])) {
                    chain = stringifier(syntax, scope, parent, this, dataMapping);

                } else {
                    chain = syntax.type;
                    chain += "(";

                    args = syntax.args;
                    for(i=1, countI = args.length;i<countI;i++) {
                        chain += i > 1 ? ", " : "";
                        chain += this.stringifyChild(args[i],scope, dataMapping);
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
                string = this.stringify(syntax.args[0], scope, dataMapping) + "." + chain;
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
        has: function(syntax, scope, parent, dataService, dataMapping) {
            var chain,
                value, propertyName, rawProperty, escapedRawProperty, escapedValue, condition,
                i, countI, args;

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

        value: function (syntax, scope, parent, dataService, dataMapping) {
            return '';
        },

        literal: function (syntax, scope, parent, dataService, dataMapping) {
            if (typeof syntax.value === 'string') {
                return "'" + syntax.value.replace("'", "\\'") + "'";
            } else {
                return "" + syntax.value;
            }
        },

        parameters: function (syntax, scope, parent, dataService, dataMapping) {
            return typeof scope === "string" ? dataService.mapPropertyDescriptorValueToRawValue(undefined,scope) : '$';
        },

        record: function (syntax, scope, parent, dataService, dataMapping) {
            return "{" + Object.map(syntax.args, function (value, key) {
                var string;
                if (value.type === "value") {
                    string = "this";
                } else {
                    string = dataService.stringify(value, scope, dataMapping);
                }
                return key + ": " + string;
            }).join(", ") + "}";
        },

        tuple: function (syntax, scope, parent, dataService, dataMapping) {
            return "[" + Object.map(syntax.args, function (value) {
                if (value.type === "value") {
                    return "this";
                } else {
                    return dataService.stringify(value, scope, dataMapping);
                }
            }).join(", ") + "]";
        },

        component: function (syntax, scope, parent, dataService, dataMapping) {
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

        property: function (syntax, scope, parent, dataService, dataMapping) {
            if (syntax.args[0].type === "value") {
                if (typeof syntax.args[1].value === "string") {
                    return escapeIdentifier(dataMapping.mapObjectPropertyNameToRawPropertyName(syntax.args[1].value));
                }
                /*
                    ?
                    String literals take the form of any characters between single quotes. Any character can be escaped with a back slash.
                    Number literals are digits with an optional mantissa.
                */
                else if (syntax.args[1].type === "literal") {
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
                return dataService.stringify(syntax.args[0], scope, dataMapping, {
                    type: "scope"
                }) + '.' + syntax.args[1].value;
            } else {
                return dataService.stringify(syntax.args[0], {
                    type: "scope"
                }, dataMapping, scope) + '[' + dataService.stringify(syntax.args[1], scope, dataMapping) + ']';
            }
        },

        "with": function (syntax, scope, parent, dataService, dataMapping) {
            var right = dataService.stringify(syntax.args[1], scope, dataMapping, syntax);
            return dataService.stringify(syntax.args[0], scope, dataMapping) + "." + right;
        },

        not: function (syntax, scope, parent, dataService, dataMapping) {
            if (syntax.args[0].type === "equals") {
                return (
                    dataService.stringify(syntax.args[0].args[0], scope, dataMapping, {type: "equals"}) +
                    " != " +
                    dataService.stringify(syntax.args[0].args[1], scope, dataMapping, {type: "equals"})
                );
            } else {
                return '!' + dataService.stringify(syntax.args[0], scope, dataMapping, syntax)
            }
        },

        neg: function (syntax, scope, parent, dataService, dataMapping) {
            return '-' + dataService.stringify(syntax.args[0], scope, dataMapping, syntax)
        },

        toNumber: function (syntax, scope, parent, dataService, dataMapping) {
            return '+' + dataService.stringify(syntax.args[0], scope, dataMapping, syntax)
        },

        parent: function (syntax, scope, parent, dataService, dataMapping) {
            return '^' + dataService.stringify(syntax.args[0], scope, dataMapping, syntax)
        },

        if: function (syntax, scope, parent, dataService, dataMapping) {
            return (
                dataService.stringify(syntax.args[0], scope, dataMapping, syntax) + " ? " +
                dataService.stringify(syntax.args[1], scope, dataMapping) + " : " +
                dataService.stringify(syntax.args[2], scope, dataMapping)
            );
        },

        event: function (syntax, scope, parent, dataService, dataMapping) {
            return syntax.when + " " + syntax.event + " -> " + dataService.stringify(syntax.listener, scope, dataMapping);
        },

        binding: function (arrow, syntax, scope, parent, dataService, dataMapping) {

            var header = dataService.stringify(syntax.args[0], scope, dataMapping) + " " + arrow + " " + dataService.stringify(syntax.args[1], scope, dataMapping);
            var trailer = "";

            var descriptor = syntax.descriptor;
            if (descriptor) {
                for (var name in descriptor) {
                    trailer += ", " + name + ": " + dataService.stringify(descriptor[name], scope, dataMapping);
                }
            }

            return header + trailer;
        },

        bind: function (syntax, scope, parent, dataService, dataMapping) {
            return this.binding("<-", syntax, scope, dataService);
        },

        bind2: function (syntax, scope, parent, dataService, dataMapping) {
            return this.binding("<->", syntax, scope, dataService);
        },

        assign: function (syntax, scope, parent, dataService, dataMapping) {
            return dataService.stringify(syntax.args[0], scope, dataMapping) + ": " + dataService.stringify(syntax.args[1], scope, dataMapping);
        },

        block: function (syntax, scope, parent, dataService, dataMapping) {
            var header = "@" + syntax.label;
            if (syntax.connection) {
                if (syntax.connection === "prototype") {
                    header += " < ";
                } else if (syntax.connection === "object") {
                    header += " : ";
                }
                header += dataService.stringify({type: 'literal', value: syntax.module}, scope, dataMapping);
                if (syntax.exports && syntax.exports.type !== "value") {
                    header += " " + dataService.stringify(syntax.exports, scope, dataMapping);
                }
            }
            return header + " {\n" + syntax.statements.map(function (statement) {
                return "    " + dataService.stringify(statement, scope, dataMapping) + ";\n";
            }).join("") + "}\n";
        },

        sheet: function (syntax, scope, parent, dataService, dataMapping) {
            return "\n" + syntax.blocks.map(function (block) {
                return dataService.stringify(block, scope, dataMapping);
            }).join("\n") + "\n";
        }
        /*
        ,

        has: function (syntax, scope, parent, dataService, dataMapping) {

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

                stringifiedArg = dataService.stringify(args[i],scope, dataMapping, syntax);

                result += stringifiedArg
            }

            return result.trim();
        }
*/
/*        ,

        equal: function (syntax, scope, parent, dataService, dataMapping) {
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
                result += dataService.stringify(args[i],scope, dataMapping, syntax);
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
        module.exports.stringifiers[type] = function (syntax, scope, parent, dataService, dataMapping) {

            var args = syntax.args,
                i, countI, result = "",
                mappedToken = dataService.mapTokenToRawToken(token);
            for(i = 0, countI = args.length;i<countI;i++) {
                if(i > 0) {
                    result += " ";
                    result += mappedToken;
                    result += " ";
                }
                result += dataService.stringify(args[i],scope, dataMapping, syntax);
            }

            return result.trim();
        }
    }
});

