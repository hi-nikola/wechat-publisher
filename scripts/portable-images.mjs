import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

function imageMime(bytes) {
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'image/jpeg';
  if (/^GIF8[79]a/.test(bytes.subarray(0,6).toString())) return 'image/gif';
  if (bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP') return 'image/webp';
  if (/^(?:\s|<\?xml[^>]*>|<!--[^]*?-->)*<svg[\s>]/i.test(bytes.toString('utf8').replace(/^\uFEFF/,''))) return 'image/svg+xml';
  throw new Error('Unsupported or invalid image file; use PNG, JPEG, GIF, WebP or SVG.');
}

// Resolve images BEFORE producing either the preview or the clipboard fragment.
// Reading local bytes here needs no image upload or clipboard browser permission.
export function embedLocalImages(article, markdownPath) {
  const cache=new Map();
  const summary={total:0,embedded:0,remote:0};
  for (const image of article.querySelectorAll('img')) {
    summary.total++;
    const source=(image.getAttribute('src') || image.getAttribute('data-src') || '').trim();
    if (!source) throw new Error(`Image ${summary.total} has no source.`);
    // srcset and lazy loading must not select a different, nonportable image.
    image.removeAttribute('srcset');image.removeAttribute('sizes');
    image.removeAttribute('data-src');image.removeAttribute('loading');
    if (/^https?:\/\//i.test(source) || source.startsWith('//')) {
      image.setAttribute('src',source.startsWith('//') ? 'https:'+source : source);
      summary.remote++;continue;
    }
    if (/^data:/i.test(source)) {
      const data=source.match(/^data:image\/(?:png|jpe?g|gif|webp|svg\+xml)(;[^,]*)?,([\s\S]*)$/i);
      if (!data) throw new Error(`Image ${summary.total} has an unsupported data URL.`);
      const bytes=/;base64(?:;|$)/i.test(data[1] || '')
        ? Buffer.from(data[2],'base64') : Buffer.from(decodeURIComponent(data[2]),'utf8');
      image.setAttribute('src',`data:${imageMime(bytes)};base64,${bytes.toString('base64')}`);
      summary.embedded++;continue;
    }
    let local;
    if (/^file:/i.test(source)) local=fileURLToPath(source);
    else if (/^[a-z]:[\\/]/i.test(source) || path.isAbsolute(source)) local=source;
    else {
      if (/^[a-z][a-z0-9+.-]*:/i.test(source))
        throw new Error(`Image ${summary.total} uses an unsupported image URL scheme.`);
      local=path.resolve(path.dirname(path.resolve(markdownPath)),decodeURIComponent(source.split(/[?#]/)[0]));
    }
    if (!fs.existsSync(local) || !fs.statSync(local).isFile())
      throw new Error(`Image ${summary.total} was not found: ${local}`);
    const canonical=fs.realpathSync(local);
    if (!cache.has(canonical)) {
      const bytes=fs.readFileSync(canonical);
      cache.set(canonical,`data:${imageMime(bytes)};base64,${bytes.toString('base64')}`);
    }
    image.setAttribute('src',cache.get(canonical));summary.embedded++;
  }
  return summary;
}
