// Penner easing
// http://robertpenner.com/easing/

function edgeWrapper(fn) {
	return (t, b, c, d, ...args) => {
		if (t <= 0) return b;
		if (t >= d) return b + c;

		return fn(t, b, c, d, ...args);
	};
}

export const linear = edgeWrapper((t, b, c, d) => {
	return b + (c * t) / d;
});

export const easeOutQuart = edgeWrapper((t, b, c, d) => {
	return -c * ((t = t / d - 1) * t * t * t - 1) + b;
});

export const easeOutQuad = edgeWrapper((t, b, c, d) => {
	return -c * (t /= d) * (t - 2) + b;
});

export const easeInQuad = edgeWrapper((t, b, c, d) => {
	return c * (t /= d) * t + b;
});

export const easeInQuint = edgeWrapper((t, b, c, d) => {
	return c * (t /= d) * t * t * t * t + b;
});

export const easeInOutBack = edgeWrapper((t, b, c, d, s = 1.70158) => {
	if (s == undefined) s = 1.70158;
	if ((t /= d / 2) < 1)
		return (c / 2) * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
	return (c / 2) * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
});

export const easeOutElastic = edgeWrapper(function easeOutElastic(t, b, c, d) {
	let s;
	let p = 0;
	let a = c;

	if (t == 0) return b;
	if ((t /= d) >= 1) return b + c;
	if (!p) p = d * 0.3;

	if (a < Math.abs(c)) {
		a = c;
		s = p / 4;
	} else {
		s = (p / (2 * Math.PI)) * Math.asin(c / a);
	}

	return (
		a * Math.pow(2, -10 * t) * Math.sin(((t * d - s) * (2 * Math.PI)) / p) +
		c +
		b
	);
});

// other useful animation-related functions

export function getRandomAngle(min, max) {
	const randValue = min + Math.random() * (max - min);
	const sign = Math.random() < 0.5 ? 1 : -1;
	return randValue * sign;
}
