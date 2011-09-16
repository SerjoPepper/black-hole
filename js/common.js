window.onload = (function blackhole () {
    
    window.BlackHoleProject = window.BlackHoleProject || {};
    var BHP = window.BlackHoleProject;
        // общие переменные для черной дыры :)
        GLOBAL = {};
        
        GLOBAL.transform = getSupportTransformName();
        if (GLOBAL.transformPrfx === null) {
            return;
        }
        
        GLOBAL.body = document.getElementsByTagName('body')[0];
        GLOBAL.nodes = {
                blackhole: document.createElement('div'),
                transparentLayout: document.createElement('div')
            };
        GLOBAL.windowOffset = window.pageYOffset;
        GLOBAL.screenHeight = window.screen.availHeight || window.screen.height;
        GLOBAL.screenWidth = window.screen.availWidth || window.screen.width;
        GLOBAL.maxNodesPerLevel = 50;
        // максимальная разница контейнера с родительским в пикселях, при котором внутренний тоже перемещаемая нода
        GLOBAL.allowableSizeFault = 3;
        GLOBAL.maxLevel = 10,
        GLOBAL.maxSize = {
                width: 50,
                height: 50
            };
        GLOBAL.revertingNodes = [], // одномерный массив восстонавливаемых нод
        GLOBAL.classPrefix = 'blackhole',
        GLOBAL.warningTags = {
                'thead': true,
                'tbody': true,
                'tr': true
            };
        GLOBAL.blackholePos = {
                left: (GLOBAL.screenWidth)/2,
                top: (GLOBAL.windowOffset + GLOBAL.screenHeight/2) - 30
            };
        GLOBAL.transformFields = [
                'matrix', 'matrix3d', 'translate3d', 'translateX',
                'translateY', 'translateZ', 'scale', 'scale3d', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotate3d',
                'rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY',
                'skew', 'perspective'
            ];
        GLOBAL.touchPerLevel = 15, // максимальное количество подходов разрушений на уровень
        GLOBAL.delay = { // задержки
                touch: 1000 // задержки между пусками
            };
        GLOBAL.fps = 60;
        GLOBAL.n = { // частота анимации свойств
                rotate: GLOBAL.fps/5000,
                tangentTranslate: GLOBAL.fps/3000,
                twirlTranslate: GLOBAL.fps/25000,
                tangentScale: GLOBAL.fps/3000,
                twirlScale: GLOBAL.fps/25000
            };
        GLOBAL.endScale = 0; // уровень масштабирования на последней анимации
        GLOBAL.r = 300; // радиус облета черной дыры
        GLOBAL.turns = 4; // количество оборотов вокруг дыры
        GLOBAL.eventManager = {
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
    window.onload = BHP.bind = function () {
        if (BHP.isActive) {
            return;
        }
        BHP.isActive = true;
        
        css(GLOBAL.nodes.blackhole, { left: GLOBAL.blackholePos.left + 'px', top: GLOBAL.blackholePos.top + 'px'});
        addClass(document.documentElement, 'wrapper');
        addClass(GLOBAL.nodes.transparentLayout, 'transparent-layout');
        addClass(GLOBAL.nodes.blackhole, 'init-position', 'circle');
        setTimeout(function(){ addClass(GLOBAL.nodes.blackhole, 'active-position'); }, 200);
        addClass(GLOBAL.body, 'animate');
        GLOBAL.body.appendChild(GLOBAL.nodes.blackhole);
        GLOBAL.body.appendChild(GLOBAL.nodes.transparentLayout);
        // массив нод типа [[div, div] [p,p,p,h1] [span,span,b,span]], начинаем разрушение с нижних нод
        var destroyingNodes = indexDomNodes(document.body, 0, []);
        animate(destroyingNodes, []);
    };
    
    /* Main functions */
    
    function prepareDestroyingNodes (destroyingNodes) {
        var nodes = destroyingNodes.pop();
        if (!nodes) {
            return null;
        }
        
        var animationQueue = [];
        
        var l = nodes.length,
            sinc = getSincArr(l); // делаем массив массивов, максимальная длина которого GLOBAL.touchPerLevel
        
        for (var j = 0, jl = sinc.length; j < jl; j++) {
            for (var i = 0, il = sinc[i]; i < il; i++) {
                var node = nodes.pop();
                animationQueue.push(node);
                node.activeThrough(GLOBAL.delay.touch * (i + 1));
            }
        }
        
        return animationQueue;
    }
    
    function animate (destroyingNodes, animationQueue) {
        for (var i = 0, l = 0, il = animationQueue.length; i < il; i++) {
            var node = animationQueue[i];
            if (node) {
                if(node.isActive) {
                    var frame = node.nextFrame();
                    if (frame.end) {
                        node = animationQueue[i] = null;
                    }
                }
                if (node) {
                    l++;
                }
            }
        }
        
        var f = function () {
            animate(destroyingNodes, animationQueue);
        };
        
        if (l == 0) {
            // записываем в animationQueue список нод, которые будем анимировать
            animationQueue = prepareDestroyingNodes(destroyingNodes);
            if (animationQueue !== null) {
                // анимируем следующий уровень
                requestAnimationFrame(f);
            } else {
                onAnimationEnd();
            }
        } else {
            // анимируемый тот же уровень
            requestAnimationFrame(f);
        }
    }
    
    function indexDomNodes (root, level, destroyingNodes) {
        var length = root.childNodes.length,
            arr = createNumArr(length),
            i = 0,
            countNodes =GLOBAL.maxNodesPerLevel;
        
        shuffleArr(arr);
        
        while (countNodes && i < length) {
            var node = root.childNodes[arr[i++]];
            if (node.nodeType != 1 || inWarningNodes(node)) {
                continue;
            }
            
            var	tag = node.tagName.toLowerCase(),
                parent = node.parentNode;
            
            if (!GLOBAL.warningTags[tag] && node.offsetHeight && node.offsetWidth &&
                !(node.offsetParent == parent.offsetParent && sameSizes(node, parent))) {
                if (!destroyingNodes[level])
                    destroyingNodes[level] = [];
                destroyingNodes[level].push(new DestroyingNode(node));
                GLOBAL.revertingNodes.push(new RevertingNode(node));
                countNodes--;
            }
            if (level < GLOBAL.maxLevel) {
                destroyingNodes = indexDomNodes(node, level + 1, destroyingNodes);
            }
        }
        return destroyingNodes;
    }
    
    function getSincArr (elCount) {
        var limit = elCount < GLOBAL.touchPerLevel ? elCount : GLOBAL.touchPerLevel,
            sinc = new Array(limit);
        while (elCount > 0) {
            for (var i = 0; i < limit; i++) {
                if (elCount-- > 0) {
                    if (sinc[i]) {
                        sinc[i]++;
                    } else {
                        sinc[i] = 1
                    }
                } else {
                    break;
                }
            }
        }
        return sinc;
    }
    
    function onAnimationEnd () {
        BHP.isActive = false;
    }
    
    /* Classes */

    // Класс для разрушения ноды
    function DestroyingNode (node) {
        addClass(node, 'destroying');
        this.node = node;
        this.offsetPos = offsetPosition(node, document.documentElement);
        this.size = { width: node.offsetWidth, height: node.offsetHeight };
        
        this.pos = {
            left: this.offsetPos.left + this.size.width / 2,
            top: this.offsetPos.top + this.size.height / 2
        };
        this.isActive = false;
        
        var transform = this.parseTransform(),
            endTangentScale = transform.scale,
            endTwirlScale;
        
        // для ScaleTransform
        if (GLOBAL.maxSize.width > this.size.width || GLOBAL.maxSize.height > this.size.height) {
            var scale = (this.size.width > this.size.height) ?
                GLOBAL.maxSize.width / this.size.width : GLOBAL.maxSize.height / this.size.height;
            endTangentScale = [transform.scale[0] * scale, transform.scale[1] * scale];
        }
        endTwirlScale = endTangentScale.map(function(a){ return a * GLOBAL.endScale });
        
        // для TranslateTransform
        // найти alpha и tangentVector
        var rvect = [
                this.pos.left - GLOBAL.blackholePos.left,
                this.pos.top - GLOBAL.blackholePos.top
            ],
            l = Math.sqrt(Math.pow(rvect[0], 2) + Math.pow(rvect[1], 2)),
            ang1 = Math.asin(rvect[0] / l);
            if (GLOBAL.r < l) {
                var ang2 = Math.acos(GLOBAL.r / l),
                    alpha = ang1 + ang2,
                    ang3 = Math.PI / 2 - alpha,
                    tangentVector = [
                        GLOBAL.r * Math.cos(ang3) - rvect[0],
                        -GLOBAL.r * Math.sin(ang3) - rvect[1]
                    ];
            } else {
                var alpha = ang1,
                    ang2 = Math.PI / 2 - alpha,
                    tangentVector = [
                        GLOBAL.r * Math.cos(ang2) - rvect[0],
                        -GLOBAL.r * Math.sin(ang2) - rvect[1]
                    ];
            } 
        
        this.transform = {
            rotate: new RotateTransform(transform.rotate),
            scale: new ScaleTransform(transform.scale, endTangentScale, endTwirlScale),
            translate: new TranslateTransform(transform.translate, tangentVector, alpha)
        };
        // :)
        GLOBAL.eventManager.add(this.transform.translate.tangent, 'end', this.onTangentTranslateEnd, this);
        GLOBAL.eventManager.add(this.transform.translate.twirl, 'end', this.onTwirlTranslateEnd, this);		
    }
    
    DestroyingNode.prototype = {
        nextFrame: function () {
            var scale = this.transform.scale.nextFrame(),
                rotate = this.transform.rotate.nextFrame(),
                translate = this.transform.translate.nextFrame();
                transformOrigin = [translate[0] + this.size.width / 2, translate[1] + this.size.height / 2]
                
            this.node.style[GLOBAL.transform[0]] = 
                'scale(' + scale[0] + ', ' + scale[1] + ') rotate(' + rotate + 'deg) translate(' + translate[0] + 'px, ' + translate[1] + 'px)';
            this.node.style[GLOBAL.transform[1]] = transformOrigin[0] + 'px ' + transformOrigin[1] + 'px';
            return this;
        },
        activeThrough: function (delay) {
            var _this = this;
            setTimeout(function () { _this.activate(); }, delay);
        },
        activate: function () {
            this.isActive = true;
        },
        parseTransform: function () {
            return {
                scale: [1, 1],
                rotate: 0,
                translate: [0, 0]
            };
        },
        onTangentTranslateEnd: function () {
            this.transform.scale.initTwirl();
            this.transform.translate.initTwirl();
            GLOBAL.eventManager.remove(this.transform.translate.tangent);
        },
        onTwirlTranslateEnd: function () {
            this.onEnd();
            GLOBAL.eventManager.remove(this.transform.translate.twirl);			
        },
        onEnd: function () {
            this.end = true;
            addClass(this.node, 'hidden');
        },
    }
    
    // Класс для восстановления ноды в исходное состояние
    function RevertingNode (node) {
        this.node = node;
        this.className = node.className;
        this.style = node.getAttribute('style');
    }
    
    RevertingNode.prototype = {
        revert: function () {
            this.node.className = this.className;
            this.node.setAttribute('style', this.style);
        }
    }

    /* Transform classes */
    
    function RotateTransform (degrees) {
        this.degrees = this.currentDegrees = degrees;
        this.diffDegrees = 360;
        this.n = 0;
        this.diffN = GLOBAL.n.rotate * (0.5 - Math.random());
    }
    RotateTransform.prototype = {
        toText: function () {
            return 'rotate(' + this.currentDegrees + 'deg)';
        },
        nextFrame: function () {
            this.currentDegrees = this.degrees + this.diffDegrees * this.nextN();
            return this.currentDegrees;
        },
        nextN: function () {
            this.n += this.diffN;
            if (this.n > 1 && this.n < 1)
                this.n = 0;
            return this.n;
        },
        endTransform: function () {
            
        }
    }
    
    function ScaleTransform (scale, tangentEndScale, twirlEndScale) {
        this.scale = scale;
        this.currentTransform = new Scale(scale, tangentEndScale, GLOBAL.n.tangentScale);
        this.twirlEndScale = twirlEndScale;
    }
    ScaleTransform.prototype = {
        toText: function () {
            return 'scale(' + this.scale[0] + ',' + this.scale[1] + ')';
        },
        nextFrame: function (n) {
            this.scale = this.currentTransform.nextFrame();
            return this.scale;
        },
        initTwirl: function () {
            this.currentTransform = new Scale(this.scale, this.twirlEndScale, GLOBAL.n.twirlScale);
        }
    }
    
    function Scale (scale, endScale, diffN) {
        this.scale = scale;
        this.diffScale = this.getDiffScale(endScale);
        this.n = 0;
        this.diffN = diffN;
    }
    Scale.prototype = {
        nextFrame: function () {
            var n = this.nextN();
            return [
                this.scale[0] + this.diffScale[0] * n,
                this.scale[1] + this.diffScale[1] * n
            ];
        },
        nextN: function () {
            if (this.end) {
                return this.n;
            }
            this.n += this.diffN;
            if (this.n > 1) {
                this.n = 1;
                this.onEnd();
            }
            return this.n
        },
        getDiffScale: function (endScale) {
            var diffScale = [];
            diffScale[0] = endScale[0] - this.scale[0];
            diffScale[1] = endScale[1] - this.scale[1];
            return diffScale;
        },
        onEnd: function() {
            this.end = true;
        }		
    }
    
    function TranslateTransform (translate, tangentVector, alpha) {
        this.translate = translate;
        this.currentTransform = this.tangent = new TangentTranslate(translate, tangentVector);
        this.twirl = new TwirlTranslate(this.translate, alpha);
    }
    TranslateTransform.prototype = {
        nextFrame: function() {
            this.translate = this.currentTransform.nextFrame();
            return this.translate;
        },
        toText: function() {
            return 'translate(' + this.translate[0] + 'px,' + this.translate[1] + 'px)';
        },
        initTwirl: function () {
            this.currentTransform = this.twirl;
            this.twirl.init(this.translate);
        }
    }
    
    function TangentTranslate (translate, vector) {
        this.translate = translate;
        this.n = 0;
        this.diffN = GLOBAL.n.tangentTranslate;
        this.diffTranslate = vector;		
    }
    TangentTranslate.prototype = {
        nextFrame: function () {
            var n = this.nextN();
            return [
                this.translate[0] + this.diffTranslate[0] * n,
                this.translate[1] + this.diffTranslate[1] * n
            ];
        },
        nextN: function () {
            this.n += this.diffN;
            if (this.n > 1) {
                this.n = 1;
                this.onEnd();
            }
            return this.n
        },
        endTransform: function() {
            this.diffTranslate = [0, 0];
            return this;
        },
        onEnd: function () {
            this.end = true;
            GLOBAL.eventManager.fire(this, 'end');
        }
    }
    
    function TwirlTranslate (translate, alpha) {
        this.translate = translate;
        this.alpha = alpha;
        this.r = GLOBAL.r;
        this.n = 0;
        this.diffN = GLOBAL.n.twirlTranslate;
        this.diffAlpha = Math.PI * GLOBAL.turns;
        this.toCenterRV = [Math.sin(alpha), Math.cos(alpha)];
    }
    TwirlTranslate.prototype = {
        init: function (translate) {
            this.translate = translate;
        },
        nextFrame: function () {
            var n = this.nextN(),
                alpha = this.alpha + this.diffAlpha * n,
                r = this.r * (1 - n),
                rV = [Math.sin(alpha), Math.cos(alpha)],
                translate = [
                    this.translate[0] - this.r * this.toCenterRV[0] + r * rV[0],
                    this.translate[1] + this.r * this.toCenterRV[1] - r * rV[1],
                ];
                
            return translate;
        },
        nextN: function () {
            this.n += this.diffN;
            if (this.n > 1) {
                this.n = 1;
                this.onEnd();
            }
            return this.n
        },
        onEnd: function () {
            this.end = true;
            GLOBAL.eventManager.fire(this, 'end');
        }
    }

    /* Helpers */
    
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
    
    function inWarningNodes (targetNode) {
        for (var node in GLOBAL.nodes) {
            if (GLOBAL.nodes[node] == targetNode) {
                return true;
            }
        }
        return false;
    }
    
    function scaleNode (node) {
        var width = node.offsetWidth,
            height = node.offsetHeight;
        
        if (width > GLOBAL.maxSize.width) {
            var scaleX = width / GLOBAL.maxSize.width;
        }
        if (height > GLOBAL.maxSize.height) {
            var scaleY = height / GLOBAL.maxSize.height;
        }
        if (scaleX || scaleY) {
            
        }
    }
    
    function sameSizes (node1, node2) {
        if (Math.abs(node1.offsetHeight - node2.offsetHeight) > GLOBAL.allowableSizeFault) {
            return false;
        }
        if (Math.abs(node1.offsetTop - node2.offsetTop) > GLOBAL.allowableSizeFault) {
            return false;
        }
        if (Math.abs(node1.offsetLeft - node2.offsetLeft) > GLOBAL.allowableSizeFault) {
            return false;
        }
        return true;
    }
    
    function shuffleArr (arr) {
        return arr.sort(function() {return 0.5 - Math.random()});
    }
    
    function createNumArr (length) {
        var arr = [];
        for (var i = 0; i < length; i++)
        {
            arr[i] = i;
        }
        return arr;
    }
    
    function css (el, css) {
        if (typeof css == 'string') {
            el.setAttribute('style', (el.getAttribute('style') || '') + css);
        } else {
            for (var k in css) {
                el.style[k] = css[k];
            }
        }
    }
    
    function cName (className) {
        return GLOBAL.classPrefix + '-' +className;
    }
    
    function addClass(o){
        for (var i = 1, il = arguments.length; i < il; i++) {
            var c = cName(arguments[i]),
                re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g");
            if (!re.test(o.className)) {
                o.className = (o.className + " " + c).replace(/\s+/g, " ").replace(/(^ | $)/g, "");
            }
        }
    }
 
    function removeClass(o){
        for (var i = 1, il = arguments.length; i < il; i++) {
            var c = cName(arguments[i]),
                re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g");
            o.className = o.className.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "");
        }		
    }
    
    function offsetPosition (node, root) {
        var left = 0, top = 0;
        
        if (node == root)
            return { left: left, top: top };
        
        var parent, lastNode;
        for (;;) {
            left += node.offsetLeft;
            top += node.offsetTop;
            
            parent = node.offsetParent;
            if (parent && parent !== root) {
                lastNode = node;
                node = parent;
            }
            else {
                if (lastNode) {
                    left -= lastNode.scrollLeft;
                    top -= lastNode.scrollTop;
                }	
                break;
            }
        }
        
        return { left: left, top: top };
    }
    
    function getSupportTransformName () {
        var el = document.createElement('div');
        if (typeof el.style.MozTransform != 'undefined')
            return ['MozTransform', 'MozTransformOrigin'];
        if (typeof el.style.OTransform != 'undefined')
            return ['OTransform', 'OTransformOrigin', true];
        if (typeof el.style.msTransform != 'undefined')
            return ['msTransform', 'msTransformOrigin'];
        
        el.style['-webkit-transform'] = 'scale(0)';
        if (el.style.getPropertyValue('-webkit-transform'))
            return ['-webkit-transform', '-webkit-transform-origin', true];
            
        return null;	
    }
    
    var requestAnimationFrame = (function () {
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / GLOBAL.fps);
              };
    })();
    
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
});
