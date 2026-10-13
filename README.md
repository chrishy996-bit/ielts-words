# IELTS Words（雅思词伴）

面向 iPhone Safari 和电脑浏览器的雅思词汇学习单页应用。React 19 + TypeScript + Vite；不需要后端、账号、付费 API 或密钥。

## 已实现

- 首页显示设备本地日期、默认每天 30 个新词、学习进度、待复习数、累计掌握数、连续学习天数。
- 固定每日新词计划，优先未学词。重复打开不会重复学习计数，词库耗尽明确提示。降低目标不删除已分配的词，增加目标会补充未学词。
- 100 个常用学术/雅思主题演示词，包含英式音标、词性、中文、原创例句及翻译、搭配、技能分类、应用场景。不宣称来自官方雅思词表，不使用付费词库。
- 卡片学习、隐藏中文、上一词/下一词、收藏、认识/不认识、本次报告。跳过不计入学习。
- 浏览器 Web Speech API：英式/美式、正常/慢速；缺少语音明确提示回退。读音质量和可用性由设备决定。
- 间隔复习、释义拼写和听音拼写、错词复习、成绩和错词回顾。
- 7/30 天真实记录统计、柱状图、每日数据列表、掌握进度和空状态。
- IndexedDB 持久化；每次有效操作完成保存后才前进。保存失败会提示。旧标签页无法覆盖其他标签页的新数据，请刷新后继续。
- JSON 备份导入/导出、扩展 JSON 词库、格式验证、导入覆盖确认、两次确认重置。
- 奶油白、鼠尾草绿、暖金色界面；安全区域、44px 以上操作按钮、输入框聚焦滚动。

## 在电脑上运行

安装 Node.js 22 或更高版本（https://nodejs.org/），在项目目录打开终端：

```bash
npm ci
npm run dev
```

用电脑浏览器打开终端显示的 `http://localhost:5173/`。保持终端运行。手机与电脑连接同一 Wi-Fi 时，可使用终端显示的电脑局域网地址；云工作区的地址通常不能直接从手机访问，此时请使用 GitHub Pages 部署后的地址。

```bash
npm run typecheck
npm test
npm run build
```

`dist/` 是可部署的静态文件。不要直接双击 `index.html`；需要开发服务器或静态托管。

浏览器自动化（首次需要下载浏览器及系统依赖）：

```bash
npx playwright install chromium webkit
npm run test:e2e
```

Linux 如果提示缺库，请按 Playwright 官方要求安装依赖；只测 Chromium 可用 `npm run test:e2e -- --project=chromium-mobile`。单元测试用 fake-indexeddb；浏览器测试用真实浏览器 IndexedDB。

## 复习算法与日期规则

每个词记录首次学习日、复习次数、阶段、间隔、下一复习日期、掌握状态及错词状态。日期采用设备本地日历 `YYYY-MM-DD`，不把本地日期转换为 UTC，不按固定 24 小时计算下一天，因此夏令时跨日不会造成一小时偏差。

首次学习：阶段 0，间隔 1 天，次日复习。阶段间隔依次为 `[1, 3, 7, 14, 30]`。

| 回答 | 阶段调整 | 下一次间隔 | 掌握状态 |
| --- | --- | --- | --- |
| 忘记了 | 重置为 0 | 1 天 | 未掌握，标记需巩固 |
| 模糊 | 后退 1 阶段，最低 0 | 1 天 | 未掌握，标记需巩固 |
| 记得 | 前进 1 阶段，最高 4 | 新阶段的间隔 | 阶段 4 才掌握 |
| 非常熟悉 | 前进 2 阶段，最高 4 | 新阶段的间隔 | 阶段 4 才掌握 |

忘记或模糊保持错词状态，但当天不重复复习；明天可再次复习。拼写错误撤销掌握并把词设为当天到期。若当天已经复习过，则次日再复习，避免刷次数。拼写正确不会跳过复习阶段。

复习仅允许到期或错词，每词每本地日期最多计一次，按历史事件去重；即使时区使日期前后跳动，也不会重复计入同一天。改变时区后按新本地日历判断到期，不追溯重写历史事件。后台恢复或每 15 秒检测日期变化；提交操作再次读取本地日期。

连续学习天数以有学习、复习或拼写事件的连续日期计算。如果今天未练习而昨天有练习，保持昨天为止的连续天数。新词和复习各自计数。

## 数据备份和安全

数据保存在当前浏览器、当前网站来源下的 IndexedDB；**没有云同步**。浏览器清理、无痕模式、设备丢失、更换网址来源，都可能使记录不可用。

1. 在底部“设置”点击“导出 JSON 备份”。iPhone 请把文件保存到“文件”或 iCloud Drive。
2. 在目标设备打开同一个网站，进入“设置”点击“导入备份”，选择文件。
3. 应用先验证版本、字段、日期、词条 ID、事件与每日计划；只有有效备份才弹出覆盖确认。确认后覆盖词库、全部记录、收藏和设置。
4. 重置需要先确认，再输入“重置”。重置前建议导出备份。

备份版本为 `1`，包含 `words`、`progress`、`favorites`、`events`、`plans`、`settings`；备份文件最大 20 MB。应用不向任何服务器上传学习记录。尽量只在一个标签页练习；多标签页冲突时会拒绝覆盖并提示刷新。

## 导入更大词库

在“设置 → 导入新词库”选择 JSON。格式为 Word 数组，参考 `src/words.json`：

```json
[
  {
    "id": "custom-001",
    "english": "resilience",
    "pos": "n.",
    "ipa": "/rɪˈzɪliəns/",
    "meaning": "恢复力；韧性",
    "example": "Community gardens can improve a neighbourhood's resilience.",
    "translation": "社区花园可以提高街区的韧性。",
    "collocations": ["build resilience"],
    "category": "写作",
    "scene": "写作 Task 2：讨论社区如何应对变化。"
  }
]
```

