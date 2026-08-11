import QueryString from '/js/QueryString.js';

import { CpuTetrisOCR } from './cpuTetrisOCR.js';
import { WGpuTetrisOCR } from './webgpu/wgpuTetrisOCR.js';
import { WGlTetrisOCR } from './webgl/wglTetrisOCR.js';

const force_ocr_mode = (value => {
	return /^(wgpu|wgl|cpu)$/.test(value) ? value : null;
})(QueryString.get('ocr'));

function hasWebGL2({ allowSoftware = true } = {}) {
	try {
		const canvas =
			typeof OffscreenCanvas !== 'undefined'
				? new OffscreenCanvas(1, 1)
				: document.createElement('canvas');

		const attrs = {
			alpha: true,
			premultipliedAlpha: true,
			powerPreference: 'high-performance',
			failIfMajorPerformanceCaveat: !allowSoftware,
		};
		return !!canvas.getContext('webgl2', attrs);
	} catch {
		return false;
	}
}

// webgpu probe for external textures
async function supportsExternalTextures(device) {
	// 1) Fast path, reliable on Chrome/Edge
	if (device.features?.has?.('chromium-experimental-external-texture')) {
		return true;
	}

	// 2) Probe under a validation error scope
	device.pushErrorScope('validation');
	try {
		device.createBindGroupLayout({
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.FRAGMENT,
					externalTexture: {},
				},
			],
		});
		const err = await device.popErrorScope();
		return err === null;
	} catch {
		await device.popErrorScope();
		return false;
	}
}

async function hasWebGPU() {
	const adapter = await navigator.gpu?.requestAdapter();
	if (!adapter) return false;

	let device;
	try {
		device = await adapter.requestDevice();
		if (!device) return false;

		return supportsExternalTextures(device);
	} catch {
		// do nothing
	} finally {
		device?.destroy?.();
	}

	return false;
}

async function doGetOcrClass() {
	// force_ocr_mode has precedence
	switch (force_ocr_mode) {
		case 'wgpu':
			return WGpuTetrisOCR;
		case 'wgl':
			return WGlTetrisOCR;
		case 'cpu':
			return CpuTetrisOCR;
	}

	// if no force_ocr_mode matched, use precendence rules below:
	if (await hasWebGPU()) {
		return WGpuTetrisOCR;
	}

	if (hasWebGL2()) {
		return WGlTetrisOCR;
	}

	return CpuTetrisOCR;
}

const getOcrClassPromise = doGetOcrClass(); // no await, shared promise

export async function getOcrClass() {
	return await getOcrClassPromise;
}

export async function createOCRInstance(config) {
	const klass = await getOcrClass();

	return new klass(config);
}
