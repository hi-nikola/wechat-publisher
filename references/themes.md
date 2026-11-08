# 主题说明

LAPIS 默认使用 assets/lapis-wechat-safe.css。该文件保留蓝色标题和引用风格，并包含公众号兼容修正。
不要把 assets/lapis-wechat-fixes.css 单独传给 --custom-theme；它只包含覆盖规则。

```powershell
node scripts/render-safe.mjs article.md preview.html
node scripts/publish.mjs article.md lapis solarized-light --dry-run
```

其他主题可用 `wenyan theme -l` 查询。代码高亮按已安装版本的帮助选择，默认 solarized-light。

```bash
node scripts/publish.mjs article.md phycat github --dry-run
wenyan render -f article.md -t phycat -h github
```

封装脚本只在 lapis 时注入兼容 CSS；其他主题需要独立做窄屏和粘贴检查。
完整主题快照基于本机 wenyan-cli 2.0.11 对应的 core；升级依赖后，重新合并上游主题与 fixes，避免旧快照覆盖新特性。
