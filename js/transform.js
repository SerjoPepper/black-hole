(function () {

function CssTransform (node) {
	this.initialTransform = this.initTransform(node);
	this.transform = this.bindTransform(this.initialState, twirlCenter);
}
CssTransform.prototype = {
	initTransform: function (node) {
		return null;
	},
	
	bindTransform: function (initial, twirlCenter) {
		return {
			scale: new ScaleTransform([1, 1]),
			rotate: new RotateTransform(0),
			translate: new TranslateTransform(twirlCenter)
		}
	}
}

function ScaleTransform (scale) {
	this.scale = scale || [1, 1];
}
ScaleTransform.prototype = {
	toText: function () {
		return this.scale[0] + ',' + this.scale[1];
	},
	nextFrame: function (n) {
		this.scale[0] += this.diffScale[0] * n;
		this.scale[1] += this.diffScale[1] * n;
		return this;
	},
	prepareTransform: function (endScale) {
		this.endScale = endScale;
		this.diffScale[0] = endScale[0] - this.scale[0];
		this.diffScale[1] = endScale[1] - this.scale[1];
		return this;
	},
	endTransform: function() {
		this.scale = this.endScale;
		this.diffScale = [0, 0];
		return this;
	}
}

function RotateTransform (degrees) {
	this.degrees = this.currentDegrees = degrees || 0;
}
RotateTransform.prototype = {
	toText: function () {
		return this.currentDegrees + 'deg';
	},
	nextFrame: function (n) {
		this.degrees += this.diffDegrees * n;
		return this;
	},
	prepareTransform: function (endDegrees) {
		this.endDegrees = endDegrees;
		this.diffDegrees = endDegrees - this.degrees;
		return this;
	},
	endTransform: function () {
		this.degrees = this.endDegrees;
		this.diffDegrees = 0;
		return this.
	}
}

function TranslateTransform (translate) {
	translate = translate || [0, 0];
	this.translate = translate.slice();
	this.currentTranslate = translate.slice()
}
TranslateTransform.prototype = {
	toText: function() {
		return this.currentTranslate[0] + ',' + this.currentTranslate[1];
	},
	nextFrame: function (n) {
		this.currentTranslate[0] = this.translate[0] + this.diffTranslate[0] * n;
		this.currentTranslate[1] = this.translate[1] + this.diffTranslate[1] * n;
		return this;
	},
	prepareTransform: function (endTranslate) {
		this.endTranslate = endTranslate;
		this.diffTranslate = endTranslate - this.translate;
		return this;
	},
	endTransform: function() {
		this.translate = this.endTranslate;
		this.currentTranslate = this.endTranslate.slice();
		this.diffTranslate = [0, 0];
		return this;
	}
}

function TwirlTransform (translate, r, alpha) {
	this.translate = translate || [0, 0];
	this.currentTranslate = [];
	this.alpha = alpha;
	this.r = r;
}
TwirlTransform.prototype = {
	toText: function () {
		return this.currentTranslate[0] + ',' + this.currentTranslate[1];
	},
	nextFrame: function (n) {
		var alpha = this.alpha + this.diffAlpha * n,
			r = this.r * n;
		this.currentTranslate[0] = this.twirlCenter[0] + r * Math.sin(alpha);
		this.currentTranslate[1] = this.twirlCenter[1] - r * Math.cos(alpha)
	},
	prepareTransform: function () {
		this.diffAlpha = 360;
		this.diffR = r;
	},
	endTransform: function () {
		this.currentTranslate = this.twirlCenter;
	}
}

var BHP = window.BlackHoleProject = window.BlackHoleProject || {};
BHP.TranslateTransform = TranslateTransform;
BHP.RotateTransform = RotateTransform;
BHP.ScaleTransform = ScaleTransform;
})()