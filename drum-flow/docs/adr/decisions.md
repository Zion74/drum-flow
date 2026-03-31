# ADR-001: 节拍器引擎从单拍调度改为 Sub-tick 调度

> 状态：已采纳 | 日期：2026-03-31

## 背景

原始引擎每拍触发一次 tick，每拍只能发一个声音。用户需要在每拍内部编辑节奏型（三连音、十六分、切分等），这要求引擎能在一拍内触发多个不等间隔的击点。

## 决策

引入 **offset-based sub-tick 模型**：每个 beat 关联一个 `RhythmPattern`，pattern 包含若干 `SubTick`，每个 sub-tick 有 `offset`（0.0~1.0，相对于 beat 时长的位置）和 `isRest` 标志。

引擎的 `tick()` 不再以固定 `beatMs` 间隔调度，而是根据相邻 sub-tick 的 offset 差计算可变 delay：

```
delay = beatMs * (nextOffset - currentOffset)
```

跨 beat 时：

```
delay = beatMs * (1.0 - lastOffset) + beatMs * nextBeatFirstOffset
```

Drift 修正从固定 `intervalMs` 改为每次 tick 后更新 `expectedDelay = delay`。

## 排除的方案

**方案 A：固定最小时间格（如 1/96 拍）**
- 优点：实现简单，所有节奏型都能表达。
- 排除原因：96 分音符精度下 120 BPM 时间格约 5.2ms，setTimeout 精度不足，会产生明显抖动；且大量空 tick 浪费 CPU。

**方案 B：每种节奏型独立实现调度逻辑**
- 排除原因：扩展性差，新增节奏型需修改引擎核心。

## 后果

- `BeatCallback` 签名增加第三个参数 `subTick: number`，所有调用方需更新。
- `SilentMode.onBarStart()` 的触发条件从 `beat === 0` 改为 `beat === 0 && subTick === 0`，否则每拍内多个 sub-tick 会多次触发小节计数。
- 默认 pattern（`quarter`，单个 sub-tick offset=0）时，行为与旧引擎完全一致，向后兼容。

---

# ADR-002: 音频库从 expo-av 迁移到 expo-audio

> 状态：已采纳 | 日期：2026-03-28

## 背景

项目升级到 Expo SDK 55 后，Expo Go 运行时报错 `Cannot find native module 'ExponentAV'`。expo-av 在 SDK 55 的 Expo Go 中已不再内置。

## 决策

迁移到 `expo-audio`（SDK 55 官方推荐替代）。

关键 API 变更：
- `Audio.Sound.createAsync()` → `createAudioPlayer(asset)`
- `sound.replayAsync()` → `await player.seekTo(0); player.play()`
- `Audio.setAudioModeAsync()` → `setAudioModeAsync()`（同名，不同包）

## 排除的方案

**保留 expo-av，降级 SDK**：用户手机 Expo Go 已是 SDK 55，降级会导致无法用 Expo Go 调试。

**使用 react-native-sound**：需要 native build，无法在 Expo Go 中运行。

## 后果

- `expo-av` 仍在 `package.json` 中（未清理），但代码中不再使用，可在下次清理依赖时移除。
- `seekTo(0)` 是异步操作，但 `play()` 不需要等待 seek 完成即可调用（实测可行）。

---

# ADR-003: 节奏型预设而非自由编辑

> 状态：已采纳 | 日期：2026-03-31

## 背景

用户需要编辑每拍内部的节奏型，包括三连音、切分、带休止符变体等。实现方式有两种：预设选择 vs 自由拖拽编辑。

## 决策

V1 采用**预设节奏型选择**（18 种），不做自由编辑器。

## 理由

- 手机屏幕上的自由拖拽编辑器（类似 DAW piano roll）交互复杂，开发量大，且触控精度不足。
- 18 种预设覆盖了架子鼓练习 90%+ 的场景（单击、双击、三连音、shuffle、切分等）。
- 预设方案的数据结构（offset array）天然支持未来扩展自定义 pattern，不需要重构引擎。

## 排除的方案

**自由编辑器**：用户可拖拽添加任意时值音符。排除原因：开发量 3-5x，手机操作体验差，当前阶段 YAGNI。

## 后果

- 无法表达附点四分音符（需要 offset=0, 下一拍 offset=0.5 的跨拍连音），当前预设不包含此类型。
- 未来扩展自定义 pattern 时，只需在 `patterns.ts` 增加条目，引擎无需修改。

---

# ADR-004: 本地存储优先，不做后端

> 状态：已采纳 | 日期：2026-03-28

## 背景

项目初期需要决定数据存储方案。

## 决策

纯本地存储：expo-sqlite + Drizzle ORM。

## 理由

- 个人练习数据隐私敏感，本地存储用户接受度更高。
- 无需处理网络、认证、同步冲突等复杂性，专注核心功能。
- Drizzle ORM 提供类型安全的查询，比原生 SQL 字符串更易维护。

## 后续扩展路径

若未来需要云同步：Supabase（自带 auth + realtime）是首选，与当前 Drizzle schema 兼容性好。

---

# ADR-005: 图表库选 react-native-gifted-charts 而非 victory-native

> 状态：已采纳 | 日期：2026-03-28

## 背景

统计页需要折线图展示 BPM 历史曲线。

## 决策

使用 `react-native-gifted-charts`。

## 理由

`victory-native` 依赖 `@shopify/react-native-skia`，需要原生构建（EAS Build），无法在 Expo Go 中运行。`react-native-gifted-charts` 纯 JS 实现，Expo Go 兼容。

## 后果

图表样式定制能力弱于 victory-native，但满足当前需求（折线图、柱状图）。

---

# ADR-006: 练习库点击先进详情页而非直接进节拍器

> 状态：已采纳 | 日期：2026-03-31

## 背景

原来练习库卡片点击直接跳转节拍器。用户没有机会看到练习说明、历史进度和 BPM 曲线。

## 决策

练习库 → 练习详情页 → 节拍器，增加一层详情页。

## 理由

- 用户需要在开始练习前了解动作说明和当前进度。
- 详情页展示历史 BPM 折线图，帮助用户决定今天从哪个 BPM 开始。
- 节拍器页仍可从详情页的"开始练习"按钮直接进入，不增加操作层级感。

## 后果

- `exercises.tsx` 的 `onPress` 从 `/metronome/${id}` 改为 `/exercise/${id}`。
- 新增路由 `app/exercise/[id].tsx`。
- 首页核心指标卡片（CoreIndicatorCard）仍直接跳转节拍器（快速入口，不变）。

---

# ADR-007: 热身方案编辑采用删除重建而非 diff 更新

> 状态：已采纳 | 日期：2026-03-31

## 背景

热身方案编辑页保存时，需要将内存中的 items 数组同步到 DB。items 可能被增删改序。

## 决策

保存时先 `DELETE WHERE routineId = id`，再批量 `INSERT` 所有当前 items。

## 理由

- warmup_items 没有业务外键依赖（没有其他表引用它），删除重建安全。
- diff 更新（计算增删改集合）代码复杂，且 items 数量通常 < 10，性能无差异。
- 简单实现，边界条件少（不需要处理 update 部分字段的情况）。

## 后果

- 每次保存都会重新生成所有 item 的 `id`（nanoid），历史 id 不保留。
- 若未来需要引用 warmup_item.id（如关联练习记录），需改为 diff 更新。
