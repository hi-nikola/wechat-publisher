import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {resolveCli, parseArticle, distinctPaths} from './runtime.mjs';

const base = fileURLToPath(new URL('..', import.meta.url));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'wechat-publisher-check-'));
const file = path.join(temporary,'中文 article.md');
const cli = resolveCli();
let count=0;
try {
  for (const header of [
    'title: 测试标题\ncover: https://example.com/cover.jpg',
    'cover: https://example.com/cover.jpg\ntitle: 测试标题',
    'title: "中文：测试"\ncover: "https://example.com/cover.jpg"',
  ]) {
    fs.writeFileSync(file, `---\n${header}\n---\n正文`);
    assert(parseArticle(file,cli).title);count++;
  }
  for (const header of ['title:\ncover: https://example.com/x', 'cover: ""\ntitle: X',
    'title: X\ntitle: Y\ncover: https://example.com/x','title: X\ncover: ./missing.jpg']) {
    fs.writeFileSync(file,`---\n${header}\n---\n正文`);
    assert.throws(()=>parseArticle(file,cli));count++;
  }
  fs.writeFileSync(file,'---\ntitle: X\ncover: .\n---\n正文');
  assert.throws(()=>parseArticle(file,cli));count++;
  assert.throws(()=>distinctPaths(file,file));count++;
  const alias=path.join(temporary,'alias.html');
  try {
    fs.linkSync(file,alias);
    assert.throws(()=>distinctPaths(file,alias));count++;
  } catch (error) {
    if (!['EPERM','ENOTSUP','EACCES'].includes(error.code)) throw error;
    console.log('SKIP: hard-link alias fixture is unsupported in this environment.');
  }
  fs.writeFileSync(file,'---\ncover: https://example.com/c.jpg\ntitle: 测试\n---\n正文');
  for (const theme of ['lapis','phycat']) {
    const run=spawnSync(process.execPath,[path.join(base,'scripts/publish.mjs'),file,theme,'solarized-light','--dry-run'],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const result=JSON.parse(run.stdout);
    assert(result.dryRun);
    assert.equal(result.command.includes('--custom-theme'),theme==='lapis');
    assert.equal(result.command.includes('--theme'),theme!=='lapis');
    count++;
  }
  const protectedFile=path.join(temporary,'source.html');fs.writeFileSync(protectedFile,'源稿不得覆盖');
  const run=spawnSync(process.execPath,[path.join(base,'scripts/render-safe.mjs'),protectedFile,protectedFile],{encoding:'utf8'});
  assert.notEqual(run.status,0);assert.equal(fs.readFileSync(protectedFile,'utf8'),'源稿不得覆盖');count++;
  const full=fs.readFileSync(path.join(base,'assets/lapis-wechat-safe.css'),'utf8');
  const fixes=fs.readFileSync(path.join(base,'assets/lapis-wechat-fixes.css'),'utf8');
  assert(full.endsWith(fixes));count++;
  console.log(`PASS: ${count} checks (YAML, path protection, publish dry-run, theme consistency). No uploads performed.`);
} finally {
  fs.rmSync(temporary,{recursive:true,force:true});
}
