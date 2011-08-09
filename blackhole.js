(function () {
	var css = function (el, css) {
		el.setAttribute('style', css)
	},
		body = document.getElementsByTagName('body')[0];
	css(body, 
		'-moz-transition: all 0.5s ease-in-out; -moz-transform: translate(3px,3px);-moz-transform: rotate(-360deg); -moz-transform: scale(0.001); '
	);
})();