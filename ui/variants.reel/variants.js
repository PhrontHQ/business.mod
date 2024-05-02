var Component = require("mod/ui/component").Component;
var formatter = new Intl.NumberFormat('FR');

exports.Variants = Component.specialize({

    constructor: {
        value: function Variants() {}
    },

    variants: {
        get: function () {
            return this._variants;
        },
        set: function (variants) {
            this._variants = variants;
            if (variants) {
                var columns = [],
                    rows = [],
                    row,
                    options = variants[0].selectedOptions,
                    i, j;

                for (i = 0; i < options.length; i++) {
                    columns.push(options[i].name);
                }
                columns.push("Prix");
                for (j = 0; j < variants.length; j++) {
                    row = [];
                    rows.push(row);
                    options = variants[j].selectedOptions;
                    for (i = 0; i < options.length; i++) {
                        row.push(options[i].value);
                    }
                    row.push(
                        formatter.format(variants[j].presentmentPrices[0].price.amount) +
                        " xpf"
                    );
                }
                this.columns = columns;
                this.rows = rows;
            }
        }
    }

});
