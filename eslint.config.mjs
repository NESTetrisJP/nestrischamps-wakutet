import { defineConfig } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

const rules = {
	'no-unused-vars': [
		'error',
		{
			varsIgnorePattern: '^_',
			argsIgnorePattern: '^_',
			caughtErrorsIgnorePattern: '^_',
		},
	],
	'no-empty': ['error', { allowEmptyCatch: true }],
};

export default defineConfig([
	// Global ignores for external files
	{
		ignores: [
			'public/vendor/**',
			'public/emu/**',
			'public/views/stackrabbit/wasmRabbit.js',
		],
	},
	// Backend config
	{
		ignores: ['public/**'],
		extends: compat.extends(
			'eslint:recommended',
			'plugin:jest/recommended',
			'prettier'
		),

		languageOptions: {
			globals: {
				...Object.fromEntries(
					Object.entries(globals.browser).map(([key]) => [key, 'off'])
				),
				...globals.node,
				...globals.commonjs,
			},

			ecmaVersion: 2022,
			sourceType: 'module',
		},

		rules,
	},

	// Frontend config
	{
		files: ['public/**'],
		ignores: [
			'public/vendor/**',
			'public/emu/**', // TODO: split better imported files versus NTC-owned files
			'public/views/stackrabbit/wasmRabbit.js',
		],
		extends: compat.extends(
			'eslint:recommended',
			'plugin:jest/recommended',
			'prettier'
		),
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.commonjs,

				// webGPU and Media API support
				GPUShaderStage: 'readonly',
				GPUBufferUsage: 'readonly',
				GPUTextureUsage: 'readonly',
				GPUMapMode: 'readonly',
				MediaStreamTrackProcessor: 'readonly',

				// emu constants
				importScripts: 'readonly',
				KEY_A: 'readonly',
				KEY_B: 'readonly',
				KEY_SELECT: 'readonly',
				KEY_START: 'readonly',
				KEY_UP: 'readonly',
				KEY_DOWN: 'readonly',
				KEY_LEFT: 'readonly',
				KEY_RIGHT: 'readonly',
				BUTTON_MAPPING: 'readonly',
				DIRECTION_MAPPING: 'readonly',
				process: 'readonly',
				__dirname: 'readonly',

				// vendor classes
				Peer: 'readonly',
				_: 'readonly',

				// NTC constants used in many views... (should be imported explicitly -_-)
				TILE_ID_TO_NTC_BLOCK_ID: 'readonly',
				NUM_HIGH_SCORES: 'readonly',
				DOT_SIZE_TRT: 'readonly',
				DOT_SIZE_PIECE_DISTRIBUTION: 'readonly',
				BAR_WIDTH_DROUGHT_GAUGE: 'readonly',
				BAR_WIDTH_INSTANT_DAS: 'readonly',
				DOT_SIZE_DAS_N_BOARD: 'readonly',
				BOARD_HEIGHT_BLOCK_HEIGHT: 'readonly',
				BOARD_HEIGHT_STAT_BARS_GAP: 'readonly',
				BOARD_PIXEL_SIZE: 'readonly',
				PREVIEW_PIXEL_SIZE: 'readonly',
			},

			ecmaVersion: 2022,
			sourceType: 'module',
		},

		rules,
	},
]);
