import pg from 'pg';
import config from './config.js';

let pool;

const isPublicServer = config.get('server.is_public');
const dbUrl = config.get('db.url');

console.log(`DB initialization`, {
	IS_PUBLIC_SERVER: isPublicServer,
});

if (dbUrl) {
	pool = new pg.Pool({
		connectionString: dbUrl,
		ssl: {
			rejectUnauthorized: false, // isPublicServer,
		},
	});

	// the pool will emit an error on behalf of any idle clients
	// it contains if a backend error or network partition happens
	pool.on('error', err => {
		console.error('DB: Unexpected error on idle client', err);
	});
} else {
	console.warn('DATABASE_URL not specified. Using a minimal mock.');

	const sessions = new Map();

	const query = (str, data) => {
		const rows = [];

		switch (str) {
			case `INSERT INTO "sessions" (sess, expire, sid) SELECT $1, to_timestamp($2), $3 ON CONFLICT (sid) DO UPDATE SET sess=$1, expire=to_timestamp($2) RETURNING sid`:
				sessions.set(data[2], { sess: data[0], expire: data[1] });
				break;
			case `SELECT sess FROM "sessions" WHERE sid = $1 AND expire >= to_timestamp($2)`:
				const session = sessions.get(data[0]);
				if (session != null) {
					rows.push({ sess: session.sess });
				}
				break;
			case `UPDATE "sessions" SET expire = to_timestamp($1) WHERE sid = $2 RETURNING sid`:
				break;
			case `DELETE FROM "sessions" WHERE sid = $1`:
				sessions.delete(data[0]);
				break;
			case `SELECT * FROM users WHERE id=$1`:
				rows.push({
					id: data[0],
					login: `player${data[0]}`,
					email: `player${data[0]}@nestrischamps.io`,
					secret: `PLAYER${data[0]}`,
					display_name: `player${data[0]}`,
				});
				break;
			default:
				console.warn(`Query not implemented: ${str}`);
				console.warn(data);
				break;
		}

		return Promise.resolve({ rows });
	};

	pool = {
		connect: () =>
			Promise.resolve({
				query: (...args) => query(...args),
			}),
		query: (...args) => query(...args),
	};
}

export default pool;
