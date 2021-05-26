/**
 * Defines the BitField class, that compactly stores multiple values as a short
 * series of bits.
 * @module phront/data/main-data.reel/service/s-q-l-join-statements
 * @requires montage/core/core
 */

 var Montage = require("montage/core/core").Montage;

 /**
  * a SQLJoinStatements maintains information about joins being created by the conversion
  * of an frb expression to SQL. Internally we
  * @class SQLJoinStatements
  * @classdesc Compactly stores multiple values as a short series of bits.
  * @extends Montage
  */
 var SQLJoinStatements = exports.SQLJoinStatements = Montage.specialize( /** @lends SQLJoinStatements */ {
    /***************************************************************************
     * Constructor
     */

     constructor: {
        value: function SQLJoinStatements() {
            this._joinMap = new Map();

        }
    },

     /**
      * Add a join to the table
      * @method
      * @param {SQLJoin} join a join to add to the table.
      */
     add: {
         value: function (join) {

            var value = this._joinMap.get(join.rightDataSet);
            if(!value) {
                value = new Set();
                this._joinMap.set(join.rightDataSet, value);
            }
            value.add(join);
         }
     },

     size: {
         get: function() {
             return this._joinMap.size;
         }
     },

    keys: {
        value: function() {
            return this._joinMap.keys();
        }
    },
    values: {
        value: function() {
            return this._joinMap.values();
        }
    },
    entries: {
        value: function() {
            return this._joinMap.entries();
        }
    },


    stringifySQLJoinSet: {
        value: function(aSQLJoinSet) {

            if(aSQLJoinSet.size) {
                var iterator = aSQLJoinSet.values(),
                iteration, iSQLJoin,
                result;

                while(!(iteration = iterator.next()).done) {
                    iSQLJoin = iteration.value;

                    result = result ? `${result} ${iSQLJoin.toString()}` : iSQLJoin.toString();
                }
                return result;

            } else {
                return "";
            }

        }
    },

    toString: {
        value: function () {
            if (this.size) {
                var separator = " ",
                    setIterator = this._joinMap.values(), aValue, aNextValue, joinValue = "";
                while((aValue = setIterator.next().value) && (aNextValue = setIterator.next().value)) {
                    //aValue and aNextValue are Sets that contain SQLJoins
                    if(joinValue.length > 0) {
                        joinValue += separator;
                    }
                    joinValue += `${this.stringifySQLJoinSet(aValue)}${separator}${this.stringifySQLJoinSet(aNextValue)}`;
                }
                if(aValue) {
                    joinValue += (joinValue.length > 0 )
                    ? ` ${this.stringifySQLJoinSet(aValue)}`
                    : this.stringifySQLJoinSet(aValue);
                }

                return joinValue;
            } else {
                return "";
            }
        }
    }

 });

