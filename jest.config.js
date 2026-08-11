export default {
	testEnvironment: 'node',
	moduleNameMapper: {
		'^/js/(.*)$': '<rootDir>/public/js/$1',
		'^/views/(.*)$': '<rootDir>/public/views/$1',
	},
	transform: {}, // tell jest not to transpile, we are using ESM natively
};
