# DrumFlow 系统级 Spec

> 版本：1.0 | 最后更新：2026-03-31

## 1. 项目定位

面向架子鼓练习者的本地移动端训练工具。核心价值：科学记录 BPM 进步曲线、提供多种节拍器训练模式、管理练习计划与歌曲进度。

**平台**：React Native + Expo SDK 55，目标 iOS / Android（通过 Expo Go 开发验证）。
**数据**：纯本地，expo-sqlite + Drizzle ORM，无后端。

---

## 2. 目录约定

```
drum-flow/
├── app/                  # Expo Router 页面（文件即路由）
│   ├── (tabs)/           # 底部 Tab 四页：首页、练习库、歌曲、统计
│   └── metronome/[id].tsx  # 练习节拍器页（动态路由）
├── components/           # 纯 UI 组件，不直接访问 DB
├── src/
│   ├── exercises/        # 练习领域：类型、分类、预设数据
│   ├── metronome/        # 节拍器引擎、模式、节奏型、Hook
│   ├── history/          # 练习记录读写
│   └── storage/          # DB 初始化、Schema、Migration、Seed
├── assets/sounds/        # 节拍器音色 .wav 文件
└── docs/
    ├── specs/            # 子系统 Spec（本文件所在层）
    └── adr/              # 架构决策记录
```

**规则**：
- `components/` 只接收 props，不 import `src/storage`。
- 数据访问统一在 `app/` 页面或 `src/` 服务层，不在组件内直接 `db.select()`。
- 唯一例外：`app/` 页面可直接访问 DB（当前阶段无独立 service 层）。

---

## 3. 数据层约定

### 3.1 数据库初始化顺序

```
app/_layout.tsx (启动)
  → runMigrations()   # CREATE TABLE IF NOT EXISTS，幂等
  → runSeed()         # 写入预设数据，检查 seed_version 防重复
```

Migration 必须幂等（`IF NOT EXISTS`）。新增表在 `migrations.ts` 末尾追加，不修改已有语句。

### 3.2 主键规范

所有表主键使用 `nanoid()` 生成的字符串 ID，不使用自增整数。

### 3.3 时间戳规范

- `createdAt` / `updatedAt`：`integer('...', { mode: 'timestamp' })`，存 Unix 毫秒。
- 查询时用 `new Date()` 传入，Drizzle 自动转换。

### 3.4 JSON 字段

复杂数组（tags、patternIds 等）存为 JSON 字符串，读取时 `JSON.parse()`，写入时 `JSON.stringify()`。不使用 Drizzle 的 `json` 类型（SQLite 不原生支持）。

---

## 4. 路由约定

使用 Expo Router v3 文件路由。

| 路径 | 说明 |
|------|------|
| `app/(tabs)/index.tsx` | 首页：核心指标 + 今日统计 + 热身入口 |
| `app/(tabs)/exercises.tsx` | 练习库：搜索 + 筛选，点击进详情页 |
| `app/(tabs)/songs.tsx` | 歌曲列表 |
| `app/(tabs)/profile.tsx` | 统计页 |
| `app/exercise/[id].tsx` | 练习详情：说明 + BPM 折线图 + 开始按钮 |
| `app/metronome/[id].tsx` | 练习节拍器，`id` 为 exercise.id |
| `app/warmup/index.tsx` | 热身方案列表：查看/新建/删除 |
| `app/warmup/[id].tsx` | 热身方案编辑：排序/时长/BPM/加速模式 |

**导航流**：
- 练习库 → 练习详情 → 节拍器
- 首页热身按钮 → 热身方案列表 → 热身方案编辑

---

## 5. 组件规范

### 5.1 动画

使用 `react-native-reanimated` 4.x。
- 拍点动画：`withSpring`（弹跳感）。
- 进度条/透明度：`withTiming`（线性/缓动）。
- 不在 worklet 内调用 JS 函数，用 `runOnJS` 桥接。

### 5.2 UI 库

`react-native-paper` 提供基础组件（Button、Card、SegmentedButtons 等）。
主题色通过 `useTheme()` 获取，不硬编码颜色（除灰色系 `#333` / `#555` / `#888`）。

### 5.3 长按交互

BPM +/- 按钮：`Pressable` + `onPressIn/onPressOut`，400ms 后进入 80ms 间隔的连续触发。不使用 `TouchableOpacity`（已废弃）。

---

## 6. 音频约定

使用 `expo-audio`（SDK 55，替代已废弃的 `expo-av`）。

- 音色文件：`assets/sounds/*.wav`，6 个文件（3 套音色 × 强拍/弱拍）。
- 播放前必须 `seekTo(0)` 重置位置，再调 `play()`。
- 所有 player 缓存在 `playerCache: Map<string, AudioPlayer>`，避免重复创建。
- 必须调用 `setAudioModeAsync({ playsInSilentMode: true })` 确保静音模式下可播放。

---

## 7. 错误处理边界

- 音频播放错误：静默忽略（`try/catch` 空处理），不影响节拍调度。
- DB 操作错误：当前不做全局捕获，依赖 Expo 的 crash 上报（未来可加 ErrorBoundary）。
- 节拍器 stop 后的 setTimeout 回调：通过 `isPlaying` 标志位提前 return，不会产生副作用。
