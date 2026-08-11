import { getConnectedDevices } from '/producer/MediaUtils.js';

const dom = {
	video: document.getElementById('video'),
	devices: document.getElementById('devices'),
	tbody: document.getElementById('tbody'),
	request: document.getElementById('request'),
	results: document.getElementById('results'),
	effective_frame_rate: document.getElementById('effective_frame_rate'),
};

let lastConstraints = {};

async function populateDevices() {
	const devices = await getConnectedDevices('videoinput');

	const default_devices = [
		{
			label: 'Select Capture Device',
			deviceId: '',
		},
	];

	const mappedDevices = devices.map(camera => {
		const device = { label: camera.label, deviceId: camera.deviceId };

		// Drop the manufacturer:make identifier because it's (typically) not useful
		// device.label = device.label.replace(
		//     /\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/,
		//     ''
		// );

		// Add a short form for the device id
		if (camera.deviceId?.slice) {
			const id = camera.deviceId;
			const shortId = `${id.slice(0, 4)}..${id.slice(-4)}`;
			device.label += ` [${shortId}]`;
		}

		return device;
	});

	const previousValue = dom.devices.value;

	dom.devices.replaceChildren(
		...[...default_devices, ...mappedDevices].map(camera => {
			const camera_option = document.createElement('option');
			camera_option.text = camera.label;
			camera_option.value = camera.deviceId;

			if (previousValue === camera.deviceId) {
				camera_option.selected = true;
			}

			return camera_option;
		})
	);
}

const CAPABILITY_KEYS = [
	'frameRate',
	'width_height',
	// 'resizeMode',
	'brightness',
	'contrast',
	'saturation',
];

function sanitizeData(constraintsOrSettings) {
	const tmp = { ...constraintsOrSettings };

	delete tmp.deviceId;
	delete tmp.groupId;

	return tmp;
}

async function updateConstraints(newConstraints, useOldSettings = true) {
	const track = dom.video.srcObject.getVideoTracks()[0];
	const oldSettings = track.getSettings();

	newConstraints = {
		...(useOldSettings ? oldSettings : {}),
		...newConstraints,
	};

	// we never control via those settings, so ignore for now
	delete newConstraints.deviceId;
	delete newConstraints.groupId;
	delete newConstraints.aspectRatio;
	delete newConstraints.resizeMode;

	Object.entries(newConstraints).forEach(([key, value]) => {
		if (!value) delete newConstraints[key];
	});

	const request = Object.entries(newConstraints).reduce((acc, [key, value]) => {
		acc[key] = { ideal: value };
		return acc;
	}, {});

	dom.request.textContent = JSON.stringify(request, null, 2);
	dom.results.textContent = 'pending...';
	document.body.style.cursor = 'wait';

	try {
		await track.applyConstraints(newConstraints);
		console.log('Successfully applied video constraints');
	} catch (_err) {
		console.warn('Unable to apply video constraints');
	}

	document.body.style.cursor = 'auto';

	const newSettings = track.getSettings();

	console.log(`Stream Details: ${JSON.stringify(newSettings, null, 2)}`);
	dom.results.textContent = JSON.stringify(sanitizeData(newSettings), null, 2);

	Object.entries(newSettings).forEach(([key, value]) => {
		const td = document.querySelector(`#${key} .value`);
		if (td) {
			td.textContent = value;
		}
	});

	document.querySelector(
		`#width_height .value`
	).textContent = `${newSettings.width} x ${newSettings.height}`;
}

