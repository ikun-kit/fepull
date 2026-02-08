# fepull 设计文档

## 概述

fepull 是一个前端包管理工具，类似 shadcn/ui，用于从 monorepo 项目中拉取指定包到本地项目。

## 核心功能

### 命令

- `fepull init` - 初始化配置文件
- `fepull install` - 交互式安装包

### 配置文件 (`fepull.config.yml`)

```yaml
packages:
  - name: ikun-react
    source:
      url: https://github.com/ikun-kit/react
      packagesDir: packages
    target: ./src/components
    description: ikun-kit React 组件库
```

````

## 工作流程

### 1. 初始化

```bash
fepull init
````

- 创建 `fepull.config.yml`
- 编辑配置文件，设置包条目（源 + 目标）

### 2. 安装包

```bash
fepull install
```

交互流程：

1. 选择包条目（源与目标已绑定）
2. 选择要安装的包
3. 下载并安装到配置的目标目录

## 技术栈

- Node.js
- 命令行交互库（如 inquirer）
- Git 操作（下载源码）
- 文件系统操作

## 目标

- 简化前端包复用流程
- 支持多个包条目，源与目标绑定管理
- 提供良好的交互体验
