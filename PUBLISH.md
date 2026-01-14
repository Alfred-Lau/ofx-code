# npm 发布指南

本文档详细说明如何发布 `ofx-code` 到 npm 仓库。

## ⚠️ 重要规则

1. **禁止本地直接发布** - 永远不要运行 `npm publish` 或 `bun publish`
2. **禁止本地修改版本号** - 版本号由 CI 自动管理
3. **必须通过 GitHub Actions** - 使用 OIDC 可信发布（npm provenance）

---

## 📋 发布前检查清单

### 1. 代码准备

```bash
# ✅ 确保所有更改已提交
git status

# ✅ 确保测试通过
bun test

# ✅ 确保类型检查通过
bun run typecheck

# ✅ 确保构建成功
bun run build
```

### 2. 配置检查

- [ ] `package.json` 中的 `name` 为 `"ofx-code"`
- [ ] `package.json` 中的 `repository.url` 正确
- [ ] `.github/workflows/publish.yml` 中的仓库名称匹配
- [ ] `script/publish.ts` 中的 `PACKAGE_NAME` 为 `"ofx-code"`

### 3. npm 账户准备

- [ ] 已登录 npm 账户（CI 中使用 OIDC，无需本地登录）
- [ ] 有发布权限（如果是组织包，需要组织权限）
- [ ] GitHub Actions 已配置 OIDC（自动配置，无需手动设置）

---

## 🚀 发布步骤

### 第一步：提交代码到 `dev` 分支

```bash
# 1. 确保在 dev 分支
git checkout dev

# 2. 添加所有更改
git add .

# 3. 提交更改
git commit -m "feat: your feature description"

# 4. 推送到远程
git push origin dev
```

### 第二步：触发 GitHub Actions 发布工作流

#### 方法 1：使用 GitHub CLI（推荐）

```bash
# patch 版本升级 (0.1.0 → 0.1.1)
gh workflow run publish -f bump=patch

# minor 版本升级 (0.1.0 → 0.2.0)
gh workflow run publish -f bump=minor

# major 版本升级 (0.1.0 → 1.0.0)
gh workflow run publish -f bump=major

# 或直接指定版本号（跳过自动计算）
gh workflow run publish -f bump=patch -f version=1.0.0
```

#### 方法 2：通过 GitHub Web UI

1. 访问：`https://github.com/Alfred-Lau/ofx-code/actions/workflows/publish.yml`
2. 点击 "Run workflow"
3. 选择版本类型（major/minor/patch）
4. （可选）指定版本号
5. 点击 "Run workflow"

### 第三步：监控发布进度

```bash
# 查看工作流运行状态
gh run watch

# 查看最新的发布工作流
gh run list --workflow=publish --limit 5

# 查看工作流日志
gh run view <run-id> --log
```

---

## 📦 发布工作流详解

发布工作流 (`publish.yml`) 会自动执行以下步骤：

### 1. 测试阶段 ✅

- 运行 `bun test` - 执行所有单元测试
- 运行 `bun run typecheck` - TypeScript 类型检查

### 2. 构建阶段 🔨

- 构建主入口文件 (`src/index.ts`, `src/google-auth.ts`)
- 构建 CLI (`src/cli/index.ts`)
- 生成类型声明文件 (`.d.ts`)
- 生成 JSON Schema (`assets/ofx-code.schema.json`)

### 3. 版本管理 📝

- 从 npm 获取当前最新版本
- 根据 `bump` 参数计算新版本号
- 更新 `package.json` 中的版本号
- 生成 Changelog（基于 git commits）

### 4. 发布到 npm 📤

```bash
npm publish --access public --provenance --ignore-scripts
```

- `--access public` - 公开包
- `--provenance` - OIDC 可信发布（自动验证来源）
- `--ignore-scripts` - 跳过 prepublishOnly（已在 CI 中构建）

### 5. Git 操作 🏷️

- 提交版本更新到 `package.json` 和 `assets/ofx-code.schema.json`
- 创建 Git tag（格式：`v1.0.0`）
- 推送到远程仓库

### 6. GitHub Release 📋

