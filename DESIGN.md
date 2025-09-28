# fepull 设计文档

## 概述

fepull 是一个前端包管理工具，类似 shadcn/ui，用于从 monorepo 项目中拉取指定包到本地项目。

## 核心功能

### 命令

- `fepull init` - 初始化配置文件
- `fepull install` - 交互式安装包

### 配置文件 (`fepull.config.json`)

```json
{
  "sources": [
    {
      "name": "ikun-react",
      "url": "https://github.com/ikun-kit/react",
      "packagesDir": "packages",
      "description": "ikun-kit React 组件库"
    }
  ],
  "targets": [
    {
      "name": "components",
      "path": "./src/components",
      "description": "项目组件目录"
    }
  ]
}
```

## 工作流程

### 1. 初始化

```bash
fepull init
```

- 创建 `fepull.config.json`
- 交互式配置源仓库和目标目录

### 2. 安装包

```bash
fepull install
```

交互流程：

1. 选择源仓库
2. 选择要安装的包
3. 选择目标目录
4. 下载并安装到指定位置

## 技术栈

- Node.js
- 命令行交互库（如 inquirer）
- Git 操作（下载源码）
- 文件系统操作

## 目标

- 简化前端包复用流程
- 支持多源、多目标配置
- 提供良好的交互体验
