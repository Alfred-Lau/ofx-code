# 本地命令行测试指南

本文档介绍如何对 `ofx-code` CLI 工具进行本地测试。

## 📋 目录

- [快速开始](#快速开始)
- [直接运行 CLI](#直接运行-cli)
- [单元测试](#单元测试)
- [集成测试](#集成测试)
- [模拟环境测试](#模拟环境测试)
- [调试技巧](#调试技巧)

---

## 🚀 快速开始

### 1. 构建项目

```bash
# 确保项目已构建
bun run build

# 验证构建产物
ls -la dist/cli/index.js
```

### 2. 直接运行 CLI

```bash
# 使用绝对路径运行
./dist/cli/index.js --help

# 或创建别名（添加到 ~/.zshrc）
alias ofx-code='/Users/qianzhang/Downloads/files/ofx/dist/cli/index.js'
source ~/.zshrc

# 然后直接使用
ofx-code --help
```

---

## 🔧 直接运行 CLI

### 基础命令测试

```bash
# 查看版本
./dist/cli/index.js version
# 输出: ofx-code v0.1.0

# 查看帮助
./dist/cli/index.js --help
./dist/cli/index.js install --help
./dist/cli/index.js doctor --help
```

### 安装命令测试（非交互式）

```bash
# 测试非交互式安装（不会实际修改配置）
./dist/cli/index.js install --no-tui --claude=no --chatgpt=no --gemini=no

# 测试不同配置组合
./dist/cli/index.js install --no-tui --claude=max20 --chatgpt=yes --gemini=yes
```

### Doctor 命令测试

```bash
# 基础检查
./dist/cli/index.js doctor

# 详细输出
./dist/cli/index.js doctor --verbose

# JSON 格式输出
./dist/cli/index.js doctor --json

# 只检查特定类别
./dist/cli/index.js doctor --category installation
./dist/cli/index.js doctor --category authentication
```

### 版本检查命令

```bash
# 查看本地版本
./dist/cli/index.js get-local-version

# JSON 格式
./dist/cli/index.js get-local-version --json

# 指定目录
./dist/cli/index.js get-local-version --directory /path/to/project
```

---

## 🧪 单元测试

### 运行所有 CLI 测试

```bash
# 运行所有测试
bun test src/cli/

# 运行特定测试文件
bun test src/cli/config-manager.test.ts
bun test src/cli/doctor/runner.test.ts
bun test src/cli/run/completion.test.ts

# 监视模式（文件变化时自动重跑）
bun test --watch src/cli/
```

### 测试文件结构

```
src/cli/
├── config-manager.test.ts          # 配置管理测试
├── doctor/
│   ├── runner.test.ts              # Doctor 运行器测试
│   ├── formatter.test.ts           # 格式化测试
│   └── checks/
│       ├── opencode.test.ts        # OpenCode 检查测试
│       ├── plugin.test.ts          # 插件检查测试
│       ├── config.test.ts          # 配置检查测试
│       ├── auth.test.ts            # 认证检查测试
│       └── ...
└── run/
    ├── completion.test.ts          # 完成条件测试
    └── events.test.ts              # 事件处理测试
```

### 示例：运行 Doctor 测试

```bash
# 运行所有 doctor 相关测试
bun test src/cli/doctor/

# 运行特定检查测试
bun test src/cli/doctor/checks/opencode.test.ts

# 带详细输出
bun test src/cli/doctor/ --verbose
```

---

## 🔗 集成测试

### 方法 1：使用临时目录测试

```bash
# 创建临时测试目录
TEST_DIR=$(mktemp -d)
cd $TEST_DIR

# 运行安装命令（测试配置生成）
/path/to/ofx/dist/cli/index.js install \
  --no-tui \
  --claude=no \
  --chatgpt=no \
  --gemini=no

# 检查生成的配置文件
cat ~/.config/opencode/opencode.json
cat ~/.config/opencode/ofx-code.json

# 清理（可选）
rm -rf ~/.config/opencode/ofx-code.json
```

### 方法 2：使用环境变量隔离

```bash
# 设置临时配置目录
export XDG_CONFIG_HOME=$(mktemp -d)
export HOME=$(mktemp -d)

# 运行测试
./dist/cli/index.js install --no-tui --claude=no --chatgpt=no --gemini=no

# 检查输出
ls -la $XDG_CONFIG_HOME/opencode/

# 清理
rm -rf $XDG_CONFIG_HOME $HOME
```

### 方法 3：测试 Doctor 命令

```bash
# 在项目目录中运行 doctor
cd /Users/qianzhang/Downloads/files/ofx
./dist/cli/index.js doctor

# 测试特定类别
./dist/cli/index.js doctor --category configuration
./dist/cli/index.js doctor --category dependencies

# 验证 JSON 输出格式
./dist/cli/index.js doctor --json | jq .
```

---

## 🎭 模拟环境测试

### 模拟 OpenCode 未安装

```bash
# 临时重命名 opencode 命令
mv $(which opencode) $(which opencode).bak 2>/dev/null || true

# 运行 doctor（应该检测到未安装）
./dist/cli/index.js doctor --category installation

# 恢复
mv $(which opencode).bak $(which opencode) 2>/dev/null || true
```

### 模拟配置文件缺失

```bash
# 备份现有配置
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.bak 2>/dev/null || true

# 删除配置
rm -f ~/.config/opencode/opencode.json

# 运行 doctor（应该检测到配置缺失）
./dist/cli/index.js doctor --category configuration

# 恢复配置
mv ~/.config/opencode/opencode.json.bak ~/.config/opencode/opencode.json 2>/dev/null || true
```

### 模拟插件未注册

```bash
# 备份配置
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.bak

# 移除插件注册
jq '.plugin = [.plugin[] | select(. != "ofx-code")]' \
  ~/.config/opencode/opencode.json > /tmp/oc.json && \
  mv /tmp/oc.json ~/.config/opencode/opencode.json

# 运行 doctor（应该检测到未注册）
./dist/cli/index.js doctor --category installation

# 恢复
mv ~/.config/opencode/opencode.json.bak ~/.config/opencode/opencode.json
```

---

## 🐛 调试技巧

### 1. 启用详细日志

```bash
# 查看日志文件位置
./dist/cli/index.js doctor --verbose 2>&1 | grep -i log

# 查看日志内容
tail -f ~/.config/opencode/ofx-code.log
# 或
tail -f $(os.tmpdir())/ofx-code.log
```

### 2. 使用 Node.js 调试器

```bash
# 使用 node --inspect（如果使用 Node.js）
node --inspect ./dist/cli/index.js doctor

# 使用 bun debug
bun --inspect ./dist/cli/index.js doctor
```

### 3. 打印调试信息

在代码中添加调试输出：

```typescript
// src/cli/install.ts
console.log("[DEBUG] Config:", config);
console.log("[DEBUG] Install args:", args);
```

### 4. 测试错误处理

```bash
# 测试无效参数
./dist/cli/index.js install --no-tui --claude=invalid

# 测试缺失必需参数
./dist/cli/index.js install --no-tui

# 测试无效目录
./dist/cli/index.js get-local-version --directory /nonexistent/path
```

---

## 📝 测试清单

### 基础功能测试

- [ ] `ofx-code --version` 显示正确版本
- [ ] `ofx-code --help` 显示帮助信息
- [ ] `ofx-code version` 显示版本信息
- [ ] 所有子命令的 `--help` 都能正常显示

### Install 命令测试

- [ ] 非交互式安装（所有参数）
- [ ] 非交互式安装（部分参数）
- [ ] 交互式安装流程（需要手动确认）
- [ ] 配置文件正确生成
- [ ] 插件正确注册到 opencode.json
- [ ] 错误参数处理

### Doctor 命令测试

- [ ] 基础检查运行成功
- [ ] `--verbose` 显示详细信息
- [ ] `--json` 输出有效 JSON
- [ ] `--category` 过滤正确
- [ ] 所有检查类别都能运行

### Get-Local-Version 命令测试

- [ ] 显示当前版本
- [ ] `--json` 输出有效 JSON
- [ ] `--directory` 参数生效
- [ ] 版本比较逻辑正确

### Run 命令测试（需要 OpenCode）

```bash
# 注意：run 命令需要 OpenCode 运行，测试前确保已安装
./dist/cli/index.js run "test task" --timeout 5000
```

---

## 🎯 快速测试脚本

创建 `test-cli.sh`：

```bash
#!/bin/bash
set -e

CLI="./dist/cli/index.js"

echo "=== Testing ofx-code CLI ==="

echo "1. Version check"
$CLI version

echo "2. Help check"
$CLI --help | head -5

echo "3. Install help"
$CLI install --help | head -10

echo "4. Doctor (basic)"
$CLI doctor --category installation

echo "5. Get local version"
$CLI get-local-version --json | jq .

echo "=== All tests passed ==="
```

运行：

```bash
chmod +x test-cli.sh
./test-cli.sh
```

---

## 🔍 常见问题

### Q: CLI 命令找不到？

```bash
# 确保已构建
bun run build

# 检查文件是否存在
ls -la dist/cli/index.js

# 检查 shebang
head -1 dist/cli/index.js
# 应该显示: #!/usr/bin/env bun
```

### Q: 权限错误？

```bash
# 确保文件可执行
chmod +x dist/cli/index.js

# 或使用 bun 直接运行
bun run dist/cli/index.js --help
```

### Q: 测试时修改了真实配置？

```bash
# 使用临时目录
export XDG_CONFIG_HOME=$(mktemp -d)
./dist/cli/index.js install --no-tui --claude=no --chatgpt=no --gemini=no

# 或备份后恢复
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.bak
# ... 运行测试 ...
mv ~/.config/opencode/opencode.json.bak ~/.config/opencode/opencode.json
```

---

## 📚 相关文档

- [项目架构文档](./AGENTS.md)
- [CLI 文档](./docs/cli-guide.md)
- [贡献指南](./CONTRIBUTING.md)
