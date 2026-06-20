# 每日计划与复盘

一个本地优先的个人桌面应用，用于早上计划、白天执行、晚上复盘。

## 技术栈

- Tauri 2
- React
- TypeScript
- SQLite

## 开发

```powershell
npm install
npm run test:run
npm run build
npm run tauri dev
```

### Windows 最小桌面工具链

如果不安装 Visual Studio IDE，可以使用 MSYS2/MinGW 的最小路径：

```powershell
npm run setup:windows-gnu
npm run tauri:check:gnu
npm run tauri:dev:gnu
```

这些命令集中在 `scripts/windows-gnu.ps1`，负责配置 Rust GNU toolchain、MSYS2/MinGW/Clang PATH 和 Cargo 镜像。常用命令：

- `npm run setup:windows-gnu`：安装/补齐 MSYS2、MinGW64 gcc/binutils、clang/lld、Rust GNU toolchain
- `npm run tauri:fetch:gnu`：预下载 Rust 依赖
- `npm run tauri:check:gnu`：检查 Tauri 原生层编译
- `npm run tauri:dev:gnu`：启动桌面开发版
- `npm run tauri:build:gnu`：构建桌面包

GNU 编译产物会放到 `%LOCALAPPDATA%\daily-plan-review\cargo-target-gnu`，避免 MinGW 工具在中文项目路径下处理临时 `.lib` 文件失败。

## MVP 范围

- 今日工作台：文件夹视图和星系视图
- 四象限任务管理
- 任务时间记录和手动修正
- 顺延任务确认
- 晚间四问复盘
- 今日完成概览
- 轻量月度总览

## 暂不包含

- 账号和云同步
- 团队协作
- 模板系统
- 自定义原因标签
- 完整月度动画
