import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolveCli} from './runtime.mjs';
import {embedLocalImages} from './portable-images.mjs';
import {setupArticleCopy} from './clipboard.mjs';

const base=fileURLToPath(new URL('..',import.meta.url));
const {JSDOM}=createRequire(resolveCli())('jsdom');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'wechat-images-'));
let count=0;
try {
  const bytes=fs.readFileSync(path.join(base,'assets/default-cover.jpg'));
  const local=path.join(temporary,'中文 image.jpg');fs.writeFileSync(local,bytes);
  const articlePath=path.join(temporary,'article.md');
  const dom=new JSDOM('<section id="wenyan"><p>图前文字</p><img alt="first"><p>图间文字</p><img alt="second"><p>图后文字</p></section>');
  const article=dom.window.document.querySelector('section');
  article.querySelector('img').setAttribute('src','%E4%B8%AD%E6%96%87%20image.jpg');
  article.querySelectorAll('img')[1].setAttribute('src',pathToFileURL(local).href);
  const summary=embedLocalImages(article,articlePath);
  assert.deepEqual(summary,{total:2,embedded:2,remote:0});count++;
  for(const image of article.querySelectorAll('img')) {
    assert(image.src.startsWith('data:image/jpeg;base64,'));
    assert.deepEqual(Buffer.from(image.src.split(',')[1],'base64'),bytes);count++;
  }
  assert.equal(article.querySelectorAll('p')[1].textContent,'图间文字');count++;
  const extra=new JSDOM('<section><img src="https://example.com/image.png"><img src="//example.com/two.png"></section>').window.document.querySelector('section');
  assert.equal(embedLocalImages(extra,articlePath).remote,2);
  assert.equal(extra.querySelectorAll('img')[1].src,'https://example.com/two.png');count++;
  const missing=new JSDOM('<section><img src="missing.jpg"></section>').window.document.querySelector('section');
  assert.throws(()=>embedLocalImages(missing,articlePath),/not found/);count++;
  fs.writeFileSync(path.join(temporary,'fake.png'),'not an image');
  missing.querySelector('img').setAttribute('src','fake.png');
  assert.throws(()=>embedLocalImages(missing,articlePath),/invalid image/);count++;

  // Generate a real preview in a DIFFERENT directory from the Markdown and images.
  fs.writeFileSync(articlePath,'# 图文复制回归\n\n图片前。\n\n![first](<中文 image.jpg>)\n\n图片中。\n\n![second](<中文 image.jpg>)\n\n图片后。');
  const output=path.join(temporary,'output/preview.html');
  const run=spawnSync(process.execPath,[path.join(base,'scripts/render-safe.mjs'),articlePath,output],{encoding:'utf8',timeout:120000});
  assert.equal(run.status,0,run.stderr);count++;
  const html=fs.readFileSync(output,'utf8');
  const fragment=fs.readFileSync(path.join(temporary,'output/preview.fragment.html'),'utf8');
  let modern;
  const preview=new JSDOM(html,{runScripts:'dangerously',beforeParse(window){
    window.Blob=Blob;
    window.ClipboardItem=class {constructor(data){this.data=data;}};
    Object.defineProperty(window.navigator,'clipboard',{value:{write:async items=>{
      modern={html:await items[0].data['text/html'].text(),text:await items[0].data['text/plain'].text()};
    }},configurable:true});
  }});
  await preview.window.document.getElementById('copy').onclick();
  assert(modern);assert.equal(modern.html,fragment);count++;
  const payload=new JSDOM(modern.html).window.document;
  assert.equal(payload.querySelectorAll('img').length,2);
  for(const image of payload.querySelectorAll('img'))assert.deepEqual(Buffer.from(image.src.split(',')[1],'base64'),bytes);
  assert(!payload.querySelector('nav,button,script'));count++;
  for(const text of ['图片前','图片中','图片后'])assert(modern.text.includes(text));count++;

  // Simulate browser copy-event delivery, separately from the modern API path.
  Object.defineProperty(preview.window.navigator,'clipboard',{value:undefined,configurable:true});
  const legacy={};
  preview.window.document.execCommand=()=>{
    const event=new preview.window.Event('copy',{cancelable:true});
    Object.defineProperty(event,'clipboardData',{value:{setData:(type,data)=>legacy[type]=data}});
    preview.window.document.dispatchEvent(event);return event.defaultPrevented;
  };
  await preview.window.document.getElementById('copy').onclick();
  assert.equal(legacy['text/html'],modern.html);count++;
  assert(preview.window.document.getElementById('status').textContent.includes('2 张图片'));count++;
  preview.window.document.execCommand=()=>false;
  await preview.window.document.getElementById('copy').onclick();
  assert(preview.window.document.getElementById('status').textContent.includes('自动复制失败'));count++;
  preview.window.document.querySelector('img').src='file:///invalid.jpg';
  await preview.window.document.getElementById('copy').onclick();
  assert(preview.window.document.getElementById('status').textContent.includes('未完成图文复制'));count++;
  // Reusing already embedded bytes must be idempotent.
  const before=article.outerHTML;embedLocalImages(article,articlePath);assert.equal(article.outerHTML,before);count++;
  console.log(`PASS: ${count} image checks (byte preservation, multiple images, actual generated handlers, simulated clipboard APIs, failure handling). WeChat paste not tested.`);
} finally {fs.rmSync(temporary,{recursive:true,force:true});}
