(function () {
	var css = function (el, css) {
		el.setAttribute('style', css)
	},
		c = 'blackhole-animate'
		body = document.getElementsByTagName('body')[0],
		blackhole = document.createElement('div');
		
		
	addClass(blackhole, 'scary-blackhole init-' + cName('position') + ' ' + c);
	addClass(body, c);
	
	body.appendChild(blackhole);
	blackhole.removeClass('init-' + cName('position'));
	blackhole.addClass('active-' + cName('position'));
	
	function cName (class) {
		return 'blackhole-' + class;
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
})();