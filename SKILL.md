---
name: wechat-publisher
description: "将 Markdown 排版为微信公众号正文，生成可复制的 LAPIS 兼容预览，或通过 wenyan-cli 写入公众号草稿箱。用于公众号排版、复制粘贴、文字裁切排查和草稿上传。"
---

# 微信公众号排版与草稿上传

## 路径与依赖

以下命令从本 Skill 根目录执行；其他工作目录用绝对脚本路径。
使用 Node.js 与全局 `@wenyan-md/cli`，先检查 `node --version` 与 `wenyan --help`。
本次验证环境为 Node.js 24、wenyan-cli 2.0.11；不要将旧的 Node.js 14 当成保证兼容的最低版本。
若缺依赖，运行 `npm install -g @wenyan-md/cli`，安装后再检查帮助。
不要无提示升级已经能用的依赖。

## 先判断用户要求

- 排版、预览、复制到编辑器：只运行 render，不需要凭证、封面或 frontmatter。
- 明确要求上传/发布到草稿箱：检查内容后运行 publish。该操作会上传图片并新建草稿。
- 正式群发或发布属于另一项操作；本 Skill 的 publish 不代表正式公开发布。
- 检查或更新 Skill 时，用 --dry-run 检查发布参数，不写入真实公众号。

## 默认 LAPIS 兼容预览

先读 [粘贴兼容性与验收](references/paste-compatibility.md)。

```powershell
node scripts/render-safe.mjs article.md article-preview.html
```

生成预览页面和 `article-preview.fragment.html`。打开页面，使用“复制公众号图文”。
只复制带内联样式的 `#wenyan`；不要复制工具栏、固定宽度的预览外壳或整个网页。
按 320、375、414、680px 检查首字、末字、长标题、列表、引用、链接、表格和代码块。
输入、输出和正文片段必须是不同文件；不能把输出指向 Skill 自身的资源。
本地正文图片在生成预览前按 Markdown 所在目录解析，并转为含实际图片字节的 data:image 内嵌资源。预览、导出片段与复制必须使用同一份正文 DOM；禁止先冻结旧 HTML 再仅修改预览图片。
网络图片保留 HTTPS 引用，不能擅自删除。缺图或无效图片应明确报错，不生成“图文完整”的成功提示。
复制不执行图片上传，不要求凭证。带图复制后仍需核对公众号实际接收效果；不能把剪贴板模拟测试表述为公众号实测。
不要把中文段落整体设为 nowrap、负缩进、固定像素宽度或 overflow:hidden。
不要用缩小全篇字体掩盖裁切；超过三列的宽表格先考虑拆成内容块。

预览使用完整的 `assets/lapis-wechat-safe.css`（LAPIS 原样式 + fixes），在 wenyan 内联前加载。
`assets/lapis-wechat-fixes.css` 只是维护用的修正尾部，不能单独当完整主题。
用户选择其他主题时读 [主题说明](references/themes.md)，不能声称未经测试的主题也已验证。

## 写入草稿箱

封装脚本为稳定性要求显式填写 title 和 cover，这是脚本约定，不是对所有 wenyan 版本的 API 限制判断。
字段顺序不限；使用 YAML 解析，拒绝空字符串、重复字段或格式错误。

```markdown
---
title: 文章标题
cover: ./assets/cover.jpg
---

正文……
```

本地 cover 相对 Markdown 所在目录解析；发布前确认文件存在。
不要擅自给正式文章选择示例封面。
凭证只使用当前进程环境变量；Windows 封装在进程值为空时补读用户环境变量。
不要读取别人的固定路径或在输出中显示密钥，不要提交凭证文件。

先检查发布参数（不上传）：

```powershell
.\scripts\publish.ps1 -File article.md -DryRun
```

明确获得草稿上传指令后：

```powershell
.\scripts\publish.ps1 -File article.md
```

跨平台入口：

```bash
node scripts/publish.mjs article.md lapis solarized-light --dry-run
bash scripts/publish.sh article.md lapis solarized-light
```

LAPIS 自动使用兼容 CSS 并关闭 Mac 代码装饰；其他主题保留其主题参数。
CLI 非零退出码必须报告失败，不能根据日志含“发布”二字判断成功。
成功需保留实际返回的草稿标识；未执行上传时不能称草稿已生成。

## 验证与迭代

用 `assets/compatibility-sample.md` 做排版回归，运行 `node scripts/check.mjs` 检查参数和文件保护，并运行 `node scripts/check-images.mjs` 检查图文复制。
图文回归必须包含两张正文图片、不同输出目录、文件名含中文和空格、图片字节完整性，以及现代 Clipboard API 和 copy 事件降级路径；不能用封面图片代替正文图片用例。
实际浏览器布局测试与公众号粘贴测试分开记录；静态 HTML 检查不代表后两者已通过。
收到裁切报告时检查源 HTML、粘贴后的 DOM、容器宽度、缩进和祖先裁切样式，不能只凭文字识别推定根因。
升级 wenyan 后重新核对上游 LAPIS 与修正后的完整主题，复测渲染输出结构。
修改本地 Skill 后备份旧版再安装，核对已安装文件哈希；发现旧 .skill 安装包则移除失效包或重新生成，避免回退。
更新 Skill 不会自动修复已粘贴正文，需重新渲染并粘贴。

错误处理见 [故障排查](references/troubleshooting.md)。
