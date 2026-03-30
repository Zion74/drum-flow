# DrumFlow — 架子鼓科学训练 App 设计文档

## 1. 项目概述

DrumFlow 是一个架子鼓科学训练工具，核心定位是「训练记录 + 智能节拍器」。帮助鼓手系统化练习、追踪 BPM 进步、提供清晰的进步路径。

### 目标用户

- 初学者（0-1年）和中级鼓手（1-3年），架构预留进阶级别扩展空间

### 核心价值

- 每个练习动作绑定独立 BPM 历史，直观看到进步曲线
- 智能节拍器（渐进加速、沉默测试）辅助科学提速
- 预设训练计划解决"不知道练什么"的问题
- 核心指标动作（单击/双击/复合跳）突出展示，像健身三大项一样量化进步

### 技术栈

| 层级     | 技术                              |
| -------- | --------------------------------- |
| 框架     | React Native + Expo SDK 52       |
| 路由     | Expo Router（文件路由）           |
| 语言     | TypeScript                        |
| 音频     | expo-av（预加载音色文件）         |
| 本地存储 | expo-sqlite + Drizzle ORM        |
| UI 组件  | React Native Paper               |
| 图表     | victory-native                   |
| 动画     | react-native-reanimated          |

> 音频精度说明：expo-av 作为 V1 方案，需在实现初期做技术验证（iOS/Android 双端测试节拍精度）。如精度不足，备选方案为 react-native-audio-api 或原生桥接模块。

### 架构方案

模块化架构，按功能域分模块，共享核心层。

---

## 2. 项目结构

```text
drum-flow/
├── app/                        # Expo Router 页面
│   ├── (tabs)/                 # Tab 导航
│   │   ├── index.tsx           # 首页/今日计划
│   │   ├── exercises.tsx       # 练习库
│   │   ├── songs.tsx           # 打歌清单
│   │   └── profile.tsx         # 个人/统计
│   ├── metronome/[id].tsx      # 节拍器练习页
│   ├── exercise/[id].tsx       # 练习详情页
│   ├── warmup/edit.tsx         # 热身流程编排页
│   └── plan/edit.tsx           # 训练计划编辑页
├── src/
│   ├── metronome/              # 节拍器引擎
│   │   ├── engine.ts           # 核心调度
│   │   ├── sounds.ts           # 音色管理
│   │   ├── modes.ts            # 渐进加速 / 沉默测试
│   │   └── hooks.ts            # useMetronome() React Hook
│   ├── exercises/              # 练习管理
│   │   ├── presets.ts          # 预设练习库
│   │   ├── categories.ts       # 分类定义
│   │   └── types.ts            # 类型定义
│   ├── training/               # 训练计划
│   │   ├── plans.ts            # 预设计划模板
│   │   ├── templates.ts        # 每日计划模板选择逻辑
│   │   └── progress.ts         # 进度计算
│   ├── songs/                  # 打歌模块
│   │   ├── types.ts            # 歌曲类型
│   │   └── tracker.ts          # 进度追踪
│   ├── history/                # 数据记录
│   │   ├── recorder.ts         # 练习记录
│   │   ├── bpm-history.ts      # BPM 历史查询（从 practice_sessions 派生）
│   │   └── charts.ts           # 进步曲线数据
│   └── storage/                # 本地存储
│       ├── database.ts         # SQLite 初始化
│       ├── schemas.ts          # 表结构定义
│       └── migrations.ts       # 数据迁移
├── components/                 # 共享 UI 组件
├── assets/sounds/              # 节拍器音色文件
└── constants/                  # 全局常量
```

---

## 3. 节拍器引擎

### 3.1 核心引擎 MetronomeEngine

状态：

- `bpm`: number（范围 40-208）
- `timeSignature`: [beats, noteValue]（支持 2/4, 3/4, 4/4, 6/8）
- `currentBeat`: number
- `isPlaying`: boolean
- `soundPreset`: SoundPreset

调度机制：

- lookahead 模式，提前 100ms 调度音频播放
- 预加载音频 buffer，避免播放延迟
- beat 回调通知 UI 更新

音色管理：

- 强拍音色（accent）和弱拍音色（normal）独立设置
- 预设音色包：木鱼、电子、经典
- 音量独立控制

### 3.2 三种训练模式

**普通模式：**

- 固定 BPM 播放
- 手动调节 BPM、拍号、音色

**渐进加速模式：**

- 用户设定：起始 BPM、目标 BPM、间隔时间（15s/30s/60s 可选）、增量（1-5 BPM 可选）
- 到达目标 BPM 后自动停止
- UI 显示当前 BPM / 目标 BPM 进度条
- 约束：起始 BPM 必须小于目标 BPM（不支持减速模式）
- 用户手动调节 BPM 时，渐进加速从新值继续（不重置）

