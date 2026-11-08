# wechat-publisher

将 Markdown 排成微信公众号图文，生成可复制的 LAPIS 预览，也可将文章上传到公众号草稿箱。

将 GitHub Release 中的 ZIP 解压，把完整的 `wechat-publisher` 目录放进客户端的技能目录。也可以在任意目录解压后，直接从技能目录运行脚本。

需要 Node.js 24 和 `@wenyan-md/cli` 2.0.11。可用 `npm install -g @wenyan-md/cli@2.0.11` 安装 CLI。

```bash
node scripts/render-safe.mjs example.md article-preview.html
node scripts/publish.mjs example.md --dry-run
```

打开 `article-preview.html`，点击「复制公众号图文」。正文中的本地图片会嵌入预览和复制内容。预览与试运行无需配置公众号凭证。

需要创建草稿时，用自己的公众号配置 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 环境变量。将命令里的示例文件换成带有 `title` 和 `cover` 的文章，移除 `--dry-run` 后执行。该操作创建草稿，正式发表由公众号后台处理。

完整流程见 [SKILL.md](SKILL.md)，第三方主题许可见 [licenses](licenses/)。
