(function () {
	var c = cName('animate')
		body = document.getElementsByTagName('body')[0],
		blackhole = document.createElement('div'),
		transparentLayout = document.createElement('div'),
		windowOffset = window.pageYOffset,
		screenHeight = window.screen.availHeight || window.screen.height,
		screenWidth = window.screen.availWidth || window.screen.width,
		maxNodes = 50,
		allowableSizeError = 3,
		maxLevel = 10,
		attackableNodes = [],
		warningTags = {
			'thead': true,
			'tbody': true,
			'tr': true
		},
		blackholePos = {
			left: (screenWidth)/2 + 'px',
			top: (windowOffset + screenHeight/2) - 30 + 'px'
		},
		offsetPos = cName('offsetPosition');
		
	css(blackhole, blackholePos);
	
	addClass(document.documentElement, cName('wrapper'));
	addClass(transparentLayout, cName('transparent-layout'));
	addClass(blackhole, 'init-' + cName('position') + ' ' + cName('circle'));
	setTimeout(function(){ addClass(blackhole, 'active-' + cName('position')); }, 200);
	addClass(body, c);
	
	body.appendChild(blackhole);
	body.appendChild(transparentLayout);
	
	indexDomNodes(document.body, 0);
	attackableNodes.reverse();
	animateAttackableNodes(attackableNodes);
	
	function animateAttackableNodes (attackableNodes) {
		for (var i = 0, il = attackableNodes.length; i < il; i++) 
		{
			var nodes = attackableNodes[i],
			setTimeout(function() {
				for (var i = 0, il = nodes.length; i < il; i++) 
				{
					var node = nodes[i];
					pos = {
						left: blackholePos.left - node[offsetPos].left,
						top: blackholePos.top - node[offsetPos].top
					};
					addClass(node, cName('attackable');
					css(node, '-moz-transform: translate(' + pos.left + 'px, ' + pos.top + 'px)');
				}
			}, 2000);

		}
	}
	
	function getRandomInt(min, max)
	{
	  return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function indexDomNodes (root, level) {
		var length = root.childNodes.length,
			arr = createNumArr(length),
			i = 0,
			countNodes = maxNodes;
		
		shuffleArr(arr);
		
		while (countNodes && i < length) {
			var node = root.childNodes[arr[i++]];
			if (node.nodeType != 1 || node == blackhole) {
				continue;
			}
			
			var	tag = node.tagName.toLowerCase(),
				parent = node.parentNode;
			
			if (!warningTags[tag] && node.offsetHeight && node.offsetWidth &&
				!(node.offsetParent == parent.offsetParent && sameSizes(node, parent))) {
				if (!attackableNodes[level])
					attackableNodes[level] = [];
				node[offsetPos] = offsetPosition(node);
				attackableNodes[level].push(node);
				countNodes--;
			}
			if (level < maxLevel) {
				indexDomNodes(node, level + 1);
			}
		}
	}
	
	function sameSizes (node1, node2) {
		if (Math.abs(node1.offsetHeight - node2.offsetHeight) > allowableSizeError) {
			return false;
		}
		if (Math.abs(node1.offsetTop - node2.offsetTop) > allowableSizeError) {
			return false;
		}
		if (Math.abs(node1.offsetLeft - node2.offsetLeft) > allowableSizeError) {
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
			el.setAttribute('style', el.getAttribute('style') + css);
		} else {
			for (var k in css) {
				el.style[k] = css[k];
			}
		}
	}
	
	function cName (className) {
		return 'blackhole-' + className;
	}
	
	function addClass(o, c){
	    var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g")
	    if (re.test(o.className)) return
	    o.className = (o.className + " " + c).replace(/\s+/g, " ").replace(/(^ | $)/g, "")
	}
 
	function removeClass(o, c){
  		var re = new RegExp("(^|\\s)" + c + "(\\s|$)", "g")
    	o.className = o.className.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "")
	}
	
	function offsetPosition (node, root) {
		var node = this, left = 0, top = 0;
		
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
})();