**沉默测试模式：**

- 正常播放后随机静音，训练内部时钟
- 可配置参数：
  - `playBars`: 正常播放小节数（默认 4，范围 2-8）
  - `silentBars`: 静音小节数（默认 1，范围 1-2）
  - `silentFrequency`: 静音触发概率（默认 50%，范围 25%-75%）
- 静音期间 UI 有视觉提示（屏幕变暗 + 小节计数动画）
- 恢复播放后用户自评：跟上了 / 没跟上
- 自评结果记录在 `PracticeSession.notes` 中，用于统计沉默测试通过率

### 3.3 BPM 历史链接

每个练习动作绑定独立的 BPM 记录：

1. 用户选择某个练习（如"双击 开-闭-开"）
2. 自动查询该练习最后一次成功的 BPM
3. 节拍器自动设置为该 BPM
4. 练习结束后记录新的 BPM（成功/失败）
5. 下次打开同一练习自动加载最新成功 BPM

BPM 历史不单独建表，直接从 `practice_sessions` 表查询：

```sql
-- 获取某练习最后一次成功的 BPM
SELECT endBpm FROM practice_sessions
WHERE exerciseId = ? AND success = true
ORDER BY date DESC LIMIT 1
```

---

## 4. 练习库

### 4.1 三大分类

| 大类                 | 说明       | 初学者示例                                    | 中级示例                                      |
| -------------------- | ---------- | --------------------------------------------- | --------------------------------------------- |
| 哑鼓垫基本功 (pad)   | 手法技巧   | 单击（RLRL）、双击（RRLL）、复合跳            | 重音移位、Flam、Drag、Paradiddle 变体         |
| 套鼓协调 (kit)       | 四肢协调   | 基础节奏型（8beat、16beat）、踩镲开合         | 线性节奏、Ghost Note、手脚分离                |
| 音乐性 (musicality)  | 律动和表现力 | 力度控制、基础 Shuffle                        | Swing、Funk Groove、动态变化                  |

注意：打歌（Song）作为独立模块管理（见第 7 节），不属于 Exercise 分类。

### 4.2 练习数据结构

```typescript
interface Exercise {
  id: string                    // nanoid 生成
  name: string                  // "双击 开-闭-开"
  category: 'pad' | 'kit' | 'musicality'
  level: 'beginner' | 'intermediate' | 'advanced'
  description: string
  defaultBpm: number
  defaultTimeSignature: [number, number]
  tags: string[]
  mediaUrl?: string             // B站视频链接 / 鼓谱图片路径
  isCustom: boolean             // 是否用户自建
  createdAt: Date
  updatedAt: Date
}
```

### 4.3 用户操作

- 浏览预设练习库，按分类/级别筛选
- 自建练习项目（输入名称、分类、附加鼓谱图片或B站链接）
- 每个练习项目独立绑定 BPM 历史

---

## 5. 热身模块

### 5.1 热身练习库

热身可跳过，用户可自由选择和编排顺序：

| 分类     | 具体练习                         | 需要鼓谱 |
| -------- | -------------------------------- | -------- |
| 单击基础 | RLRL 单击、速度阶梯              | 否       |
| 重音移位 | 重音在1拍、2拍、3拍、4拍轮换     | 是       |
| 重音轻音 | tap-accent 组合、ppp-fff 力度控制 | 是       |
| 节奏型   | 前十六后八、前八后十六、切分音   | 是       |
| 三连音   | 基础三连音、带重音三连音         | 是       |
| 双击     | 开-闭-开、双击滚奏               | 否       |
| 双脚协调 | 单踩+手、双踩交替、手脚分离     | 是       |
| 混合练习 | 八十六混合、复合节奏型           | 是       |

### 5.2 热身流程编排

```typescript
interface WarmupRoutine {
  id: string                    // nanoid 生成
  name: string                  // "我的热身流程"
  items: WarmupItem[]
  isPreset: boolean
  createdAt: Date
  updatedAt: Date
}

interface WarmupItem {
  id: string
  routineId: string             // FK → WarmupRoutine.id
  exerciseId: string            // FK → Exercise.id
  order: number
  durationMinutes: number
  startBpm: number
  targetBpm?: number            // 开启渐进加速时的目标
  useAccelMode: boolean         // 是否开启渐进提速
}
```

### 5.3 鼓谱展示

采用图片条带式展示（卷轴滚动）：

- 每条鼓谱是一张图片，纵向排列
- 当前练习的鼓谱条高亮
- 上方可看到已完成的，下方预览下一条
- 重复的鼓谱条标注"还需重复 x 次"，不重复显示图片
- 自动跟随节拍器按小节滚动（所有小节继承练习的 `defaultTimeSignature`）

