# Phase 6：开源发布和协作准备

## 目标

让 GitHub 仓库对外部用户和潜在贡献者可理解、可运行、可反馈。

本阶段只处理开源发布所需的仓库说明、反馈入口、CI 和发布草案，不改变应用运行逻辑，不新增账号、云同步、团队协作或跨平台承诺。

## 当前实现状态

已完成：

- 开源许可证：MIT。
- 贡献说明：本地运行、测试、提交反馈、隐私边界和代码风格。
- 变更日志：记录当前 MVP 便携体验版能力。
- GitHub Issue Forms：bug、功能建议、体验反馈。
- GitHub Actions：Windows 上运行依赖安装、测试、前端构建和 Tauri Rust crate 检查。
- Release 草案：说明便携 zip、WebView2 Runtime 前置条件、数据边界和手动 smoke。

待人工完成：

- 在 GitHub Release 页面创建正式 release。
- 上传 `dist-portable/每日计划与复盘-v0.2.0-portable.zip`。
- 如需 README 截图，手动截取不含私人数据的界面图并加入仓库。

## 交付内容

### README

README 面向新用户和开发者，必须回答：

- 这个项目是什么。
- 当前能做什么，暂时不做什么。
- 第一次如何安装依赖。
- 日常如何运行。
- 如何生成便携 zip。
- 数据保存在哪里，如何备份。
- 如何反馈问题。

### CONTRIBUTING

贡献说明只覆盖轻量开源协作：

- 如何提交 issue。
- 如何本地运行。
- 提交前需要跑哪些检查。
- 不要上传私人数据、SQLite 数据库、token 或敏感截图。
- 不承诺立即处理外部 PR。

### Issue 模板

Issue 模板必须引导用户提供足够上下文：

- Windows 版本。
- 应用版本。
- 运行方式：便携 zip、开发模式、源码构建。
- 复现步骤。
- 预期结果和实际结果。
- 是否已经确认没有附带私人数据。

### CI

当前 CI 只做基础质量门槛：

- `npm ci`
- `npm run test:run`
- `npm run build`
- `cargo check --locked`

CI 不生成正式便携包，不上传 release asset，不做完整 Windows 安装器矩阵。

## 能力边界

本阶段不承诺：

- 立即维护外部 PR。
- 跨平台二进制包。
- 自动更新。
- macOS/Linux 发布。
- 完整安全审计。
- 接受包含私人数据的 issue 附件。

用户反馈中如果涉及云同步、账号、加密、团队协作，必须先进入独立方案，不作为 Phase 6 顺手功能处理。

## 发布草案流程

1. 本地确认工作区干净。
2. 运行 `npm.cmd run test:run`。
3. 运行 `npm.cmd run build`。
4. 运行 `npm.cmd run tauri:check:gnu`。
5. 运行 `npm.cmd run portable:build:gnu`。
6. 解压 `dist-portable/每日计划与复盘-v0.2.0-portable.zip` 到临时目录。
7. 双击启动 exe，确认不会立即退出。
8. 确认 zip 内不包含源码、`.git`、`node_modules`、`src`、`src-tauri`。
9. 在 GitHub Release 页面粘贴 `docs/RELEASE_DRAFT_v0.2.0.md` 内容。
10. 上传便携 zip。

## 测试边界

自动验证覆盖：

- 单元测试。
- 前端构建。
- Tauri Rust crate 编译检查。
- Markdown 和 YAML 空白检查。

手动验证覆盖：

- 便携 zip 启动。
- zip 内容不泄露源码目录或个人 SQLite 数据。
- Release 文案说明 WebView2 Runtime 前置条件。

不覆盖：

- 所有 Windows 版本矩阵。
- 杀毒软件误报兼容性。
- macOS/Linux。
- GitHub Release asset 自动上传。

## 验收标准

- 新用户能按 README 在新机器上跑起来。
- CI 能在提交时发现基础测试失败。
- Issue 模板引导用户提供系统、版本、复现步骤。
- Release 草案说明 WebView2 Runtime 前置条件和数据边界。
- README、AGENTS 和阶段文档对项目边界描述一致。

## 自动验证记录

2026-06-23 已通过：

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
git diff --check
```

本机直接运行 `cargo check --locked` 未通过，原因是当前 PowerShell PATH 中没有 `cargo`。GitHub Actions 中该命令由 `dtolnay/rust-toolchain@stable` 提供 Rust 环境后执行；本机原生层以项目现有 `npm.cmd run tauri:check:gnu` 作为验证依据。
