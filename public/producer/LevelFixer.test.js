import LevelFixer from './LevelFixer.js';

describe('LevelFixer', () => {
	let fixer;

	beforeEach(() => {
		fixer = new LevelFixer();
	});

	it('should return null when input is null', () => {
		expect(fixer.fix(null)).toBeNull();
	});

	it('should store initial digits and return them without modification', () => {
		const result = fixer.fix([0x1, 0x8]);
		expect(result).toEqual([0x1, 0x8]);
		expect(fixer.last_good_digits).toEqual([0x1, 0x8]);
	});

	it('should reset last_good_digits when reset() is called', () => {
		fixer.fix([0x2, 0x0]);
		fixer.reset();
		expect(fixer.last_good_digits).toBeNull();
	});

	it('should fix 00 to 30 if last good was in the 20s or 30s', () => {
		fixer.fix([0x2, 0x9]);
		expect(fixer.fix([0x0, 0x0])).toEqual([0x3, 0x0]); // 30

		fixer.fix([0x3, 0x2]);
		expect(fixer.fix([0x0, 0x0])).toEqual([0x3, 0x0]); // 30
	});

	it('should fix 0A/04 to 31 if last good was in the 30s, otherwise default to x4', () => {
		fixer.fix([0x3, 0x0]);
		expect(fixer.fix([0x0, 0xa])).toEqual([0x3, 0x1]); // 31

		fixer.fix([0x0, 0x3]);
		expect(fixer.fix([0x0, 0xa])).toEqual([0x0, 0x4]); // 04
	});

	it('should fix 06 to 54 if last good was in the 50s', () => {
		fixer.fix([0x5, 0x3]);
		expect(fixer.fix([0x0, 0x6])).toEqual([0x5, 0x4]);
	});

	it('should fix 1E to 33', () => {
		fixer.fix([0x3, 0x2]);
		expect(fixer.fix([0x1, 0xe])).toEqual([0x3, 0x3]);
	});

	it('should fix 14/1A to 32 if last good was in the 30s, otherwise default to x4', () => {
		fixer.fix([0x3, 0x1]);
		expect(fixer.fix([0x1, 0xa])).toEqual([0x3, 0x2]);

		fixer.fix([0x1, 0x3]);
		expect(fixer.fix([0x1, 0x4])).toEqual([0x1, 0x4]);
	});

	it('should fix 28/2B to 34 if last good was in the 30s, otherwise default to x8', () => {
		fixer.fix([0x3, 0x3]);
		expect(fixer.fix([0x2, 0xb])).toEqual([0x3, 0x4]);

		fixer.fix([0x2, 0x7]);
		expect(fixer.fix([0x2, 0x8])).toEqual([0x2, 0x8]);
	});

	it('should fix 20 to 51 or 53 if last good was in the 50s', () => {
		fixer.last_good_digits = [0x5, 0x0];
		expect(fixer.fix([0x2, 0x0])).toEqual([0x5, 0x1]);

		fixer.last_good_digits = [0x5, 0x2];
		expect(fixer.fix([0x2, 0x0])).toEqual([0x5, 0x3]);
	});

	it('should fix 21 to 61 if last good was in the 60s', () => {
		fixer.fix([0x6, 0x0]);
		expect(fixer.fix([0x2, 0x1])).toEqual([0x6, 0x1]);
	});

	it('should fix 21 to 55, 57, 59 if last good was in the 50s', () => {
		fixer.last_good_digits = [0x5, 0x4];
		expect(fixer.fix([0x2, 0x1])).toEqual([0x5, 0x5]);

		fixer.last_good_digits = [0x5, 0x6];
		expect(fixer.fix([0x2, 0x1])).toEqual([0x5, 0x7]);

		fixer.last_good_digits = [0x5, 0x8];
		expect(fixer.fix([0x2, 0x1])).toEqual([0x5, 0x9]);
	});

	it('should fix 26 to 56 if last good was in the 50s', () => {
		fixer.fix([0x5, 0x5]);
		expect(fixer.fix([0x2, 0x6])).toEqual([0x5, 0x6]);
	});

	it('should unconditionally perform static byte fixes', () => {
		fixer.fix([0x0, 0x0]); // populate last_good_digits initially
		expect(fixer.fix([0x3, 0x2])).toEqual([0x3, 0x5]); // 32 -> 35
		expect(fixer.fix([0x3, 0xc])).toEqual([0x3, 0x6]); // 3C -> 36
		expect(fixer.fix([0xa, 0x0])).toEqual([0x4, 0x6]); // A0 -> 46
		expect(fixer.fix([0xa, 0xa])).toEqual([0x4, 0x7]); // AA -> 47
		expect(fixer.fix([0x5, 0x0])).toEqual([0x3, 0x8]); // 50 -> 38
		expect(fixer.fix([0x5, 0xa])).toEqual([0x3, 0x9]); // 5A -> 39
		expect(fixer.fix([0x6, 0xe])).toEqual([0x4, 0x1]); // 6E -> 41
		expect(fixer.fix([0x6, 0x6])).toEqual([0x6, 0x0]); // 66 -> 60
		expect(fixer.fix([0x6, 0x4])).toEqual([0x4, 0x0]); // 64 -> 40
		expect(fixer.fix([0x7, 0x8])).toEqual([0x4, 0x2]); // 78 -> 42
		expect(fixer.fix([0x8, 0x2])).toEqual([0x4, 0x3]); // 82 -> 43
		expect(fixer.fix([0xb, 0x6])).toEqual([0x6, 0x2]); // 86/B6 -> 62
		expect(fixer.fix([0x8, 0xc])).toEqual([0x4, 0x4]); // 8C -> 44
		expect(fixer.fix([0xb, 0xe])).toEqual([0x4, 0x8]); // BE -> 48
		expect(fixer.fix([0x8, 0x4])).toEqual([0x4, 0x9]); // 84/B4 -> 49
		expect(fixer.fix([0x9, 0x6])).toEqual([0x4, 0x5]); // 96 -> 45
		expect(fixer.fix([0xc, 0x6])).toEqual([0x5, 0x0]); // C6 -> 50
		expect(fixer.fix([0xe, 0x6])).toEqual([0x5, 0x2]); // E6 -> 52
	});

	it('should fix second digit if it is impossible A or B', () => {
		fixer.fix([0x0, 0x0]);
		expect(fixer.fix([0x1, 0xa])).toEqual([0x1, 0x4]); // 1A -> 14
		expect(fixer.fix([0x1, 0xb])).toEqual([0x1, 0x8]); // 1B -> 18
	});

	it('should fix 46 to 37 or 58 depending on last good digits', () => {
		fixer.last_good_digits = [0x3, 0x6];
		expect(fixer.fix([0x4, 0x6])).toEqual([0x3, 0x7]);

		fixer.last_good_digits = [0x5, 0x7];
		expect(fixer.fix([0x4, 0x6])).toEqual([0x5, 0x8]);
	});

	it('should not throw on unmapped values and return them unmodified (mostly)', () => {
		fixer.fix([0x1, 0x1]);
		expect(fixer.fix([0x2, 0x2])).toEqual([0x2, 0x2]); // 22 doesn't have a specific map, should stay 22
	});
});
