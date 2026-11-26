// bundle-web.mjs // derive the app's web bundle (native/www) from the maintained web/ folder.
//
// The bundle is a copy, never an edit: every file taken from web/ is byte-identical to its
// source, so the app cannot acquire a second hand-maintained maze. The step adds only files
// the app needs and web/ does not carry: the pinned Capacitor core runtime, the license texts
// of the repository and of that runtime, and bundle.json, which records where every file came
// from. Run it from native/ (npm run bundle); `npm run sync` also copies the result into the
// Xcode project.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const nativeDir = join(here, '..');
const repoDir = join(nativeDir, '..');
const webDir = join(repoDir, 'web');
const outDir = join(nativeDir, 'www');

// web/ files the app does not use at run time: checks, docs, hosting files and the link-preview card.
const SKIP = new Set(['checks', 'README.md', 'VENDOR.md', 'vercel.json', '.vercelignore', 'og-image.jpg', '.DS_Store']);

// Files the app needs that web/ does not carry: [bundle path, source path].
const core = join(nativeDir, 'node_modules', '@capacitor', 'core');
const ADDED = [
  ['native/capacitor.js', join(core, 'dist', 'capacitor.js')],
  ['licenses/capacitor/LICENSE', join(core, 'LICENSE')],
  ['licenses/mazes-ASK/LICENSE', join(repoDir, 'LICENSE')],
  ['licenses/mazes-ASK/NOTICE', join(repoDir, 'NOTICE')]
];

function sha256(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
function posix(p) { return p.split(sep).join('/'); }

function walk(dir, list = []) {
  for (const name of readdirSync(dir).sort()) {
    if (SKIP.has(name) && dir === webDir) continue;
    if (name === '.DS_Store') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, list); else list.push(path);
  }
  return list;
}

function git(args) {
  try { return execFileSync('git', ['-C', repoDir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

if (!existsSync(join(webDir, 'index.html'))) throw new Error('web/index.html not found beside native/');
for (const [, source] of ADDED) if (!existsSync(source)) throw new Error('missing ' + source + ' (run npm install in native/ first)');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const files = [];
for (const source of walk(webDir)) {
  const path = posix(relative(webDir, source));
  const target = join(outDir, path);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target);
  files.push({ path, from: 'web/' + path });
}
for (const [path, source] of ADDED) {
  const target = join(outDir, path);
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target);
  files.push({ path, from: posix(relative(repoDir, source)) });
}

// Every bundled file must equal its source byte for byte.
for (const f of files) {
  const a = sha256(join(outDir, f.path));
  const b = sha256(join(repoDir, f.from));
  if (a !== b) throw new Error('copy differs from its source: ' + f.path);
  f.bytes = statSync(join(outDir, f.path)).size;
  f.sha256 = a;
}

const commit = git(['rev-parse', 'HEAD']);
const dirty = commit ? git(['status', '--porcelain', '--', 'web', 'LICENSE', 'NOTICE']) !== '' : null;
const corePackage = JSON.parse(readFileSync(join(core, 'package.json'), 'utf8'));
const record = {
  format: 'mazes-ASK/native-bundle',
  version: 1,
  source: { commit, uncommittedChanges: dirty },
  capacitorCore: corePackage.version,
  files: files.sort((x, y) => (x.path < y.path ? -1 : 1))
};
writeFileSync(join(outDir, 'bundle.json'), JSON.stringify(record, null, 2) + '\n');
const total = files.reduce((n, f) => n + f.bytes, 0);
console.log('native/www: ' + files.length + ' files, ' + total + ' bytes, from ' + (commit || 'no git commit') + (dirty ? ' with uncommitted changes' : ''));