```typescript
interface DrumSheet {
  id: string
  exerciseId: string            // FK → Exercise.id
  bars: BarItem[]
}

interface BarItem {
  id: string
  drumSheetId: string           // FK → DrumSheet.id
  order: number
  imageUri: string              // 鼓谱图片
  repeatCount: number           // 重复次数，1 = 不重复
  label?: string                // 可选标注，如 "加速段"
}
```

UI 行为：

- 练习开始 → 第一条高亮，下方预览第二条
- 每完成一条（含重复）→ 自动滚动到下一条
- 重复时显示 "第 2/4 次" 计数器
- 用户可手动上下滑动查看

---

## 6. 训练计划

### 6.1 预设计划模板

| 模板       | 时长    | 内容                                                    |
| ---------- | ------- | ------------------------------------------------------- |
| 快速热身   | 15 分钟 | 单击 → 双击 → 复合跳，各 5 分钟                        |
| 基本功专练 | 30 分钟 | 热身 5min → 重点手法 20min → 沉默测试 5min              |
| 综合训练   | 60 分钟 | 热身 10min → 基本功 20min → 套鼓 20min → 打歌 10min    |
| 套鼓专练   | 45 分钟 | 基础节奏型 15min → 加花 15min → 歌曲应用 15min          |

### 6.2 数据结构

```typescript
interface TrainingPlan {
  id: string                    // nanoid 生成
  name: string
  totalMinutes: number
  items: PlanItem[]
  isPreset: boolean
  createdAt: Date
  updatedAt: Date
}

interface PlanItem {
  id: string
  planId: string                // FK → TrainingPlan.id
  exerciseId: string            // FK → Exercise.id
  durationMinutes: number
  order: number
  mode: 'normal' | 'accel' | 'silent'
}
```

### 6.3 每日流程

V1 的每日计划为静态模板选择：用户选择一个预设模板（或自建模板），每天打开 App 显示该模板的练习列表。不涉及动态生成逻辑。

1. 打开 App → 首页显示「今日计划」（基于用户选择的模板）
2. 热身环节（可跳过，可自定义热身流程）
3. 点击某个练习项 → 自动加载该练习的上次 BPM、拍号、音色
4. 开始练习 → 节拍器运行 → 练习结束标记成功/失败 BPM
5. 完成所有项目 → 记录今日训练完成

### 6.4 进步路径

- 内置从初学者到中级的推荐练习顺序
- 当某个练习的 BPM 稳定达到目标值后，提示"可以进入下一阶段"
- 建议性引导，不强制

---

## 7. 打歌模块

非核心功能，提供基础的歌曲清单和进度追踪。

```typescript
interface Song {
  id: string                    // nanoid 生成
  name: string
  artist: string
  bpm: number
  timeSignature: [number, number]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  videoUrl?: string             // B站链接
  drumSheetImages?: string[]
  notes?: string
  isCustom: boolean
  createdAt: Date
  updatedAt: Date
}

interface SongProgress {
  id: string
  songId: string                // FK → Song.id
  status: 'not_started' | 'learning' | 'practicing' | 'mastered'
  sections: SectionProgress[]
  lastPracticed: Date
  totalPracticeMinutes: number
}

interface SectionProgress {
  id: string
  songProgressId: string        // FK → SongProgress.id
  name: string                  // "前奏", "主歌", "副歌"
  status: 'not_started' | 'learning' | 'mastered'
  currentBpm: number
  targetBpm: number             // 原速
}
```

歌曲列表按状态分组（学习中/已掌握/未开始），支持按难度和风格筛选。
未来可支持导入网易云歌单（不播放音频）。

---

## 8. 数据统计 & 进步曲线

### 8.1 核心指标动作（"鼓手三大项"）

首页和统计页优先展示，类似健身三大项：

| 核心动作                  | 说明       | 衡量意义           |
| ------------------------- | ---------- | ------------------ |
| 单击 (Single Stroke)      | RLRL 交替  | 最基础的速度指标   |
| 双击 (Double Stroke)      | RRLL       | 手腕控制力指标     |
| 复合跳 (Paradiddle)       | RLRR LRLL  | 协调性指标         |

可选扩展核心（用户可自定义哪些算"核心"）：

- 左右手交替重音
- 三连音
- 双脚单踩/双踩

### 8.2 首页布局

