// This function is also inlined into generated previews; keep it self-contained.
export function setupArticleCopy(document, window) {
  const button=document.getElementById('copy');
  const status=document.getElementById('status');
  button.onclick=async()=>{
    const article=document.getElementById('wenyan');
    const images=[...article.querySelectorAll('img')];
    button.disabled=true;status.textContent='正在准备图文…';
    try {
      for (const image of images) {
        const source=image.getAttribute('src') || '';
        if (!/^(?:data:image\/|https?:\/\/)/i.test(source))
          throw new Error('图片仍是本地或临时地址，请重新生成预览。');
      }
      // Serialize the SAME article that the user sees, including embedded bytes.
      const html=article.outerHTML;
      const text=article.innerText ?? article.textContent;
      let copied=false;
      if(window.navigator.clipboard?.write && window.ClipboardItem) {
        try {
          await window.navigator.clipboard.write([new window.ClipboardItem({
            'text/html':new window.Blob([html],{type:'text/html'}),
            'text/plain':new window.Blob([text],{type:'text/plain'})
          })]);
          copied=true;
        } catch { /* File previews and older browsers use the copy event below. */ }
      }
      if(!copied) {
        const selection=window.getSelection();
        const previous=[];
        for(let i=0;i<selection.rangeCount;i++)previous.push(selection.getRangeAt(i).cloneRange());
        const range=document.createRange();range.selectNode(article);
        selection.removeAllRanges();selection.addRange(range);
        let payloadWritten=false;
        const onCopy=event=>{
          if(!event.clipboardData)return;
          event.clipboardData.setData('text/html',html);
          event.clipboardData.setData('text/plain',text);
          event.preventDefault();payloadWritten=true;
        };
        document.addEventListener('copy',onCopy);
        try { copied=Boolean(document.execCommand('copy')) && payloadWritten; }
        finally { document.removeEventListener('copy',onCopy); }
        if(copied) {
          selection.removeAllRanges();previous.forEach(r=>selection.addRange(r));
        } else {
          status.textContent='自动复制失败，正文已选中；请按 Ctrl+C，粘贴后核对图片。';
          return;
        }
      }
      status.textContent=images.length
        ? `图文已复制（${images.length} 张图片），粘贴后请确认图片已被接收。`
        : '正文已复制。';
    } catch(error) {
      status.textContent='未完成图文复制：'+error.message;
    } finally { button.disabled=false; }
  };
}
