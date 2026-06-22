# 每日计划与复盘

一个本地优先的个人桌面应用，用于早上计划、白天执行、晚上复盘。

当前状态是 MVP 便携体验版：可以本地运行核心流程，也可以生成 zip 发给其他用户试用。Phase 5 已加入本地任务模板、简单重复任务和本地搜索，用于减少每天重复输入。

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
- 月度总览：完成趋势、重要任务、四象限分布、顺延原因、星系地图和文件柜视图
- 数据安全面板：JSON 备份、JSON 导入、Markdown 档案导出、示例数据重置
- 本地任务模板：把今日任务保存为模板，并手动应用到今天
- 简单重复任务：新建任务时可选择每天、工作日或每周重复
- 本地搜索：按关键词、日期范围、四象限、状态和顺延原因筛选历史任务

暂不包含：

- 账号和云同步
- 团队协作
- 模板市场、模板分享和复杂分类
- 自定义原因标签
- 正式安装包
- 复杂月度动画和绩效化统计
- 复杂日历规则，例如节假日、调休、每月第几个工作日

## 技术栈

- Tauri 2
- React
- TypeScript
- SQLite

## 项目文档

- `docs/PROJECT_PHASE_2_PORTABLE_PREVIEW.md`：二阶段便携体验版方案。
- `docs/PROJECT_PHASE_3_DATA_SAFETY.md`：三阶段数据安全和可恢复性方案。
- `docs/PROJECT_PHASE_4_INSIGHTS.md`：四阶段复盘洞察和月度体验方案。
- `docs/PROJECT_PHASE_5_WORKFLOW.md`：五阶段日常工作流增强方案。
- `docs/PROJECT_FUTURE_ROADMAP.md`：后续阶段总方案、能力边界、测试边界。
- `docs/superpowers/plans/2026-06-22-future-roadmap-implementation.md`：后续阶段详细任务计划。
- `docs/superpowers/specs/2026-06-16-daily-plan-review-design.md`：初始产品设计说明。

## 月度总览

在今日工作台右上角点击 `月度总览` 可以打开当前月份的归档视图。

月度总览会展示：

- 本月完成率、重要任务完成情况和已记录实际耗时。
- 按日期展示的完成趋势。
- 四象限任务分布。
- 顺延原因汇总。
- 月度星系地图：点击日期节点查看当天任务。
- 月度文件柜：按日期抽屉查看当天任务文件。

这些内容只用于回顾趋势和任务结构，不会生成效率分数、排名或评价式结论。

## 日常工作流增强

今日工作台右侧栏包含三个降低重复输入的入口：

- `任务模板`：选择今天已有任务，填写模板名称后保存。模板只保存标题、四象限和计划耗时字段，不保存执行状态、实际耗时、顺延原因或复盘内容。点击已有模板的 `应用` 按钮后，才会把模板任务新增到今天。
- `重复`：新增任务时可以选择 `不重复`、`每天`、`工作日` 或 `每周`。重复任务不会后台运行；应用打开某一天时，会检查本地规则并生成当天应出现的任务。同一规则同一天只生成一次。
- `本地搜索`：在右侧栏按关键词、开始日期、结束日期、四象限、状态和顺延原因筛选本地历史任务。搜索只读取本地 SQLite 数据，不联网、不上传。

重复任务的边界：

- 工作日只按周一到周五判断，不处理节假日和调休。
- 每周重复按创建任务当天的星期生成。
- 暂不提供复杂 RRULE、日历同步或团队分配。
- 如果需要关闭或批量管理重复规则，后续会在专门的任务管理入口里补，不在当前 MVP 中扩展复杂设置。

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

## 便携体验版

二阶段目标是生成一个可以直接发给其他用户体验的便携包：

```powershell
npm run portable:build:gnu
```

生成后查看：

```text
dist-portable/每日计划与复盘-v0.2.0-portable.zip
```

体验者解压后双击 `每日计划与复盘.exe`。便携版数据保存在解压文件夹内：

- `data/user.sqlite`：我的数据
- `data/demo.sqlite`：示例数据

`portable:build:gnu` 生成的 zip 只包含空的 `data/` 文件夹，不会自动打包你本机正在使用的 `data/user.sqlite`。发送给别人体验时，优先发送这个命令生成的 zip，不要手动压缩你已经使用过的便携文件夹。

需要手动重置时，关闭应用后删除对应数据库即可：

- 删除 `data/user.sqlite`：重置我的数据
- 删除 `data/demo.sqlite`：重置示例数据

发送给别人体验时，请发送整个 zip，不要只发送 exe。

运行前提：对方电脑需要已有 Microsoft Edge WebView2 Runtime。多数 Windows 10/11 环境已经自带；如果打不开应用，优先安装 WebView2 Runtime，或改用后续整理的安装版。

## 数据备份和恢复

应用右侧栏的“数据安全”区域提供三类操作：

- `导出 JSON 备份`：生成完整备份，覆盖设置、每日文件、任务、任务模板、重复任务规则、任务执行记录和复盘决策，适合恢复数据。
- `导入 JSON 备份`：粘贴 JSON 备份内容后导入。导入前会先校验完整结构；非法 JSON、不支持的 schema version、缺少必填字段都会被拒绝，并且不会写入任何数据。
- `导出 Markdown 档案`：生成便于阅读的每日档案，适合长期查看和人工归档，不作为恢复格式。

示例数据模式下可以点击 `重置示例数据`。这个操作会清空当前示例数据库并重新写入内置示例，不会修改 `data/user.sqlite`。

备份策略建议：

- 日常备份：复制整个便携文件夹，或至少复制 `data/` 文件夹。
- 发给别人体验：发送 `dist-portable/每日计划与复盘-v0.2.0-portable.zip`，不要发送你自己已经使用过的便携文件夹。
- 迁移到新电脑或 D 盘：复制整个便携文件夹最稳妥；如果只迁移数据，至少保留 `data/user.sqlite`。

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

构建 Tauri 桌面产物。

```powershell
npm run portable:build:gnu
```

整理便携体验版目录并生成 zip，适合发给其他用户试用。

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
data/user.sqlite
data/demo.sqlite
```

这是本地优先应用，目前没有云同步。便携版数据跟随解压文件夹移动，备份时复制整个便携文件夹，或至少复制 `data/` 文件夹。

JSON 备份用于恢复，Markdown 档案用于阅读。SQLite 文件未加密，不建议保存高敏感信息；如果要把体验包发给别人，先确认没有把自己的 `data/user.sqlite` 一起发出去。

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
