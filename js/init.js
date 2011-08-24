//	load scripts
(function () {
	
	loadTag('script', {	type: 'text/javascript', charset: 'utf-8', src: 'js/transform.js', id: 'blackhole-transform-js' });
	loadTag('script', {	type: 'text/javascript', charset: 'utf-8', src: 'js/animate.js', id: 'blackhole-animate-js' });
	loadTag('script', {	type: 'text/javascript', charset: 'utf-8', src: 'js/common.js', id: 'blackhole-common-js' });
	loadTag('link', { rel: 'stylesheet', href: 'css/common.css',  id: 'blackhole-css' });
	
	function loadTag (tagName, attributes) {
		if (document.getElementById(attributes.id)) {
			return;
		}
		var el = document.createElement(tagName);
		for (var k in attributes) {
			el.setAttribute(k, attributes[k]);
		}
		document.getElementsByTagName('head')[0].appendChild(el);
		el.remove = function () {
			el.parentNode.removeChild(el);
			el = null;
		};
		return el;
	}	
})();
