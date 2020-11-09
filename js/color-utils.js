/*
 * © Copyright 2020
 * Dorian Naujokat
 * All rights reserved.
 */
let colorUtils = {};
(() => {
    colorUtils.parser = {};
    colorUtils.parser.parse = (color) => {
        let c = {
            red: 0,
            green: 0,
            blue: 0,
            alpha: 1
        };
        if (typeof color === 'string') {
            if (color.startsWith('#')||color.startsWith('0x')) {
                color = color.startsWith('0x')?color.slice(2):color.slice(1);
                if (color.length===3) {
                    let r = parseInt(color[0],16)/15;
                    let g = parseInt(color[1],16)/15;
                    let b = parseInt(color[2],16)/15;
                    c.red = r;
                    c.green = g;
                    c.blue = b;
                    c.alpha = 1;
                } else if (color.length===6) {
                    let r = parseInt(color[0]+color[1],16)/255;
                    let g = parseInt(color[2]+color[3],16)/255;
                    let b = parseInt(color[4]+color[5],16)/255;
                    c.red = r;
                    c.green = g;
                    c.blue = b;
                    c.alpha = 1;
                }
            } else if (color.startsWith('rgba(')) {
                color = color.slice(5);
                color = color.slice(0, color.length-1);
                color = color.replace(' ', '');
                color = color.split(',');
                let r = parseInt(color[0])/255;
                let g = parseInt(color[1])/255;
                let b = parseInt(color[2])/255;
                let a = parseInt(color[3])/255;
                c.red = r;
                c.green = g;
                c.blue = b;
                c.alpha = a;
            } else if (color.startsWith('rgb(')) {
                color = color.slice(4);
                color = color.slice(0, color.length-1);
                color = color.replace(' ', '');
                color = color.split(',');
                let r = parseInt(color[0])/255;
                let g = parseInt(color[1])/255;
                let b = parseInt(color[2])/255;
                c.red = r;
                c.green = g;
                c.blue = b;
                c.alpha = 1;
            }
        } else if (typeof color === 'object') {
            c.red = color.red??1;
            c.blue = color.blue??1;
            c.green = color.green??1;
            c.alpha = color.alpha??1;
        }
        return c;
    };
    colorUtils.parser.stringify = (color) => {
        return `rgba(${color.red*255}, ${color.green*255}, ${color.blue*255}, ${color.alpha*255})`;
    };
    colorUtils.parser.create2GradientString = (start, stop, deg=115) => {
        return `linear-gradient(${deg}deg, ${colorUtils.parser.stringify(start)}, ${colorUtils.parser.stringify(stop)})`;
    };
    colorUtils.parser.createGradientString = (stops, deg=115) => {
        return `linear-gradient(${deg}deg, ${stops.map(s => colorUtils.parser.stringify(s)).join(',')})`;
    };

    colorUtils.math = {};
    colorUtils.math.diff = (color1, color2) => {
        return {
            red: color2.red - color1.red,
            green: color2.green - color1.green,
            blue: color2.blue - color1.blue,
            alpha: color2.alpha - color1.alpha
        };
    };
    colorUtils.math.percent = (color, perc) => {
        return {
            red: color.red*perc,
            green: color.green*perc,
            blue: color.blue*perc,
            alpha: color.alpha*perc
        };
    };
    colorUtils.math.add = (color1, color2) => {
        return {
            red: color1.red + color2.red,
            green: color1.green + color2.green,
            blue: color1.blue + color2.blue,
            alpha: color1.alpha + color2.alpha
        };
    };


    class FadingGradient {
        #callback;
        #steps = [];
        #stops = 0;
        #interval;

        #current = {
            step: 0,
            fade: 0,
            run: false,
            ease: true
        }

        constructor(callback) {
            this.#callback = callback;
            this.#interval = setInterval(this.#onInterval.bind(this), 50);
            this.#onInterval();
        }

        addStep(step) {
            let parsedStep = [];
            step.forEach(color => {
                parsedStep.push(colorUtils.parser.parse(color))
            });
            if (parsedStep.length > this.#stops) {
                this.#steps.forEach(s => {
                    while (s.length < parsedStep.length) {
                        s.push(colorUtils.parser.parse(undefined));
                    }
                });
                this.#stops = parsedStep.length;
            } else if (parsedStep.length < this.#stops) {
                while (parsedStep.length < this.#stops) {
                    parsedStep.push(colorUtils.parser.parse(undefined));
                }
            }
            this.#steps.push(parsedStep);
        }

        #onInterval() {
            if (!this.#current.run) return;
            if (this.#steps.length <= 0) return;
            if (this.#current.fade >= 1) {
                this.#current.fade = 0;
                this.#current.step++;
            }
            if (this.#current.step > this.#steps.length-1) {
                this.#current.step = 0;
            }
            let fade = this.#current.ease ? .5*(Math.sin((this.#current.fade - .5)*Math.PI) + 1) : this.#current.fade;
            let cstep = this.#steps[this.#current.step];
            let nstep = this.#current.step+1>this.#steps.length-1?this.#steps[0]:this.#steps[this.#current.step+1];
            let _s = [];
            cstep.forEach((__s,__i) => {
                let __n = nstep[__i];
                _s.push(colorUtils.math.add(__s, colorUtils.math.percent(colorUtils.math.diff(__s, __n), fade)));
            });
            this.#current.fade+=0.01;
            if (this.#callback !== undefined) this.#callback(_s);
        }

        start() {
            this.#current.run = true;
        }
        stop() {
            this.#current.run = false;
        }
    }
    colorUtils.FadingGradient = FadingGradient;
})();