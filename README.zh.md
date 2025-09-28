# fepull

一个前端包管理工具，用于从 monorepo 项目中拉取特定包，类似 shadcn/ui。

## 功能特性

- 🎯 从 monorepo 项目中拉取特定包
- ⚡ 高效的稀疏检出，最小化带宽使用
- 🔄 多选包批量安装
- 📊 实时安装进度与详细摘要
- 🔧 交互式配置设置
- 📦 支持多个源仓库
- 🎨 支持多个目标目录
- 🚀 支持 npx、全局安装或项目本地安装

## 安装方式

### 使用 npx（推荐）

```bash
npx @ikun-kit/fepull init
npx @ikun-kit/fepull install
```

### 全局安装

```bash
pnpm add -g @ikun-kit/fepull
fepull init
fepull install
```

### 项目安装

```bash
pnpm add -D @ikun-kit/fepull
pnpm fepull init
pnpm fepull install
```

## 快速开始

1. **初始化配置**：

   ```bash
   fepull init
   ```

   这会创建一个默认的 `fepull.config.yml` 文件。编辑此文件来配置你的源仓库和目标目录。

2. **安装包**：
   ```bash
   fepull install
   ```
   交互式选择源、包和目标目录。

## 配置文件

`fepull.config.yml` 文件结构：

```yaml
sources:
  - name: ikun-react
    url: https://github.com/ikun-kit/react
    packagesDir: packages
    description: ikun-kit React 组件库

targets:
  - name: components
    path: ./src/components
    description: 项目组件目录
```

### 源配置

- `name`: 源仓库的标识符
- `url`: Git 仓库 URL
- `packagesDir`: 仓库中包含包的目录
- `description`: 可选描述

### 目标配置

- `name`: 目标目录的标识符
- `path`: 包将被安装到的本地路径
- `description`: 可选描述

## 开发

### 前置要求

- Node.js >= 18.0.0
- pnpm

### 设置

```bash
# 克隆仓库
git clone <repository-url>
cd fepull

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 开发模式运行
pnpm dev
```

### 脚本命令

- `pnpm build` - 构建 TypeScript 项目
- `pnpm dev` - 监听模式构建
- `pnpm start` - 直接运行 CLI

## 工作原理

1. **源选择**：从配置的源仓库中选择
2. **包发现**：使用 Git 稀疏检出高效获取包目录列表
3. **包选择**：交互式多选可用包（使用空格选择，回车确认）
4. **目标选择**：从配置的目标目录中选择
5. **安装**：使用稀疏检出仅下载选定包并复制到目标目录

## 使用示例

```bash
# 初始化项目
fepull init
# → 配置 ikun-kit/react 作为源
# → 配置 ./src/components 作为目标
# → 创建 fepull.config.yml

# 安装多个组件
fepull install
# → 选择 "ikun-react" 源
# → 多选包："button", "input", "dialog"（使用空格选择）
# → 选择 "components" 目标
# → Installing 3 package(s)...
# → ✅ button installed successfully
# → ✅ input installed successfully
# → ✅ dialog installed successfully
# → 📋 Installation Summary: ✅ 3 package(s) installed successfully
```

## 系统要求

- 必须安装 Git 并可访问
- 需要网络连接以下载源仓库
- 对目标目录有写入权限

## 许可证

MIT
