import BaseGame from '../public/views/BaseGame.js';
import BinaryFrame from '../public/js/BinaryFrame.js';

describe('BaseGame', () => {
	let game;

	beforeEach(() => {
		game = new BaseGame();
	});

	it('should correctly initialize with the first frame', () => {
		const startFrame = {
			gameid: 1,
			ctime: 1000,
			game_type: BinaryFrame.GAME_TYPE.CLASSIC,
			level: 18,
			lines: 0,
			score: 0,
			field: Array(200).fill(0),
		};

		game.setFrame(startFrame);

		expect(game.data.start_level).toBe(18);
		expect(game.data.lines).toBe(0);
		expect(game.data.score.current).toBe(0);
		expect(game.over).toBe(false);
		expect(game.duration).toBe(0);
	});

	it('should ignore frames where critical values are null', () => {
		const nullFrame = { score: null, lines: null, level: null };
		game.setFrame(nullFrame);

		expect(game.data).toBeNull();
	});

	it('should calculate points and lines correctly upon clears', () => {
		const startFrame = {
			gameid: 1,
			ctime: 1000,
			game_type: BinaryFrame.GAME_TYPE.CLASSIC,
			level: 18,
			lines: 0,
			score: 0,
			field: Array(200).fill(0),
		};
		game.setFrame(startFrame);

		// Frame with a single
		const singleFrame = {
			gameid: 1,
			ctime: 2000,
			game_type: BinaryFrame.GAME_TYPE.CLASSIC,
			level: 18,
			lines: 1,
			score: 40 * 19,
			field: Array(200).fill(0),
		};
		game.pieces.push({}); // Mock a falling piece to attach the clear event to
		// Send twice to bypass the 2-frame OCR stabilization logic
		game.setFrame(singleFrame);
		game.setFrame(singleFrame);

		expect(game.data.lines).toBe(1);
		expect(game.data.score.current).toBe(40 * 19);
		expect(game.data.clears[1].count).toBe(1);

		// Frame with a tetris
		const tetrisFrame = {
			gameid: 1,
			ctime: 3000,
			game_type: BinaryFrame.GAME_TYPE.CLASSIC,
			level: 18,
			lines: 5,
			score: 40 * 19 + 1200 * 19,
			field: Array(200).fill(0),
		};
		game.pieces.push({}); // Mock another falling piece
		game.setFrame(tetrisFrame);
		game.setFrame(tetrisFrame);

		expect(game.data.lines).toBe(5);
		expect(game.data.score.current).toBe(40 * 19 + 1200 * 19);
		expect(game.data.clears[4].count).toBe(1);
	});

	it('should track transitions correctly', () => {
		const startFrame = {
			gameid: 1,
			ctime: 1000,
			game_type: BinaryFrame.GAME_TYPE.CLASSIC,
			level: 18,
			lines: 120,
			score: 500000,
			field: Array(200).fill(0),
		};
		game.setFrame(startFrame);

		expect(game.data.score.transition).toBeNull();

		// Frame that pushes through the 130 line transition (18 -> 19)
		const transitionFrame = {
			gameid: 1,
			ctime: 4000,
			game_type: BinaryFrame.GAME_TYPE.CLASSIC,
			level: 19,
			lines: 132,
			score: 550000,
			field: Array(200).fill(0),
		};

		game.pieces.push({}); // Mock falling piece
		game.setFrame(transitionFrame);
		game.setFrame(transitionFrame);

		expect(game.data.level).toBe(19);
		expect(game.data.score.transition).toBe(550000); // transition locks the score at the transition
	});

	it('should end the game upon curtain drop (full field)', () => {
		const startFrame = {
			gameid: 1,
			ctime: 1000,
			game_type: BinaryFrame.GAME_TYPE.CLASSIC,
			level: 18,
			lines: 0,
			score: 0,
			field: Array(200).fill(0),
		};
		game.setFrame(startFrame);

		// Simulate the curtain dropping (topout), where the field is filled with blocks
		const deadFrame = {
			gameid: 1,
			ctime: 5000,
			game_type: BinaryFrame.GAME_TYPE.CLASSIC,
			level: 18,
			lines: 0,
			score: 0,
			field: Array(200).fill(1), // filled
		};

		game.setFrame(deadFrame);

		expect(game.over).toBe(true);
	});
});
