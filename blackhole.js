(function () {
	var css = function (el, css) {
		el.setAttribute('style', css)
	},
		body = document.getElementsByTagName('body')[0];
	css(body, 
		'-moz-transition: all 0.5s ease-in-out; -moz-transform: translate(0,50px);-moz-transform: rotate(-360deg);'
	);
})();