async function updateDeviceDetails(stream) {
	const track = stream.getVideoTracks()[0];
	const settings = track.getSettings();
	const capabilities = track.getCapabilities?.() || null;

	console.log(`Stream Details: ${JSON.stringify(settings, null, 2)}`);
	console.log(`Stream Capabilities: ${JSON.stringify(capabilities, null, 2)}`);

	const rows = CAPABILITY_KEYS.map(key => {
		const tr = document.createElement('tr');

		tr.id = key;

		const item = document.createElement('td');
		const range = document.createElement('td');
		const value = document.createElement('td');
		const controls = document.createElement('td');

		item.classList.add('item');
		range.classList.add('range');
		value.classList.add('value');
		controls.classList.add('controls');

		item.textContent = key;

		if (key === 'width_height') {
			range.textContent =
				'width: ' +
				JSON.stringify(capabilities.width, null, 2) +
				'\nheight: ' +
				JSON.stringify(capabilities.height, null, 2);

			const widthHeightRegex = /^((\?|[1-9]\d*)\s*x\s*(\?|[1-9]\d*))?$/;
			const text = document.createElement('input');
			text.type = 'text';
			value.textContent = text.value = `${settings.width} x ${settings.height}`;
			text.addEventListener('change', () => {
				const valid = widthHeightRegex.test(text.value) || !text.value;
				button.disabled = !valid;
			});

			const button = document.createElement('button');
			button.classList.add('button');
			button.textContent = 'Try apply';
			button.addEventListener('click', () => {
				const m = text.value.match(widthHeightRegex);
				updateConstraints({
					width: m[2] === '?' ? null : m[2], // may be undefined - which is OK
					height: m[3] === '?' ? null : m[3], // may be undefined - which is OK
				});
			});

			const br1 = document.createElement('br');
			const br2 = document.createElement('br');
			const notice = document.createElement('span');
			notice.textContent =
				'Use `?` for either width or height (or both) to NOT specify the constraint';

			controls.replaceChildren(text, button, br1, br2, notice);
		} else if (!Object.prototype.hasOwnProperty.call(capabilities, key)) {
			return null;
		} else {
			range.textContent = JSON.stringify(capabilities[key], null, 2);

			const text = document.createElement('input');
			text.type = 'text';
			value.textContent = text.value = settings[key];
			text.addEventListener('change', () => {
				const valid = /^[1-9]\d*(\.\d*)?$/.test(text.value) || !text.value;
				button.disabled = !valid;
			});

			const button = document.createElement('button');
			button.classList.add('button');
			button.textContent = 'Try apply';
			button.addEventListener('click', () => {
				updateConstraints({ [key]: parseFloat(text.value) });
			});

			controls.replaceChildren(text, button);
		}

		tr.replaceChildren(item, range, value, controls);

		return tr;
	});

	dom.tbody.replaceChildren(...rows.filter(v => v));
}

const SMOOTHING_FACTOR = 1 / 15;

let frameTrackerCallbackId = null;

async function trackFramerate() {
	dom.video.cancelVideoFrameCallback(frameTrackerCallbackId);

	let lastTime = performance.now();
	let currentFrameMs = null;
	let firstTick = true; // ignore firstTick

	const tick = () => {
		const now = performance.now();
		const elapsed = now - lastTime;

		lastTime = now;
		frameTrackerCallbackId = dom.video.requestVideoFrameCallback(tick);

		if (firstTick) {
			firstTick = false;
			return;
		}

		if (currentFrameMs === null) {
			currentFrameMs = elapsed;
		} else {
			currentFrameMs =
				SMOOTHING_FACTOR * elapsed + (1 - SMOOTHING_FACTOR) * currentFrameMs;
		}

		dom.effective_frame_rate.textContent = (1000 / currentFrameMs).toFixed(4);
	};

	frameTrackerCallbackId = dom.video.requestVideoFrameCallback(tick);
}

async function playDeviceVanilla() {
	const device_id = dom.devices.value;

	if (!device_id) return;

	lastConstraints = {
		audio: false,
		video: {
			deviceId: { exact: device_id },
		},
	};

	const stream = await navigator.mediaDevices.getUserMedia(lastConstraints);

	dom.video.srcObject = stream;
	dom.video.play();

	updateDeviceDetails(stream);
	updateConstraints({}, false);
	trackFramerate();
}

(async function run() {
	dom.devices.addEventListener('change', playDeviceVanilla);

	populateDevices();
})();
