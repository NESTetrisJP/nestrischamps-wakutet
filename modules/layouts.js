import fs from 'fs';
import { globSync } from 'glob';

const datadogRUMViewSnippet = `
<script src="https://www.datadoghq-browser-agent.com/us1/v4/datadog-rum.js" type="text/javascript"></script>
<script>
window.DD_RUM && window.DD_RUM.init({
  clientToken: 'pubc59962a6065abb8b530083bf912fa444',
  applicationId: '5835e801-4ec9-45d0-94cb-d3d9f30f97fd',
  site: 'datadoghq.com',
  service: 'nestrischamps-view',
  env: 'production',
  version: '1.0.0',
  sessionSampleRate: 100,
  sessionReplaySampleRate: 0,
  trackUserInteractions: /\\/replay\\//.test(document.location.pathname),
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'allow',
});

window.DD_RUM &&
window.DD_RUM.startSessionReplayRecording();
</script>`;

const layouts = {
	_types: {
		'1p': [],
		'mp': [],
	},
};

function byFilename(a, b) {
	return a.file > b.file ? 1 : -1;
}

const start = Date.now();

// Layout directory is local checkout so it's controlled by us
// we assume the files therein are correct with these 2 rules:
// 1) every jpg MUST have a html layout for it
// 2) html layouts may not have any jpg
//
// NOTE: If we have trust issue on the directory, after collecting files via glob,
// the structures should be inspected for cleanliness

['1p', 'mp'].forEach(type => {
	globSync(`public/views/${type}/*.*`).forEach(filename => {
		const file = filename.split(/[\\/]/).pop().split('.')[0];

		let layout_data = layouts[file];

		if (!layout_data) {
			layout_data = {
				file,
				type,
				info: null,
				screenshot_uris: [],
			};

			layouts[file] = layout_data;
			layouts._types[type].push(layout_data);
		}

		if (/\.jpg$/.test(filename)) {
			layout_data.screenshot_uris.push(filename.replace(/^public\//, ''));
		} else if (/\.json$/.test(filename)) {
			try {
				layout_data.info = JSON.parse(fs.readFileSync(filename));
			} catch (err) {
				// ignore
			}
		}
	});

	layouts._types[type].forEach(data => data.screenshot_uris.sort());
	layouts._types[type].sort(byFilename);
});

// step 2, inject datadog RUM tracking code into all layouts
// That's not done in the glob work above, to make sure the file iteration is not affected
//
// Warning: Adding the DD RUM config entries should be a build step rather than a bootstrap step
// For local dev, the layouts files get changed, which pollutes the git status
//
// Hardcoding everything for now just for speed in getting something to look at.
// TODO: look at Heroku Build Packs: https://www.heroku.com/elements/buildpacks,
// or look at deploying via a github action, see https://github.com/marketplace/actions/deploy-to-heroku
for (const [name, layout] of Object.entries(layouts)) {
	const path = `public/views/${layout.type}/${layout.file}.html`;

	try {
		const content = fs.readFileSync(path).toString();
		if (/www\.datadoghq-browser-agent\.com/.test(content)) continue; // don't double inject
		fs.writeFileSync(
			path,
			content.replace('<head>', `<head>${datadogRUMViewSnippet}`)
		);
	} catch (err) {
		console.error(
			`Unable to inject DD RUM into [${name}]--${layout.file}.html: ${err.message}`
		);
	}
}

const elapsed = Date.now() - start;

console.log(`Populated layouts data from filesystem in ${elapsed} ms.`);

export default layouts;
