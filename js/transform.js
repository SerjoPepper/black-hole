(function () {

function CssTransform (node) {
	this.node = node;
	this.initialTransform = this.init(node);
	this.transform = this.bind(this.initialTransform, twirlCenter);
}
CssTransform.prototype = {
	init: function (node) {
		return null;
	},
	
	bind: function (initial, twirlCenter) {
		return {
			scale: new ScaleTransform([1, 1]),
			rotate: new RotateTransform(0),
			translate: new TranslateTransform(twirlCenter)
		}
	},
	
	start: function () {
		
	}
}

var BHP = window.BlackHoleProject = window.BlackHoleProject || {};
BHP.TranslateTransform = TranslateTransform;
BHP.RotateTransform = RotateTransform;
BHP.ScaleTransform = ScaleTransform;
})()