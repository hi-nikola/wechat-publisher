import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';

export function resolveCli(explicit) {
  if (explicit) {
    const result = path.resolve(explicit);
    if (!fs.statSync(result).isFile()) throw new Error('Invalid wenyan cli.js path.');
    return result;
  }
  const candidates = [
    path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData/Roaming'), 'npm/node_modules/@wenyan-md/cli/dist/cli.js'),
    path.resolve(process.execPath, '../node_modules/@wenyan-md/cli/dist/cli.js'),
    path.resolve(process.execPath, '../../lib/node_modules/@wenyan-md/cli/dist/cli.js'),
  ];
  const npmCli = path.resolve(process.execPath, '../node_modules/npm/bin/npm-cli.js');
  if (fs.existsSync(npmCli)) {
    const result = spawnSync(process.execPath, [npmCli, 'root', '-g'], {encoding:'utf8', timeout:10000});
    if (!result.error && result.status === 0)
      candidates.unshift(path.join(result.stdout.trim(), '@wenyan-md/cli/dist/cli.js'));
  } else if (process.platform !== 'win32') {
    const result = spawnSync('npm', ['root', '-g'], {encoding:'utf8', timeout:10000});
    if (!result.error && result.status === 0)
      candidates.unshift(path.join(result.stdout.trim(), '@wenyan-md/cli/dist/cli.js'));
  }
  const result = candidates.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!result) throw new Error('Install @wenyan-md/cli globally, or pass its cli.js path.');
  return result;
}

export function parseArticle(file, cli) {
  const source = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const match = source.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match) throw new Error('Publishing requires YAML frontmatter with title and cover.');
  const require = createRequire(cli);
  const meta = require('js-yaml').load(match[1]);
  for (const key of ['title', 'cover']) {
    if (typeof meta?.[key] !== 'string' || !meta[key].trim())
      throw new Error(`Publishing requires a nonempty ${key} string.`);
  }
  const cover = meta.cover.trim();
  if (!/^https?:\/\//i.test(cover)) {
    const coverPath = path.resolve(path.dirname(file), cover);
    if (!fs.existsSync(coverPath) || !fs.statSync(coverPath).isFile())
      throw new Error('Cover must be an existing file (relative to the Markdown file).');
  }
  return meta;
}

export function distinctPaths(...files) {
  const canonical = p => {
    const full = path.resolve(p);
    const resolved = fs.existsSync(full) ? fs.realpathSync(full) : path.join(fs.realpathSync(path.dirname(full)), path.basename(full));
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  };
  const normalized = files.map(canonical);
  if (new Set(normalized).size !== normalized.length) throw new Error('Input, preview and fragment paths must be different.');
  const stats = files.filter(fs.existsSync).map(p=>fs.statSync(p));
  if (stats.some((s,i)=>stats.some((t,j)=>i!==j && s.ino===t.ino && s.dev===t.dev)))
    throw new Error('Input and output must not refer to the same file.');
}
