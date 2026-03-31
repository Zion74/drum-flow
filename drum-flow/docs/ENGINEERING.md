# DrumFlow 工程约定

> 版本：1.0 | 最后更新：2026-03-31
> 这份文档是新 AI session 或新开发者接手时的第一份阅读材料。

---

## 1. 快速上手

```bash
cd drum-flow
npm install
npx expo start --clear   # 用 Expo Go (SDK 55) 扫码
```

**注意**：Expo Go 必须是 SDK 55。SDK 54 不兼容。

---

## 2. Spec 文档索引

| 文档 | 内容 |
|------|------|
| `docs/specs/system.md` | 系统架构、目录约定、组件规范、音频约定 |
| `docs/specs/metronome-engine.md` | 节拍器引擎、节奏型系统、模式系统完整 Spec |
| `docs/specs/data-layer.md` | 数据库表结构、Migration 规范、查询服务 |
| `docs/adr/decisions.md` | 所有架构决策记录（为什么选了这个方案） |

**开发新功能前必读**：先读 system.md 了解约定，再读对应子系统 Spec，再看 ADR 了解历史决策背景。

---

## 3. 开发流程约定

### 3.1 每次功能开发后必须更新 Spec

- 新增模块 → 在对应 Spec 文件补充说明。
- 修改已有模块的 API / 行为 → 更新 Spec 中对应章节，标注版本号和日期。
- 做了架构决策（选了 A 而不是 B）→ 在 `docs/adr/decisions.md` 追加一条 ADR。

**Spec 的精度要求**：
- API 签名必须准确（参数类型、返回值、副作用）。
- 边界条件必须写明（空值、越界、并发）。
- 不写"大概"、"可能"——写不确定的地方就去看代码确认后再写。

### 3.2 新 AI Session 启动流程

1. 读 `docs/specs/system.md`（5 分钟）。
2. 读本文件（2 分钟）。
3. 根据任务读对应子系统 Spec。
4. 用 `npx tsc --noEmit` 验证当前代码状态。
5. 开始开发。

### 3.3 提交规范

```
feat: 添加节奏型编辑系统
fix: 修复 SilentMode 多次触发 onBarStart 的问题
docs: 更新节拍器引擎 Spec，补充 sub-tick 边界条件
refactor: 将 BeatVisualizer 迁移到 Reanimated 4.x
```

类型：`feat` / `fix` / `docs` / `refactor` / `chore`

---

## 4. 已知技术债

| 问题 | 位置 | 优先级 |
|------|------|--------|
| `expo-av` 仍在 package.json，未清理 | package.json | 低 |
| x/8 拍号下 pattern 语义不正确（以四分为基准） | patterns.ts | 中 |
| 练习页 `useEffect` 依赖数组缺少 `metronome` | metronome/[id].tsx | 低（功能正常） |
| 无全局错误边界 | app/_layout.tsx | 中 |
| `big-syncopation` 和 `small-syncopation` 的 offset 相同，语义重复 | patterns.ts | 低 |

---

## 5. 功能完成状态

### 已完成

- [x] 节拍器核心（BPM 调节、拍号、音色切换）
- [x] 渐进加速模式（AccelMode）
- [x] 沉默测试模式（SilentMode）
- [x] 每拍节奏型编辑（18 种预设，PatternSelectorModal）
- [x] BPM 历史记录与进步曲线
- [x] 核心动作指标卡片（首页）
- [x] 练习库（搜索、分类筛选）
- [x] 歌曲列表与进度追踪
- [x] 统计页（连续天数、每日时长、分类分布）
- [x] 节奏型持久化（exercise_patterns 表）

### 待开发

- [ ] 热身编排页（可自定义热身项目顺序和时长）
- [ ] 鼓谱卷轴页（图片条带式滚动 + 重复计数）
- [ ] 加速模式参数配置 UI（当前硬编码 +40 BPM / 30s / 2 BPM）
- [ ] 沉默模式参数配置 UI（当前硬编码 4 播 1 静）
- [ ] 练习详情页（说明 + 历史 BPM 折线图）
- [ ] x/8 拍号的 pattern 语义修正

---

## 6. 依赖版本锁定

关键依赖版本，升级前需验证：

| 包 | 版本 | 注意 |
|----|------|------|
| expo | ^55.0.0 | 与 Expo Go SDK 55 对应 |
| react-native-reanimated | 4.2.1 | API 与 3.x 不兼容 |
| expo-audio | ~55.0.9 | 替代 expo-av |
| drizzle-orm | ^0.45.2 | schema 变更需同步更新 migrations.ts |
| expo-sqlite | ~55.0.11 | 与 drizzle-orm/expo-sqlite 适配 |
