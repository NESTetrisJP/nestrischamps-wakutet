function threshold(data, color = [0, 0, 0], tolerance = 25) {
	const squared_tolerance = tolerance * tolerance;

	const length = data.length / 4;
	const result = new Uint8Array(length);
	for (let i = 0; i < length; i++) {
		const startIndex = i * 4;
		result[i] =
			Math.pow(data[startIndex + 0] - color[0], 2) < squared_tolerance &&
			Math.pow(data[startIndex + 1] - color[1], 2) < squared_tolerance &&
			Math.pow(data[startIndex + 2] - color[2], 2) < squared_tolerance
				? 1
				: 0;
	}
	return result;
}

// perform min or max operation with neighbor pixels (horizontally or vertically)
function morphology(data, width, height, horizontalOrVertical, minOrMax) {
	const result = new Uint8Array(data.length);
	for (let iy = 0; iy < height; iy++) {
		for (let ix = 0; ix < width; ix++) {
			const v = data[iy * width + ix];
			let vn;
			let vp;
			if (horizontalOrVertical == 1) {
				vn = data[Math.max(iy - 1, 0) * width + ix];
				vp = data[Math.min(iy + 1, height - 1) * width + ix];
			} else {
				vn = data[iy * width + Math.max(ix - 1, 0)];
				vp = data[iy * width + Math.min(ix + 1, width - 1)];
			}
			if (minOrMax == 1) {
				result[iy * width + ix] = Math.max(v, vn, vp);
			} else {
				result[iy * width + ix] = Math.min(v, vn, vp);
			}
		}
	}
	return result;
}

function erode(data, width, height) {
	const horizontalResult = morphology(data, width, height, 0, 0);
	const verticalResult = morphology(horizontalResult, width, height, 1, 0);
	return verticalResult;
}

function dilate(data, width, height) {
	const horizontalResult = morphology(data, width, height, 0, 1);
	const verticalResult = morphology(horizontalResult, width, height, 1, 1);
	return verticalResult;
}

function flood(image, width, height, [startX, startY], error_data = null) {
	console.log({
		msg: 'Initiating flood-fill',
		startX,
		startY,
	});

	const seen = new Array(width).fill().map(_ => new Array(height).fill());

	function check(x, y) {
		return image[y * width + x] > 0;
	}

	function handled(x, y) {
		return seen[x][y] !== undefined;
	}

	if (!check(startX, startY)) {
		const payload = error_data || {
			msg: 'Starting point does not match color',
		};
		console.error(JSON.stringify(payload, null, 2));
		throw new Error(payload.msg, {
			cause: payload,
		});
	}

	function maybeAddToQueue(tx, ty) {
		if (tx < 0 || tx >= width) return;
		if (ty < 0 || ty >= height) return;

		if (!handled(tx, ty)) {
			queue.push([tx, ty]);
		}
	}

	const queue = [[startX, startY]];

	while (queue.length) {
		const [x, y] = queue.shift();
		if (handled(x, y)) continue;

		seen[x][y] = check(x, y);

		if (!seen[x][y]) continue;

		maybeAddToQueue(x - 1, y);
		maybeAddToQueue(x + 1, y);
		maybeAddToQueue(x, y - 1);
		maybeAddToQueue(x, y + 1);
	}

	return seen;
}

export function getFieldCoordinates(
	img_data,
	startPoint,
	color = [0, 0, 0],
	tolerance = 25
) {
	const [startX, startY] = startPoint;
	const squared_tolerance = tolerance * tolerance;

	// thresholding
	const thresholdImage = threshold(img_data.data, color, tolerance);

	const start_index = 4 * (startY * img_data.width + startX);
	const data = img_data.data;
	const distances = [
		data[start_index + 0] - color[0],
		data[start_index + 1] - color[1],
		data[start_index + 2] - color[2],
	];
	const squared_distances = distances.map(d => d * d);
	const error_data = {
		msg: 'Starting point does not match color',
		target: color,
		selected: [
			data[start_index + 0],
			data[start_index + 1],
			data[start_index + 2],
		],
		tolerance,
		distances,
		euclidian_distance: Math.sqrt(
			squared_distances.reduce((acc, v) => acc + v, 0)
		),
		squared_tolerance,
		squared_distances,
	};

	// "opening" morphological operation, which fills small gaps
	const erodedImage = erode(thresholdImage, img_data.width, img_data.height);
	const dilatedImage = dilate(erodedImage, img_data.width, img_data.height);

	const result = flood(
		dilatedImage,
		img_data.width,
		img_data.height,
		startPoint,
		error_data
	);

	const [top, left, bottom, right] = result.reduce(
		([t, l, b, r], column, x) => {
			column.forEach((isBlack, y) => {
				if (isBlack) {
					if (x < l) l = x;
					if (x > r) r = x;
					if (y < t) t = y;
					if (y > b) b = y;
				}
			});
			return [t, l, b, r];
		},
		[Infinity, Infinity, -1, -1]
	);

	return [left, top, right - left + 1, bottom - top + 1];
}

export function getCaptureCoordinates(
	reference_size,
	ideal_field_w_border_xywh,
	field_w_border_xywh
) {
	const scaleX = field_w_border_xywh[2] / ideal_field_w_border_xywh[2];
	const scaleY = field_w_border_xywh[3] / ideal_field_w_border_xywh[3];

	return [
		field_w_border_xywh[0] - ideal_field_w_border_xywh[0] * scaleX,
		field_w_border_xywh[1] - ideal_field_w_border_xywh[1] * scaleY,
		scaleX * reference_size[0],
		scaleY * reference_size[1],
	];
}
