const fs = require('fs');
const path = require('path');

const vercelUrl = (process.env.VERCEL_WIDGET_URL || 'https://meinsterbegeldvergleich.vercel.app').replace(/\/$/, '');
const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'index.html');
const targetDir = path.join(rootDir, 'ionos-widget');
const targetPath = path.join(targetDir, 'widget.html');

let html = fs.readFileSync(sourcePath, 'utf8');

html = html.replace(
  '<link rel="stylesheet" href="./styles.css">',
  `<link rel="stylesheet" href="${vercelUrl}/styles.css">`
);

html = html.replaceAll('src="./media/', `src="${vercelUrl}/media/`);

html = html.replace(
  '<script src="./script.js" defer></script>',
  `<script>window.STERBEGELD_API_URL = "${vercelUrl}/api/lead";</script>\n<script src="${vercelUrl}/script.js" defer></script>`
);

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(targetPath, html);

console.log(`Generated ${path.relative(rootDir, targetPath)} using ${vercelUrl}`);
