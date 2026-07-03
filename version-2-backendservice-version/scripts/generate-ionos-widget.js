const fs = require('fs');
const path = require('path');

const vercelUrl = (process.env.VERCEL_WIDGET_URL || 'https://meinsterbegeldvergleich.vercel.app').replace(/\/$/, '');
const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'index.html');
const stylesPath = path.join(rootDir, 'styles.css');
const scriptPath = path.join(rootDir, 'script.js');
const targetDir = path.join(rootDir, 'ionos-widget');
const targetPath = path.join(targetDir, 'widget.html');

let html = fs.readFileSync(sourcePath, 'utf8');
const css = fs.readFileSync(stylesPath, 'utf8');
const js = fs.readFileSync(scriptPath, 'utf8');

html = html.replace(
  '<link rel="stylesheet" href="./styles.css">',
  `<style>\n${css}\n</style>`
);

html = html.replace(
  '<script src="./script.js" defer></script>',
  `<script>window.STERBEGELD_API_URL = "${vercelUrl}/api/lead";</script>\n<script>\n${js}\n</script>`
);

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(targetPath, html);

console.log(`Generated ${path.relative(rootDir, targetPath)} using ${vercelUrl}`);
