window.onload = (function blackhole () {
	
	var transform = getSupportTransformName();
	if (transform === null) {
		return;
	}
	
	window.BlackHoleProject = window.BlackHoleProject || {};
	var BHP = window.BlackHoleProject,
		body = document.getElementsByTagName('body')[0],
		windowOffset = window.pageYOffset,
		screenHeight = window.screen.availHeight || window.screen.height,
		screenWidth = window.screen.availWidth || window.screen.width,
		maxNodesPerLevel = 50,
		allowableSizeFault = 3,
		maxLevel = 10,
		maxSize = {
			width: 50,
			height: 50
		},
		destroyingNodes = [], // двухмерный массив разрушаемых нод
		revertingNodes = [], // одномерный массив восстонавливаемых нод
		classPrefix = 'blackhole',
		warningTags = {
			'thead': true,
			'tbody': true,
			'tr': true
		},
		blackholePos = {
			left: (screenWidth)/2,
			top: (windowOffset + screenHeight/2) - 30
		},
		transformFields = [
			'matrix', 'matrix3d', 'translate3d', 'translateX',
			'translateY', 'translateZ', 'scale', 'scale3d', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotate3d',
			'rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY',
			'skew', 'perspective'
		],
		animationQueue = [],
		touchPerLevel = 15, // максимальное количество подходов разрушений на уровень
		delay = { // задержки
			touch: 400
		},
		fps = 60,
		n = {
			rotate: fps/1000,
			tangentTranslate: fps/3000,
			twirlTranslate: fps/3000,
			tangentScale: fps/3000,
			twirlScale: fps/3000
		},
		endScale = 0.8, // уровень масштабирования на последней анимации
		r = 300; // радиус облета черной дыры
	
	window.onload = BHP.bind = function () {
		if (BHP.isActive) {
			return;
		}
		BHP.isActive = true;
		
		var blackhole = document.createElement('div'),
			transparentLayout = document.createElement('div');
		
		css(blackhole, { left: blackholePos.left + 'px', top: blackholePos.top + 'px'});
		addClass(document.documentElement, 'wrapper');
		addClass(transparentLayout, 'transparent-layout');
		addClass(blackhole, 'init-position', 'circle');
		setTimeout(function(){ addClass(blackhole, 'active-position'); }, 200);
		addClass(body, 'animate');
		body.appendChild(blackhole);
		body.appendChild(transparentLayout);
		destroyingNodes = indexDomNodes(document.body, 0);
		prepareDestroyingNodes(destroyingNodes);
		animate();
	};
	
	/* Main functions */
	
	function prepareDestroyingNodes (destroyingNodes) {
		var nodes = destroyingNodes.pop();
		if (!nodes) {
			return null;
		}
		
		animationQueue = [];
		
		var l = nodes.length,
			sinc = getSincArr(l, touchPerLevel);
		
		for (var j = 0, jl = sinc.length; j < jl; j++) {
			for (var i = 0, il = sinc[i]; i < il; i++) {
				var node = nodes.pop();
				animationQueue.push(node);
				node.activeThrough(delay * j);
			}
		}
	}
	
	function getSincArr (elCount, limit) {
		limit = elCount < limit ? elCount : limit;
		var sinc = new Array(limit);
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
	
	function animate () {
    	for (var i = 0, l = 0, il = animationQueue.length; i < il; i++) {
    		var node = animationQueue[i];
    		if (node) {
    			if(node.isActive) {
	    			var frame = node.nextFrame();
	    			if (frame.end) {
	    				node = animationQueue[i] = null;
	    			}
				}
	    		if (node)
	    			l++;
    		}
    	}
    	if (l == 0) {
    		if (prepareDestroyingNodes() !== null) {
    			animate();
    		} else {
    			onAnimationEnd();
    		}
		} else {
			animate();
		}
    }
	
	function indexDomNodes (root, level, destroyingNodes) {
		var length = root.childNodes.length,
			arr = createNumArr(length),
			i = 0,
			countNodes = maxNodesPerLevel;
		
		shuffleArr(arr);
		
		while (countNodes && i < length) {
			var node = root.childNodes[arr[i++]];
			if (node.nodeType != 1 || node == blackhole) {
				continue;
			}
			
			var	tag = node.tagName.toLowerCase(),
				parent = node.parentNode;
			
			if (!warningTags[tag] && /*node.offsetHeight && node.offsetWidth &&*/
				!(node.offsetParent == parent.offsetParent && sameSizes(node, parent))) {
				if (!destroyingNodes[level])
					destroyingNodes[level] = [];
				destroyingNodes[level].push(new DestroyingNode(node));
				revertingNodes.push(new RevertingNode(node));
				countNodes--;
			}
			if (level < maxLevel) {
				destroyingNodes = indexDomNodes(node, level + 1, destroyingNodes);
			}
		}
		return destroyingNodes;
	}
    
	function onAnimationEnd () {
		
	}
	
    /* Classes */

	// Класс для разрушения ноды
	function DestroyingNode (node) {
		addClass(node, 'destroying');
		this.node = node;
		this.offsetPos = offsetPosition(node, document.documentElement);
		this.size = { width: node.offsetWidth, height: node.offsetHeight };
		this.distance = {
			left: blackholePos.left - this.offsetPos.left - this.size.width / 2,
			top: blackholePos.top - this.offsetPos.top - this.size.height / 2			
		};
		this.isActive = false;
		
		var transform = this.parseTransform(),
			endTangentScale = transform.scale,
			endTwirlScale;
		
		if (maxSize.width > this.size.width || maxSize.height > this.size.height) {
			var scale = (this.size.width > this.size.height) ?
				maxSize.width / this.size.width : maxSize.height / this.size.height;
			endTangentScale = [transform.scale[0] * scale, transform.scale[1] * scale];
		}
		
		endTwirlScale = endTangentScale.map(function(a){ return a * endScale });
		
		this.transform = {
			rotate: new RotateTransform(transform.rotate),
			scale: new ScaleTransform(transform.scale, endTangentScale, endTwirlScale),
			translate: new TranslateTransform(transform.translate, tangentVector, alpha)
		};
		// :)
		eventManager.add(this.transform.translate.tangent, 'end', this.onTangentTranslateEnd, this);
		eventManager.add(this.transform.translate.twirl, 'end', this.onTwirlTranslateEnd, this);		
	}
	
	eventManager.add(obj, eventName, function () {});
	
	DestroyingNode.prototype = {
		nextFrame: function () {
			var scale = this.transform.scale,
				rotate = this.transform.rotate,
				translate = this.transform.translate;
				
			this.node.style[transform] = 
				scale.nextFrame().toText() + ' ' + rotate.nextFrame().toText() + ' ' +translate.nextFrame().toText();
		},
		activeThrough: function (delay) {
			var _this = this;
			setTimeout(function () { _this.isActive = true; }, delay);
		},
		parseTransform: function () {
			return {
				scale: [1, 1],
				rotate: 0,
				translate: [0, 0]
			};
		},
		onTangentTranslateEnd: function () {
			this.transform.rotate.initTwirl();
			this.transform.translate.initTwirl();
			eventManager.remove(this.transform.translate.tangent);
		},
		onTwirlTranslateEnd: function () {
			this.onEnd();
			eventManager.remove(this.transform.translate.twirl);			
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
		this.diffN = n.rotate;
	}
	RotateTransform.prototype = {
		toText: function () {
			return 'rotate(' + this.currentDegrees + 'deg)';
		},
		nextFrame: function () {
			this.currentDegrees = this.degrees + this.diffDegrees * this.nextN();
			return this;
		},
		nextN: function () {
			this.n += this.diffN;
			if (this.n > 1)
				this.n = 0;
			return this.n;
		},
		endTransform: function () {
			
		}
	}
    
	function ScaleTransform (scale, tangentEndScale, twirlEndScale) {
		this.scale = scale;
		this.currentTransform = new TangentScale(scale, tangentEndScale, n.tangentScale);
		this.twirlEndScale = twirlEndScale;
	}
	ScaleTransform.prototype = {
		toText: function () {
			return 'scale(' + this.scale[0] + ',' + this.scale[1] + ')';
		},
		nextFrame: function (n) {
			this.scale = this.currentTransform.nextFrame();
			return this;
		},
		initTwirl: function () {
			this.currentTransform = new TwirlScale(this.scale, this.twirlEndScale, n.twirlScale);
		}
	}
	
	function Scale (scale, endScale) {
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
				return;
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
		this.currentTransform = new TangentTranslate(translate, tangentVector);
	}
	TranslateTransform.prototype = {
		nextFrame: function() {
			this.translate = this.currentTransform.nextFrame();
		},
		toText: function() {
			return 'translate(' + this.translate[0] + 'px,' + this.translate[1] + 'px)';
		},
		initTwirl: function () {
			this.currentTransform = new TwirlTranslate(this.translate, alpha);
		}
	}
	
	function TangentTranslate (translate, vector) {
		this.translate = translate;
		this.n = 0;
		this.diffN = n.tangentTranslate;
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
		}
		endTransform: function() {
			this.diffTranslate = [0, 0];
			return this;
		},
		onEnd: function () {
			this.end = true;
			eventManager.fire(this, 'end');
		}
	}
	
	function TwirlTranslate (translate, alpha) {
		this.translate = translate;
		this.alpha = alpha;
		this.r = r;
		this.n = 0;
		this.diffN = n.twirlTranslate;
		this.diffAlpha = 360;
		this.prevRV = [this.r * Math.sin(alpha), this.r * Math.cos(alpha)];
	}
	TwirlTranslate.prototype = {
		nextFrame: function () {
			var n = this.nextN(),
				alpha = this.alpha + this.diffAlpha * n,
				r = this.r - this.r * n,
				rV = [r * Math.sin(alpha), r * Math.cos(alpha)],
				translate = [
					this.translate[0] - (rV[0] - prevRV[0]),
					this.translate[1] + (rV[1] - prevRV[1])
				],
				prevRV = rV;
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
			eventManager.fire(this, 'end');
		}
	}

	/* Helpers */
	
	function scaleNode (node) {
		var width = node.offsetWidth,
			height = node.offsetHeight;
		
		if (width > maxSize.width) {
			var scaleX = width / maxSize.width;
		}
		if (height > maxSize.height) {
			var scaleY = height / maxSize.height;
		}
		if (scaleX || scaleY) {
			
		}
	}
	
	function sameSizes (node1, node2) {
		if (Math.abs(node1.offsetHeight - node2.offsetHeight) > allowableSizeFault) {
			return false;
		}
		if (Math.abs(node1.offsetTop - node2.offsetTop) > allowableSizeFault) {
			return false;
		}
		if (Math.abs(node1.offsetLeft - node2.offsetLeft) > allowableSizeFault) {
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
		return classPrefix + '-' +className;
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
			return 'MozTransform';
		if (typeof el.style.OTransform != 'undefined')
			return 'OTransform';
		if (typeof el.style.msTransform != 'undefined')
			return 'msTransform';
		
		el.style['-webkit-transform'] = 'scale(0)';
		if (el.style.getPropertyValue('-webkit-transform'))
			return '-webkit-transform';
			
		return null;	
	}
	
	var requestAnimationFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / fps);
              };
    })();
    
    function getRandomInt(min, max)
	{
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	}
    
	
	var eventManager = {
		events: {},
		add: function (obj, eventName, callback, context) {
			context = context || window;
			var events = this.events;
			events = events[obj] || (events[obj] = {});
			events = events[eventName] || (events[eventName] = {});
			events = events[callback] || (events[callback] = {});
			events[context] = { callback: callback,	context: context };
		},
		remove: function (obj, eventName, callback, context) {
			context = context || window;
			var events = this.events;
			if (!obj) {
				this.events = null;
				return;
			};
			if (!eventName) {
				events[obj] = null;
				return;
			}
			if (!callback) {
				events[obj][eventName] = null;
				return;
			}
			if (!context) {
				events[obj][eventName][callback] = null;
				return;
			}
			events[obj][eventName][callback][context] = null;
		},
		fire: function (obj, eventName) {
			var events = this.events[obj];
			if (!events) {
				return;
			}
			events = events[eventName];
			if (!events) {
				return;
			}
			for (var callbacks in events)
				for (var contexts in callbacks)
					for (var event in contexts)
						event.callback.call(event.context);
		}
	}

	
});
