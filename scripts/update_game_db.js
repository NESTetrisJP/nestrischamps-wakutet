import { correctGames } from '../modules/game_corrector.js';

(async () => {
	await correctGames(
		`player_id=1000 and tetris_rate = 'NaN'::double precision`
	);
})();
