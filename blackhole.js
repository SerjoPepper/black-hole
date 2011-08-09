(function () {
	var css = function (el, css) {
		el.setAttribute('style', el.getAttribute('style') + css)
	},
		html = document.getElementsByTagName('html')[0];
	css(html, {
		'-moz-transition: all 3s ease-in-out; -moz-transform: translate(0,50px); '
	});
})();