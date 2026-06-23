# 每日计划与复盘 v0.2.0

这是一个 MVP 便携体验版，面向个人本地每日计划、执行和复盘。

## 下载

上传资产：

- `每日计划与复盘-v0.2.0-portable.zip`

使用方式：

1. 下载 zip。
2. 解压到一个固定文件夹。
3. 双击 `每日计划与复盘.exe`。
4. 不要只复制 exe，数据目录和运行依赖需要跟随整个文件夹。

## 运行前提

- Windows 10/11。
- Microsoft Edge WebView2 Runtime。

多数 Windows 10/11 机器已自带 WebView2 Runtime。如果应用无法打开，优先安装 WebView2 Runtime。

## 当前能力

- 早上制定今日计划。
- 白天新增、开始、完成任务。
- 星系视图和文件夹视图切换。
- 四象限任务管理。
- 实际耗时记录和手动修正。
- 未完成任务顺延到明天，并记录原因。
- 晚间四问复盘。
- 月度总览。
- JSON 备份和导入。
- Markdown 档案导出。
- 本地任务模板、简单重复任务和本地搜索。

## 数据说明

数据保存在解压文件夹内：

- `data/user.sqlite`：我的数据。
- `data/demo.sqlite`：示例数据。

SQLite 文件未加密，不建议记录高敏感内容。把体验包发给别人前，不要发送已经包含自己 `data/user.sqlite` 的文件夹。

## 不包含

- 账号登录。
- 云同步。
- 团队协作。
- 自动更新。
- macOS/Linux 发布包。
- 绩效化分数或排名。

## 发布前检查

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
```

手动 smoke：

1. 解压 `dist-portable/每日计划与复盘-v0.2.0-portable.zip` 到临时目录。
2. 双击 `每日计划与复盘.exe`。
3. 确认应用不会立即退出。
4. 确认 zip 内不包含 `.git`、`node_modules`、`src`、`src-tauri`。
5. 确认 zip 内没有本机个人 `data/user.sqlite`。
