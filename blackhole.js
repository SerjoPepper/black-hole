(function () {
	var c = cName('animate')
		body = document.getElementsByTagName('body')[0],
		blackhole = document.createElement('div'),
		transparentLayout = document.createElement('div'),
		windowOffset = window.pageYOffset,
		screenHeight = window.screen.height;
		
	css(blackhole, { left: window.screen.width/2, top: (windowOffset + screenHeight)/2 });
	addClass(document.documentElement, cName('wrapper'));
	addClass(transparentLayout, cName('transparent-layout'));
	addClass(blackhole, 'init-' + cName('position'));
	setTimeout(function(){ addClass(blackhole, 'active-' + cName('position')); }, 200);
	addClass(body, c);
	
	body.appendChild(blackhole);
	body.appendChild(transparentLayout);
	
	
	function css (el, css) {
		if (typeof css == 'string') {
			el.setAttribute('style', el.getAttribute('style') + css);
		} else {
			for (var k in css) {
				el.style[k] = css[k];
			}
		}
	},
	
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