```text
┌─────────────────────────────────┐
│  首页 - 今日概览                 │
│  ┌───────┐ ┌───────┐ ┌───────┐ │
│  │单击    │ │双击    │ │复合跳  │ │
│  │148 BPM │ │120 BPM │ │110 BPM│ │
│  │ ↑3     │ │ ↑2     │ │ ↑5    │ │
│  │ [曲线] │ │ [曲线] │ │ [曲线] │ │
│  └───────┘ └───────┘ └───────┘ │
│                                 │
│  今日已练 45min / 目标 60min     │
│  连续打卡 12 天                  │
│                                 │
│  [查看更多练习数据 →]            │
└─────────────────────────────────┘
```

- 核心动作卡片：当前最高 BPM、近期趋势箭头（↑↓）、迷你曲线图
- 点击卡片进入详细 BPM 历史曲线
- "查看更多"展开其他所有练习的数据
- 用户可在设置里自定义哪些动作放在核心位置

### 8.3 统计维度

| 维度         | 展示方式         | 说明                                   |
| ------------ | ---------------- | -------------------------------------- |
| BPM 进步曲线 | 折线图           | 每个练习独立曲线，横轴时间，纵轴 BPM   |
| 练习时长     | 柱状图/日历热力图 | 每日练习总时长，连续打卡天数           |
| 练习完成率   | 环形图           | 今日计划完成百分比                     |
| 分类时间分布 | 饼图             | 基本功/套鼓/音乐性/打歌各占比         |

### 8.4 练习记录数据结构

```typescript
interface PracticeSession {
  id: string                    // nanoid 生成
  exerciseId: string            // FK → Exercise.id
  date: Date
  durationSeconds: number
  startBpm: number
  endBpm: number
  maxBpm: number
  mode: 'normal' | 'accel' | 'silent'
  success: boolean
  notes?: string                // 沉默测试自评等备注
  createdAt: Date
}
```

### 8.5 个人统计页

- 周/月/全部时间范围切换
- 选择具体练习项目查看 BPM 曲线
- 总练习时长、总练习次数

---

## 9. 数据存储

纯本地存储，使用 expo-sqlite + Drizzle ORM。ID 统一使用 nanoid 生成。

### 9.1 数据库表及关系

| 表名              | 主键 | 外键                          | 用途                 |
| ----------------- | ---- | ----------------------------- | -------------------- |
| exercises         | id   | —                             | 练习项目（预设+自建）|
| warmup_routines   | id   | —                             | 热身流程             |
| warmup_items      | id   | routineId → warmup_routines   | 热身流程中的练习项   |
| training_plans    | id   | —                             | 训练计划             |
| plan_items        | id   | planId → training_plans       | 计划中的练习项       |
| songs             | id   | —                             | 歌曲清单             |
| song_progress     | id   | songId → songs                | 歌曲进度             |
| section_progress  | id   | songProgressId → song_progress | 歌曲分段进度         |
| practice_sessions | id   | exerciseId → exercises        | 练习记录 + BPM 历史  |
| drum_sheets       | id   | exerciseId → exercises        | 鼓谱数据             |
| bar_items         | id   | drumSheetId → drum_sheets     | 鼓谱小节             |
| user_settings     | id   | —                             | 用户设置             |

### 9.2 索引

- `practice_sessions`: `(exerciseId, success, date DESC)` — BPM 历史查询
- `practice_sessions`: `(date)` — 按日期统计
- `warmup_items`: `(routineId, order)` — 热身流程排序
- `plan_items`: `(planId, order)` — 计划排序
- `bar_items`: `(drumSheetId, order)` — 鼓谱排序

### 9.3 数据安全

- 预设数据使用固定 ID，App 更新时只新增不删除（避免破坏用户历史引用）
- V1.1 计划支持数据导出为 JSON，方便用户备份

---

## 10. 页面导航结构

Tab 导航（4个主 Tab）：

| Tab  | 页面      | 功能                                     |
| ---- | --------- | ---------------------------------------- |
| 首页 | index     | 今日概览、核心指标卡片、今日计划、快速开始 |
| 练习库 | exercises | 按分类浏览、搜索、自建练习               |
| 打歌 | songs     | 歌曲清单、进度追踪                       |
| 我的 | profile   | 统计图表、BPM 曲线、设置                 |

子页面：

- `metronome/[id]` — 节拍器练习页（含鼓谱展示）
- `exercise/[id]` — 练习详情页
- `warmup/edit` — 热身流程编排页
- `plan/edit` — 训练计划编辑页

---

## 11. 未来扩展（不在 V1 范围内）

- 云同步 / 多设备同步
- 导入网易云歌单
- 麦克风检测（沉默测试自动判定）
- 进阶级别练习内容
- 社区分享练习计划
- 触觉反馈（振动节拍，适合嘈杂环境练习）
- 数据导出为 JSON/CSV
