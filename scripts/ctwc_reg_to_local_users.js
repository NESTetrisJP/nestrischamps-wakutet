// Script is based on the CTWC 2025 Registration sheet
// 1. Publish Sheet 1 to Web as CSV
// 2. enter the sheet csv url as a new variable CSV_URL in your .env file
// 5. run script as:
// npm run ctwc-ingest

import { importUsers } from '../modules/LocalUsers.js';

(async () => {
	await importUsers({ clearOldUsers: true });
})();