- 创建 GitHub Release
- 使用生成的 Changelog 作为 Release Notes
- 包含贡献者信息

### 7. 合并到 master 🔀

- 切换到 `master` 分支
- 重置到新创建的 tag
- 强制推送到 `master`（保持 master 与最新 release 同步）

---

## 🔍 版本号规则

### Semantic Versioning (SemVer)

- **MAJOR** (1.0.0) - 不兼容的 API 更改
- **MINOR** (0.1.0) - 向后兼容的功能添加
- **PATCH** (0.0.1) - 向后兼容的 bug 修复

### 版本计算示例

```bash
# 当前版本: 0.1.0
gh workflow run publish -f bump=patch  # → 0.1.1
gh workflow run publish -f bump=minor  # → 0.2.0
gh workflow run publish -f bump=major  # → 1.0.0

# 指定版本（跳过自动计算）
gh workflow run publish -f bump=patch -f version=2.0.0  # → 2.0.0
```

---

## 🐛 故障排查

### 问题 1：工作流失败

```bash
# 查看失败的工作流
gh run list --workflow=publish --status failure

# 查看详细日志
gh run view <run-id> --log
```

**常见原因：**
- 测试失败 → 修复测试后重试
- 类型错误 → 运行 `bun run typecheck` 修复
- 构建失败 → 检查 `bun run build` 输出
- 版本已存在 → 使用更高的版本号

### 问题 2：版本已存在

```bash
# 检查 npm 上的版本
npm view ofx-code versions

# 使用更高的版本号
gh workflow run publish -f bump=patch -f version=0.1.2
```

### 问题 3：OIDC 认证失败

**症状：** npm publish 失败，提示认证错误

**解决：**
- GitHub Actions 会自动配置 OIDC
- 确保仓库设置中启用了 Actions
- 检查 npm 账户是否有发布权限

### 问题 4：仓库名称不匹配

**症状：** 工作流被跳过（`if: github.repository == 'Alfred-Lau/ofx-code'`）

**解决：**
- 检查 `.github/workflows/publish.yml` 第 64 行
- 确保仓库名称与 GitHub 仓库匹配

---

## 📊 发布后验证

### 1. 检查 npm 包

```bash
# 查看包信息
npm view ofx-code

# 查看版本历史
npm view ofx-code versions

# 查看最新版本
npm view ofx-code version
```

### 2. 测试安装

```bash
# 测试从 npm 安装
bunx ofx-code --version

# 或
npm install -g ofx-code
ofx-code --version
```

### 3. 检查 GitHub Release

```bash
# 查看最新 Release
gh release view

# 或访问
# https://github.com/Alfred-Lau/ofx-code/releases
```

### 4. 验证 Git Tag

```bash
# 查看最新 tag
git fetch --tags
git tag --sort=-v:refname | head -5

# 查看 tag 信息
git show v0.1.0
```

---

## 🔐 安全注意事项

### OIDC 可信发布

- ✅ 使用 GitHub Actions OIDC，无需 npm token
- ✅ npm 自动验证发布来源（provenance）
- ✅ 防止未授权发布

### 权限要求

- **GitHub Actions:**
  - `contents: write` - 创建 tags 和 releases
  - `id-token: write` - OIDC 认证

- **npm:**
  - 包所有者权限（自动通过 OIDC 验证）

---

## 📝 发布检查清单

发布前请确认：

- [ ] 所有代码已提交到 `dev` 分支
- [ ] 测试通过 (`bun test`)
- [ ] 类型检查通过 (`bun run typecheck`)
- [ ] 构建成功 (`bun run build`)
- [ ] 已选择正确的版本类型（major/minor/patch）
- [ ] GitHub Actions 工作流已触发
- [ ] 工作流运行成功
- [ ] npm 包已发布
- [ ] GitHub Release 已创建
- [ ] Git tag 已创建

---

## 🎯 快速参考

```bash
# 完整发布流程（patch 版本）
git add .
git commit -m "feat: your changes"
git push origin dev
gh workflow run publish -f bump=patch
gh run watch

# 验证发布
npm view ofx-code version
bunx ofx-code --version
```

---

## 📚 相关文档

- [npm 发布文档](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
