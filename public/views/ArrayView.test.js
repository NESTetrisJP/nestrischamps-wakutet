import ArrayView from './ArrayView.js';

describe('ArrayView', () => {
	it('should create an ArrayView correctly', () => {
		const source = [1, 2, 3, 4, 5];
		const view = new ArrayView(source, 1, 3);
		expect(view.length).toBe(3);
		expect(view.at(0)).toBe(2);
		expect(view.at(1)).toBe(3);
		expect(view.at(2)).toBe(4);
	});

	it('should act as a proxy for index access', () => {
		const source = [10, 20, 30, 40];
		const view = new ArrayView(source, 1, 2);
		expect(view[0]).toBe(20);
		expect(view[1]).toBe(30);
		expect(view[2]).toBeUndefined();
	});

	it('should correctly implement find', () => {
		const source = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const view = new ArrayView(source, 1, 2); // [{id:2}, {id:3}]
		const result = view.find(item => item.id === 3);
		expect(result).toEqual({ id: 3 });

		const notFound = view.find(item => item.id === 1);
		expect(notFound).toBeUndefined();
	});

	it('should correctly implement filter', () => {
		const source = [1, 2, 3, 4, 5, 6];
		const view = new ArrayView(source, 1, 4); // [2, 3, 4, 5]
		const result = view.filter(val => val % 2 === 0);
		expect(result).toEqual([2, 4]);
	});

	it('should correctly implement every', () => {
		const source = [1, 2, 3, 5, 7];
		const view = new ArrayView(source, 1, 4); // [2, 3, 5, 7]
		expect(view.every(val => val > 1)).toBe(true);
		expect(view.every(val => val > 2)).toBe(false);
	});

	it('should correctly implement some', () => {
		const source = [1, 2, 3, 5, 7];
		const view = new ArrayView(source, 1, 4); // [2, 3, 5, 7]
		expect(view.some(val => val === 5)).toBe(true);
		expect(view.some(val => val === 1)).toBe(false);
	});

	it('should throw an error on mutation attempts', () => {
		const view = new ArrayView([1, 2, 3]);
		expect(() => {
			view[0] = 5;
		}).toThrow('Forbidden: ArrayView instances are immutable');
		expect(() => {
			view.push(4);
		}).toThrow('Forbidden (push): ArrayView instances are immutable');
	});

	it('should correctly implement slice', () => {
		const source = [1, 2, 3, 4, 5];
		const view = new ArrayView(source, 1, 4); // [2, 3, 4, 5]
		expect(view.slice(1, 3)).toEqual([3, 4]);
		expect(view.slice(-2)).toEqual([4, 5]);
	});

	it('should correctly implement includes', () => {
		const source = [1, 2, 3, 4, 5];
		const view = new ArrayView(source, 1, 4); // [2, 3, 4, 5]
		expect(view.includes(3)).toBe(true);
		expect(view.includes(1)).toBe(false);
		expect(view.includes(3, 2)).toBe(false); // search starts from idx 2 (value 4)
	});

	it('should correctly bind thisArg in find and filter', () => {
		const source = [1, 2, 3, 4, 5];
		const view = new ArrayView(source, 1, 4); // [2, 3, 4, 5]
		const ctx = { threshold: 3 };

		const resultFilter = view.filter(function (val) {
			return val > this.threshold;
		}, ctx);
		expect(resultFilter).toEqual([4, 5]);

		const resultFind = view.find(function (val) {
			return val > this.threshold;
		}, ctx);
		expect(resultFind).toEqual(4);
	});
});
