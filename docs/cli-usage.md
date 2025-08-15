# AI CLI 基本用法速查

本文件汇总最常用命令，用于日常快速参考。建议配合 `--no-stream` 获得更稳定的渲染效果。

## Chat 命令

- 渲染为彩色 ANSI（默认）
  - `ai-cli chat -p "给我一个包含标题、表格、代码块的示例" --render=ansi`
- 保留原始 Markdown
  - `ai-cli chat -p "示例" --render=md`
- 建议：关闭流式输出后渲染更整齐
  - `ai-cli chat -p "示例" --render=ansi --no-stream`
- 示例（CMD 可直接复制）
  - `ai-cli chat -p "生成一段包含#标题、- 列表、以及\`\`\`js\`\`\`代码块的Markdown" -r ansi --no-stream`

提示：渲染质量受终端字体/编码影响，Windows 建议使用 Windows Terminal + UTF-8（`chcp 65001`）。

## gen 命令（生成文件，带预览）

- 预览渲染后再确认写入
  - `ai-cli gen -p "为项目生成一个README" -o README.md`
- 直接应用（跳过确认）并备份
  - `ai-cli gen -p "为项目生成一个README" -o README.md --apply --backup`

说明：
- 默认会显示渲染后的预览，再询问是否写入到 `-o` 指定路径
- `--backup` 若目标存在会生成 `.bak` 备份

## edit 命令（编辑文件，带 diff）

- 展示彩色 diff 预览，确认后应用
  - `ai-cli edit -f src/app.ts -p "添加/health路由"`
- 直接应用（跳过确认）并备份原文件
  - `ai-cli edit -f src/app.ts -p "添加/health路由" --apply --backup`

说明：
- 会读取 `-f` 指定文件内容，依据 `-p` 的指令生成“修改后的完整文件”，展示彩色差异（add 绿、del 红）
- 选择确认后写回；加 `--backup` 将先保存原文件的 `.bak`

## 常见参数与建议

- `-m, --model <model>`：指定模型（如 `qwen-plus`）
- `--render <ansi|md>`：渲染模式（仅 chat 输出可渲染）
- `--no-stream`：关闭流式，获得完整文本后再渲染
- 输入上下文：
  - `-f, --file <path>`：把单个文件内容加入上下文
  - `-d, --directory <path>`：把目录摘要加入上下文（有大小与忽略规则）

## 快速示例

```bash
# 1) 渲染精美输出
ai-cli chat -p "展示一个包含表格与```python```代码块的Markdown" -r ansi --no-stream

# 2) 生成 README 并确认后写入
ai-cli gen -p "为这个项目生成 README，包含安装、命令、示例" -o README.md

# 3) 为文件添加 /health 路由（预览 diff 后应用）
ai-cli edit -f src/app.ts -p "新增 GET /health，返回 { ok: true }"
```

## 故障排查

- 渲染乱码/盒线错位：使用等宽字体（Cascadia Code/Consolas），并切 UTF-8（`chcp 65001`）
- Qwen 401：确认 `qwenBaseUrl` 与 Key 所在站点匹配；`ai-cli config --get qwenBaseUrl`
- 模型不可用：`ai-cli models` 查看可用模型，或 `ai-cli config --set defaultModel=qwen-plus`

---

更多用法见 README 或运行 `ai-cli --help`。