分类只能是“阅读”“听力”“写作”“口语”。每词必须提供全部字段和至少一个搭配；ID 使用英文、数字、下划线或连字符，不能与现有 ID 或英文重复。音标须人工核对，应用不会根据拼写生成音标。导入追加词条，不删除原有学习进度。结构可以扩展至 3000–5000 词，一次词库导入最多 10000 词；此版本未做 5000 词性能压力测试。

## 合并代码并部署到 GitHub Pages

以下涉及你的 GitHub 账号，需要你手动完成。当前工作区无法读取有效 Git 元数据，未执行提交、推送、合并或发布。

### 方式一：没有编程基础，网页上传

1. 下载本项目文件到电脑。不要上传 `node_modules`、`dist`、测试输出或工作区的隐藏账号配置；需要上传 `src/`、`tests/`、`e2e/`、`.github/workflows/deploy.yml`、`package.json`、`package-lock.json`、`index.html`、`tsconfig.json`、`vite.config.ts`、`playwright.config.ts`、`.gitignore` 和 README。
2. 登录 GitHub，在右上角点击 **＋ → New repository**，名称建议 `ielts-words`，选择 **Public**，点击 **Create repository**。（公共仓库可使用免费 GitHub Pages。）
3. 在仓库点击 **Add file → Upload files**，把项目文件及文件夹拖进去。注意电脑可能隐藏 `.github`，必须确保 `.github/workflows/deploy.yml` 被上传到正确目录。点击 **Commit changes**，提交至 `main`。
4. 如果要合并到已有仓库：上传时选择 **Create a new branch for this commit and start a pull request**，创建 PR，检查 **Files changed**，再点击 **Merge pull request → Confirm merge**。首次没有文件差异可直接上传新仓库。
5. 点击仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
6. 点击 **Actions → Deploy IELTS Words → Run workflow → main → Run workflow**。若尚未显示工作流，请确认 `.github/workflows/deploy.yml` 在 `main` 分支。
7. 等待 `build` 和 `deploy` 均变绿。进入 **Settings → Pages** 点击 **Visit site**。通常地址是 `https://你的用户名.github.io/ielts-words/`。

### 方式二：使用 Git 命令或请开发者协助

已存在仓库时，先在该仓库中创建分支并放入项目文件：

```bash
git switch -c feat/ielts-words
git add .
git commit -m "Add IELTS Words vocabulary learning app"
git push -u origin feat/ielts-words
```

然后在 GitHub 点击 **Compare & pull request → Create pull request**，检查改动后 **Merge pull request → Confirm merge**。

如果原本没有 Git 仓库，先在 GitHub 创建一个空仓库，再在本地项目目录执行（把地址替换为自己的仓库）：

```bash
git init -b main
git add .
git commit -m "Create IELTS Words"
git remote add origin https://github.com/你的用户名/ielts-words.git
git push -u origin main
```

不要把字面量“你的用户名”当成真实地址。然后按上面第 5–7 步启用 Pages。

### 路径与路由

Vite 默认 `base` 为 `./`；GitHub Actions 构建时设置 `VITE_BASE_PATH` 为 `/仓库名/`，无需你手动修改配置。用户名根站点仓库（`用户名.github.io`）使用 `/`。自定义域名根路径部署时也应设为 `/`。

```bash
VITE_BASE_PATH=/ielts-words/ npm run build
```

Windows PowerShell 可先运行 `$env:VITE_BASE_PATH='/ielts-words/'`，再运行 `npm run build`。页面导航用 SPA 内部状态，不生成子路径，因此刷新不会遇到 GitHub Pages 的路由 404；刷新回首页，已保存进度保留。

如果部署失败，先到 **Actions** 点击红色任务查看出错步骤。若 `deploy` 提示 Pages 未启用，重新确认 Settings → Pages → Source 为 GitHub Actions；若页面空白，检查仓库名与构建 base 是否对应，且文件完整上传。

## 在 iPhone Safari 添加到主屏幕

1. 用 **Safari** 打开部署后的 HTTPS 地址，先学习一个词并刷新，确认累计学习仍为 1。
2. 点 Safari 的 **分享**按钮（方框向上箭头）。
3. 向下找到并点击 **添加到主屏幕**（有的版本需在分享菜单中滚动）。
4. 名称填“雅思词伴”，点右上角 **添加**。如果系统提供“作为网页 App 打开”，可开启。
5. 从主屏幕图标进入。不同 iOS 版本的主屏幕网页 App 和 Safari 可能使用不同存储空间；如果进度未共享，在 Safari 先导出备份，再在主屏幕 App 中导入。

本版未提供 Service Worker/离线缓存，首次加载网页需要联网。添加主屏幕不等于 App Store 原生应用或跨设备同步。iPhone 的真实发音声音、虚拟键盘和系统文件选择器仍需要实际设备验收。

## 项目结构

- `src/core.ts`：日期、新词计划、复习算法、拼写、备份验证等纯逻辑。
- `src/storage.ts`：IndexedDB 存取和并发覆盖保护。
- `src/main.tsx`：完整应用界面与操作流程。
- `src/style.css`：移动与桌面适配、安全区域。
- `src/words.json`：100 词演示词库。
- `tests/core.test.ts`：可执行的核心和持久化测试。
- `e2e/app.spec.ts`：手机尺寸浏览器端到端测试。
- `.github/workflows/deploy.yml`：检查、构建、发布至 Pages。

## 验收记录

具体执行结果与限制见 `TEST-RESULTS.md`。没有学过词时所有统计均从零开始；界面不填充虚假成绩。
