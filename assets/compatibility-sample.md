## 左边界测试：Skill 和 Prompt 有什么区别？右边界测试

首字完整。这是一段中文与 English 混排正文，包含 **加粗文字**、`SKILL.md` 与 `abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789`。末字完整。

- 列表首字：把步骤封装成可以重复调用的方法，检查右边界和末字。
- 列表含 `very-long-inline-code-abcdefghijklmnopqrstuvwxyz01234567890123456789`。
  - 嵌套列表首字与末字应完整。
    - 第三层列表首字，包含 `abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789`，第三层末字。

> 引用首字：不要使用隐藏溢出的方式让问题看似消失。引用末字。

[长链接](https://example.com/abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789)

| 类型 | 说明 |
| --- | --- |
| Prompt | 一段可重复使用的指令 |
| Skill | 按需加载的工作流程及资源 |

```text
长代码行 abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789
```
