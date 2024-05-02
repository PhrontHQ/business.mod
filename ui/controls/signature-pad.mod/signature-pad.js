var Component = require("montage/ui/component").Component,
    getStroke = require("perfect-freehand").getStroke;

exports.SignaturePad = Component.specialize({
    _inputPoints: {
        value: null
    },
    inputPoints: {
        get: function() {
            return this._inputPoints || (this._inputPoints = []);
        },
        set:  function(value) {
            if(value !== this._inputPoints) {
                this._inputPoints = value;
            }
        }
    },
    prepareForActivationEvents: {
        value: function() {
            this.svgPad.addEventListener("pointerdown", this, false);
            this.svgPad.addEventListener("pointerup", this, false);
        }
    },
    handleSvgPadPointerdown: {
        value: function(event) {
            this._targetBoundingClientRect = event.target.getBoundingClientRect();

            event.preventDefault();

            console.log("handleSvgPadPointerdown pageX/Y",event.pageX, event.pageY);
            console.log("handleSvgPadPointerdown offsetX/Y",event.offsetX, event.offsetY);
            this.inputPoints.length = 0;
            event.target.setPointerCapture(event.pointerId);
            //this.inputPoints.push([event.pageX, event.pageY, event.pressure]);
            this.inputPoints.push([event.pageX-this._targetBoundingClientRect.x, event.pageY-this._targetBoundingClientRect.y, event.pressure]);
            // this.inputPoints.push([event.clientX, event.clientY, event.pressure]);
            this.svgPad.addEventListener("pointermove", this, false);
            this.needsDraw = true;
        }
    },
    handleSvgPadPointermove: {
        value: function(event) {
            if (event.buttons !== 1) {
                console.log("handleSvgPadPointermove return");
                return;
            }

            event.preventDefault();
            // console.log("handleSvgPadPointermove pageX/Y",event.pageX, event.pageY);
            // console.log("handleSvgPadPointermove offsetX/Y",event.offsetX, event.offsetY);
            //this.inputPoints.push([event.pageX, event.pageY, event.pressure]);
            this.inputPoints.push([event.pageX-this._targetBoundingClientRect.x, event.pageY-this._targetBoundingClientRect.y, event.pressure]);

            // this.inputPoints.push([event.clientX, event.clientY, event.pressure]);

            this.needsDraw = true;
        }
    },
    handleSvgPadPointerup: {
        value: function(event) {
            console.log("handleSvgPadPointerup");
            event.preventDefault();
            event.target.releasePointerCapture(event.pointerId);
            this.svgPad.removeEventListener("pointermove", this, false);

        }
    },

    _getSvgPathFromStroke: {
    value: function _getSvgPathFromStroke(stroke) {
        if (!stroke.length) return ''

        const d = stroke.reduce(
          (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length]
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
            return acc
          },
          ['M', ...stroke[0], 'Q']
        )

        d.push('Z')
        return d.join(' ')
      }
    },

    draw: {
        value: function () {
            if(this.inputPoints && this.inputPoints.length) {
                /*
                    https://github.com/steveruizok/perfect-freehand

                    getStroke(myPoints, {
                    size: 8,
                    thinning: 0.5,
                    smoothing: 0.5,
                    streamline: 0.5,
                    easing: (t) => t,
                    simulatePressure: true,
                    last: true,
                    start: {
                        cap: true,
                        taper: 0,
                        easing: (t) => t,
                    },
                    end: {
                        cap: true,
                        taper: 0,
                        easing: (t) => t,
                    },
                    })

                */
                var stroke = getStroke(this.inputPoints, {
                    size: 5,
                    thinning: 0.5,
                    smoothing: 0.5,
                    streamline: 0.5,
                  }),
                  pathData = this._getSvgPathFromStroke(stroke);

                  //console.log("pathData:",pathData);
                  this.signaturePath.setAttribute("d", pathData);
            }
        }
    }
});
