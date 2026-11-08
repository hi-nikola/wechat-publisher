import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolveCli, distinctPaths} from './runtime.mjs';
import {embedLocalImages} from './portable-images.mjs';
import {setupArticleCopy} from './clipboard.mjs';

const [input, output, explicitCli] = process.argv.slice(2);
if (!input || !output || !/\.html$/i.test(output)) throw new Error('Usage: node render-safe.mjs article.md output.html [cli.js]');
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!fs.statSync(input).isFile()) throw new Error('Markdown file not found.');
const fragmentPath = path.resolve(output).replace(/\.html$/i, '') + '.fragment.html';
fs.mkdirSync(path.dirname(path.resolve(output)), {recursive: true});
distinctPaths(input, output, fragmentPath, ...['SKILL.md','assets/lapis-wechat-safe.css','assets/lapis-wechat-fixes.css'].map(p=>path.join(base,p)));
const cli = resolveCli(explicitCli);
const run = spawnSync(process.execPath, [cli, 'render', '--file', path.resolve(input),
  '--custom-theme', path.join(base, 'assets/lapis-wechat-safe.css'),
  '--highlight', 'solarized-light', '--no-mac-style'],
  {encoding: 'utf8', timeout: 120000, maxBuffer: 20 * 1024 * 1024});
if (run.error) throw run.error;
if (run.status !== 0) throw new Error(run.stderr || `wenyan exited ${run.status}`);
const raw = run.stdout.trim();
const {JSDOM} = createRequire(cli)('jsdom');
const document = new JSDOM(raw).window.document;
const article = document.body.firstElementChild;
if (article?.tagName !== 'SECTION' || article.id !== 'wenyan' || document.body.children.length !== 1)
  throw new Error('Unexpected renderer output; refusing to copy logs as article.');
article.querySelectorAll('script,iframe,object,embed,base,link,meta,form').forEach(e=>e.remove());
for (const element of [article,...article.querySelectorAll('*')]) {
  for (const attribute of [...element.attributes]) {
    if (/^on/i.test(attribute.name) || attribute.name==='srcdoc' ||
        (['href','src','xlink:href'].includes(attribute.name) && /^\s*(javascript|vbscript|data:text\/html):/i.test(attribute.value)))
      element.removeAttribute(attribute.name);
  }
}
const imageSummary = embedLocalImages(article, input);
const fragment = article.outerHTML;
fs.writeFileSync(fragmentPath, fragment);
// The toolbar and preview width belong to the page, never the copied article.
fs.writeFileSync(output, `<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LAPIS 公众号兼容预览</title>
<style>body{margin:16px;background:#f4f5f7}nav{max-width:680px;margin:auto auto 16px}#preview{max-width:680px;margin:auto;background:white}button{margin:4px}</style>
<nav><button id="copy">复制公众号图文</button><button data-width="320">320px</button><button data-width="375">375px</button><button data-width="414">414px</button><button data-width="680">680px</button><span id="status" role="status">${imageSummary.total ? `含 ${imageSummary.total} 张图片；${imageSummary.embedded} 张已内嵌，${imageSummary.remote} 张为网络引用。` : ''}</span></nav>
<main id="preview">${fragment}</main>
<script>
document.querySelectorAll('[data-width]').forEach(b=>b.onclick=()=>document.getElementById('preview').style.maxWidth=b.dataset.width+'px');
(${setupArticleCopy.toString()})(document,window);
</script></html>`);
console.log(`Created ${path.resolve(output)} (${imageSummary.embedded} images embedded, ${imageSummary.remote} remote; no publication)`);
