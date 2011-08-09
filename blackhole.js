(function () {
	var css = function (el, css) {
		el.setAttribute('style', css)
	},
		body = document.getElementsByTagName('body')[0];
	css(body, 
		'-moz-transition: all 3s ease-in-out; -moz-transform: translate(0,50px); '
	);
})();