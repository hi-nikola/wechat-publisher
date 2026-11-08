# 故障排查

## 两侧文字裁切或显示半字

按 references/paste-compatibility.md 的两层验收检查。先重新生成兼容预览，只复制正文；到空白测试草稿粘贴，避免已有排版继续影响结果。
检查固定宽度、累计缩进、负边距、nowrap、固定高度、overflow:hidden 及长链接/代码。
未获取实际粘贴后 DOM 时，只能列出可能原因，不能声称根因已确诊。

## CLI 缺失或版本不兼容

检查 `node --version` 与 `wenyan --help`。本次验证 Node.js 24 与 wenyan-cli 2.0.11。
需要安装时使用 `npm install -g @wenyan-md/cli`；渲染脚本第三个参数允许显式指定 cli.js。

## title / cover 错误

预览无需 frontmatter。封装发布路径要求 YAML title 和 cover 均为非空字符串，顺序不限。
cover 相对 Markdown 文件目录；检查路径是否存在。若直接使用其他版本 CLI，封面回退行为以该版本源码/帮助和实测为准，不能套用“永远必填”或“永远自动取首图”。

## 凭证或 IP 白名单

使用私有环境变量 WECHAT_APP_ID、WECHAT_APP_SECRET，不在日志或文档里输出值。
Windows publish.ps1 仅在当前进程为空时补读用户环境值。
遇到 ip not in whitelist，到公众号平台按实际错误配置出口 IP 白名单。
遇到 invalid credential，核对环境变量与账号；不要把凭证粘到公开反馈中。

## 图片显示或上传失败

本地图片会先转为 data:image 内嵌到正文，随后预览与复制共用同一份 DOM。复制流程不需要图片上传或公众号凭证。
出现“预览有图，粘贴没图”时，先检查剪贴板 HTML 是否包含对应 img 和图片数据、是否误用旧版预览；不能直接要求用户改成手动插图。
确认剪贴板完整后，若公众号仍不接收，再检查接收端行为；在没有实测前不能承诺其保存结果。
API 路径按 Markdown 所在目录解析图片；检查网络图片是否可访问、本地图片是否存在。
图片类型、大小和封面要求以当前微信 API 返回错误为准，不将历史尺寸写成强制要求。

## 发布失败

以退出码和实际草稿返回标识为准。不要自动无限重试，以免重复新建草稿。
检查 `wenyan publish --help` 与实际错误，不输出环境变量内容。

## 参考

- https://github.com/caol64/wenyan-cli
- https://github.com/caol64/wenyan-core
- https://developers.weixin.qq.com/doc/offiaccount/
