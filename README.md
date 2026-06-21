# 每日计划与复盘

一个本地优先的个人桌面应用，用于早上计划、白天执行、晚上复盘。

当前状态是 MVP 开发版：可以本地运行和试用核心流程，但还不是正式安装包。

## 功能范围

已包含：

- 今日工作台：文件夹视图和星系视图
- 主页视图切换，并记住上次选择
- 四象限任务管理
- 点击星球开始任务，再次点击完成任务并插旗
- 任务实际耗时记录和手动修正
- 中途新增今日任务
- 未完成任务顺延到明天，并记录顺延原因
- 晚间四问复盘
- 今日完成概览
- 轻量月度总览

暂不包含：

- 账号和云同步
- 团队协作
- 模板系统
- 自定义原因标签
- 正式安装包
- 完整月度动画

## 技术栈

- Tauri 2
- React
- TypeScript
- SQLite

## 第一次使用

先安装这些基础软件：

- Node.js
- Rust
- Git，可选，但推荐用于后续开源和版本管理

然后进入项目目录：

```powershell
cd "C:\Users\PAIDA\Documents\每日复盘小程序"
```

如果你已经把项目迁移到了 D 盘，就进入迁移后的目录，例如：

```powershell
cd "D:\Projects\daily-plan-review"
```

第一次安装依赖和桌面工具链：

```powershell
npm install
npm run setup:windows-gnu
```

`setup:windows-gnu` 只需要第一次运行。它会安装或补齐 MSYS2、MinGW64、clang/lld 和 Rust GNU toolchain，不需要安装 Visual Studio IDE。

## 日常启动

以后日常使用只需要进入项目目录，然后运行：

```powershell
npm run tauri:dev:gnu
```

这会启动桌面开发版应用。桌面版会使用 SQLite 保存数据。

不建议用 `npm run dev` 作为日常使用入口。它只启动浏览器网页开发服务，主要用于前端调试，不是完整桌面应用流程。

## 常用命令

```powershell
npm run tauri:dev:gnu
```

启动桌面开发版，日常使用这个。

```powershell
npm run tauri:check:gnu
```

检查 Tauri 原生层是否可以编译。

```powershell
npm run test:run
```

运行测试。

```powershell
npm run build
```

构建前端静态资源。

```powershell
npm run tauri:build:gnu
```

尝试构建桌面包。当前阶段优先使用 `tauri:dev:gnu` 试用，正式发布包还需要后续整理。

## Windows 最小桌面工具链

这个项目默认使用一套最小 Windows 桌面开发路径，避免安装完整 Visual Studio：

```powershell
npm run setup:windows-gnu
npm run tauri:check:gnu
npm run tauri:dev:gnu
```

这些命令集中在 `scripts/windows-gnu.ps1`，负责：

- 配置 Rust GNU toolchain
- 安装或检查 MSYS2 / MinGW64
- 使用 clang/lld 作为链接器
- 配置 Cargo 镜像
- 避免中文项目路径导致 MinGW 资源编译失败

GNU 编译产物会放到：

```text
%LOCALAPPDATA%\daily-plan-review\cargo-target-gnu
```

这不是项目源码目录，可以不提交，也不需要手动管理。

## 迁移到 D 盘

可以把整个项目文件夹迁移到 D 盘继续使用。

推荐路径：

```text
D:\Projects\daily-plan-review
```

迁移时保留这些内容：

- `.git`
- `package.json`
- `package-lock.json`
- `src`
- `src-tauri`
- `scripts`
- 其他配置文件

可以不复制这些生成目录：

- `node_modules`
- `dist`
- `src-tauri/target`

迁移后重新进入新目录：

```powershell
cd "D:\Projects\daily-plan-review"
npm install
npm run tauri:dev:gnu
```

如果迁移后启动失败，再运行一次：

```powershell
npm run setup:windows-gnu
```

## 数据说明

桌面版使用本地 SQLite 数据库：

```text
daily-plan-review.db
```

这是本地优先应用，目前没有云同步。换电脑或清理系统应用数据前，需要单独考虑数据备份。

## 常见问题

### 只需要第一次安装吗？

是。通常第一次运行：

```powershell
npm install
npm run setup:windows-gnu
```

之后日常运行：

```powershell
npm run tauri:dev:gnu
```

### VS Code 和 Visual Studio 是一回事吗？

不是。VS Code 是编辑器，Visual Studio / Build Tools 是 MSVC 编译工具链。

本项目当前脚本走 GNU + MSYS2 + clang/lld 路线，所以不需要安装 Visual Studio IDE。

### 项目路径包含中文可以吗？

可以。脚本已经把 Rust 编译产物和 Tauri 图标资源处理到 ASCII 路径，避免 MinGW 工具在中文路径下失败。

不过如果你要迁移目录，仍然建议用简单英文路径，例如：

```text
D:\Projects\daily-plan-review
```

### 什么时候需要重新运行 `npm install`？

这些情况需要：

- 第一次拿到项目
- 删除了 `node_modules`
- `package.json` 或 `package-lock.json` 有依赖变化
- 换电脑

### 什么时候需要重新运行 `setup:windows-gnu`？

这些情况需要：

- 第一次在这台电脑运行桌面版
- 换电脑
- 删除或损坏了 Rust / MSYS2 工具链
- `tauri:check:gnu` 提示缺少 `cargo`、`rustc`、`clang`、`ld.lld` 或 `windres`

## 开发检查

提交代码前建议运行：

```powershell
npm run test:run
npm run build
npm run tauri:check:gnu
```
