eventManager = {
        events: [],
        add: function (obj, eventName, callback, context) {
            context = context || window;
            var byObj = this.addEl(this.events, obj),
                byEventName = this.addEl(byObj, eventName),
                byCallback = this.addEl(byEventName, callback),
                byContext = this.addEl(byCallback, context);
                
            byContext.push(callback);
            byContext.push(context);
        },
        remove: function (obj, eventName, callback, context) {
            context = context || window;
            var events = this.events;
            if (!obj) {
                this.events = [];
                return;
            };
            if (!eventName) {
                this.removeEl(this.events, obj);
                return;
            }
            if (!callback) {
                this.removeEl(this.getEl(this.events, obj), eventName);
                return;
            }
            if (!context) {
                this.removeEl(this.getEl(this.getEl(this.events, obj), eventName), callback);
                return;
            }
            this.removeEl(this.getEl(this.getEl(this.getEl(this.events, obj), eventName), callback), context);
        },
        fire: function (obj, eventName) {
            var byObj = this.getEl(this.events, obj),
                byEventName = this.getEl(byObj, eventName);
                
            if (!byEventName) {
                return;
            }
            for (var i = 0, il = byEventName.subelements.length; i < il; i++) {
                var byCallback = byEventName.subelements[i];
                for (var j = 0, jl = byCallback.subelements.length; j < jl; j++) {
                    var byContext = byCallback.subelements[j],
                        callback = byContext[0],
                        context = byContext[1];
                    if (callback && context) {
                        callback.call(context);
                    }
                }
            }
        },
        addEl: function (array, el) {
            var pos = indexof(array, el);
            if (pos == -1) {
                pos = array.length;
                array[pos] = el;
            }
            array.subelements = array.subelements || [];
            if(!array.subelements[pos]) {
                array.subelements[pos] = [];
            }
            return array.subelements[pos];
        },
        getEl: function (array, el) {
            if (!array || !el) {
                return;
            }
            var pos = indexof(array, el);
            if (pos == -1) {
                return;
            }
            return array.subelements[pos];
        },
        removeEl: function (array, el) {
            if (!array || !el) {
                return;
            }
            var pos = indexof(array, el);
            if (pos == -1) {
                return;
            }
            array.splice(pos, 1);
            if (array.subelements) {
                array.subelements.splice(pos, 1);
            }
        }
    };

var a = { k: 4 }, b = { c: 1 },
    aCallback = function () {
        alert("a's ololo");
    }

function indexof (array, el) {
    if (Array.prototype.indexOf) {
        return Array.prototype.indexOf.call(array, el);
    }
    for (var i = 0, il = array.length; i < il; i++) {
        if (array[i] === el) {
            return i;
        }
    }
    return -1;
}

eventManager.add(a, 'ololo', aCallback, a);
eventManager.add(b, 'tralala', function () { alert("b's tralala"); eventManager.fire(a, 'ololo'); });
eventManager.remove();
eventManager.fire(b, 'tralala');
console.log(eventManager.events);

