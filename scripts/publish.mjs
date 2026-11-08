import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {resolveCli, parseArticle} from './runtime.mjs';

const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log('Usage: node publish.mjs article.md [theme] [highlight] [--dry-run]');
  process.exit(args.includes('--help') ? 0 : 1);
}
const dryRun = args.includes('--dry-run');
const positional = args.filter(x=>x!=='--dry-run');
if (positional.length > 3 || positional.some(x=>x.startsWith('--')))
  throw new Error('Unexpected publish argument.');
const [input, theme='lapis', highlight='solarized-light'] = positional;
const file = path.resolve(input);
if (!fs.statSync(file).isFile()) throw new Error('Markdown file not found.');
const cli = resolveCli();
parseArticle(file, cli);
const themeFile = fileURLToPath(new URL('../assets/lapis-wechat-safe.css', import.meta.url));
const command = ['publish', '--file', file, '--highlight', highlight,
  ...(theme.toLowerCase()==='lapis' ? ['--custom-theme', themeFile, '--no-mac-style'] : ['--theme', theme])];
if (dryRun) {
  console.log(JSON.stringify({dryRun:true, command:[process.execPath,cli,...command]}));
} else {
  for (const key of ['WECHAT_APP_ID','WECHAT_APP_SECRET'])
    if (!process.env[key]?.trim()) throw new Error(`Missing ${key}; configure environment variables before publishing.`);
  const result = spawnSync(process.execPath, [cli,...command], {stdio:'inherit'});
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
