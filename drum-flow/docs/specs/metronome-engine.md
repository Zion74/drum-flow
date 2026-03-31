# 节拍器引擎 Spec

> 版本：1.1 | 最后更新：2026-03-31
> 覆盖范围：`src/metronome/`

---

## 1. 模块结构

```
src/metronome/
├── engine.ts      # 核心调度引擎，管理 beat/sub-tick 时序
├── patterns.ts    # 节奏型定义与预设数据
├── modes.ts       # AccelMode / SilentMode 高阶模式
├── sounds.ts      # 音色加载与播放
└── hooks.ts       # React Hook，组合以上模块供 UI 使用
```

---

## 2. 核心概念

### 2.1 Beat vs Sub-tick

- **Beat**：拍号分子定义的拍数。4/4 拍有 4 个 beat（0~3）。
- **Sub-tick**：每个 beat 内部的细分击点。由该 beat 的 `RhythmPattern` 决定。
- **Offset**：sub-tick 在 beat 内的相对位置，`[0.0, 1.0)`，0.0 = beat 起点。

### 2.2 时序计算

```
beatMs = 60000 / bpm

// 同一 beat 内相邻 sub-tick 的间隔：
delay = beatMs * (nextOffset - currentOffset)

// 跨 beat 时（当前 beat 最后一个 sub-tick → 下一 beat 第一个 sub-tick）：
delay = beatMs * (1.0 - lastOffset) + beatMs * nextBeatFirstOffset
```

`nextBeatFirstOffset` 通常为 0，但理论上允许非零（当前预设均为 0）。

### 2.3 Drift 修正

每次 tick 记录 `expectedDelay`（本次应等待的毫秒数）和 `lastTickTime`。

```
drift = (Date.now() - lastTickTime) - expectedDelay
nextDelay = max(1, delay - drift)
```

注意：`expectedDelay` 在 sub-tick 模式下是**变长**的，每次 tick 后更新为当前 `delay`，不再是固定的 `beatMs`。

---

## 3. MetronomeEngine API

### 3.1 状态字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `bpm` | `number` | 当前 BPM，范围 [40, 208] |
| `timeSignature` | `[number, number]` | [beats, noteValue]，如 [4, 4] |
| `currentBeat` | `number` | 当前拍索引，[0, beats) |
| `currentSubTick` | `number` | 当前 sub-tick 索引，[0, subTicks.length) |
| `isPlaying` | `boolean` | 是否正在播放 |
| `soundPreset` | `SoundPreset` | 当前音色 |
| `accentVolume` | `number` | 强拍音量 [0, 1] |
| `normalVolume` | `number` | 弱拍音量 [0, 1] |
| `beatPatterns` | `RhythmPattern[]` | 每拍的节奏型，长度 = beats |

### 3.2 强拍定义

**强拍 = beat 0 的 sub-tick 0**，即整小节第一个击点。其余所有 sub-tick 均为弱拍。

### 3.3 setTimeSignature 副作用

调用 `setTimeSignature` 时：
1. 重置 `currentBeat = 0`，`currentSubTick = 0`。
2. 自动调整 `beatPatterns` 长度：
   - 新 beats > 旧长度：末尾补 `DEFAULT_PATTERN`（四分音符）。
   - 新 beats < 旧长度：截断末尾。
   - 已有 pattern 不变。

### 3.4 BeatCallback 签名变更

```ts
// v1.0（旧）
type BeatCallback = (beat: number, isAccent: boolean) => void

// v1.1（当前）
type BeatCallback = (beat: number, isAccent: boolean, subTick: number) => void
```

**迁移注意**：所有 `setOnBeat` 的回调必须接受第三个参数 `subTick`。

---

## 4. 节奏型系统 Spec

### 4.1 数据结构

```ts
interface SubTick {
  offset: number;   // [0.0, 1.0)，beat 内相对位置
  isRest: boolean;  // true = 不发声，但仍占时值
}

interface RhythmPattern {
  id: string;
  name: string;       // 中文名，用于 UI 展示
  label: string;      // 符号标记，用于格子内显示
  category: 'basic' | 'combo' | 'triplet' | 'rest';
  subTicks: SubTick[];
}
```

### 4.2 预设节奏型清单

| ID | 名称 | 类别 | Sub-tick offsets |
|----|------|------|-----------------|
| `quarter` | 四分音符 | basic | [0] |
| `eighth-pair` | 两个八分 | basic | [0, 0.5] |
| `sixteenth-group` | 四个十六分 | basic | [0, 0.25, 0.5, 0.75] |
| `eighth-two-sixteenth` | 前八后十六 | combo | [0, 0.5, 0.75] |
| `two-sixteenth-eighth` | 前十六后八 | combo | [0, 0.25, 0.5] |
| `small-syncopation` | 小切分 | combo | [0, 0.25, 0.75] |
| `big-syncopation` | 大切分 | combo | [0, 0.25, 0.75] |
| `dotted-eighth-sixteenth` | 附点八分+十六 | combo | [0, 0.75] |
| `sixteenth-dotted-eighth` | 十六+附点八分 | combo | [0, 0.25] |
| `triplet` | 三连音 | triplet | [0, 1/3, 2/3] |
| `shuffle` | Shuffle | triplet | [0, 2/3] |
| `sextuplet` | 六连音 | triplet | [0, 1/6, 2/6, 3/6, 4/6, 5/6] |
| `rest-eighth` | 前休后八 | rest | [0(rest), 0.5] |
| `eighth-rest` | 前八后休 | rest | [0, 0.5(rest)] |
| `rest-two-sixteenth` | 休+两个十六 | rest | [0(rest), 0.5, 0.75] |
| `two-sixteenth-rest` | 两个十六+休 | rest | [0, 0.25, 0.5(rest)] |
| `single-sixteenth-1` | 第1个十六分 | rest | [0, 0.25(rest), 0.5(rest), 0.75(rest)] |
| `single-sixteenth-3` | 第3个十六分 | rest | [0(rest), 0.25(rest), 0.5, 0.75(rest)] |

**默认 pattern**：`quarter`（单个 sub-tick，offset=0，isRest=false）。

### 4.3 边界条件

- `subTicks` 数组不能为空（引擎不做防御，调用方保证）。
- `offset` 必须严格递增，否则 delay 计算会出现负值。
- 休止符 sub-tick 仍然参与时序调度，只是不发声。
- `isRest=true` 的 sub-tick 仍会触发 `BeatCallback`（UI 可据此更新进度）。

---

## 5. 模式系统

### 5.1 AccelMode

- 独立 `setInterval`，与 beat 时序无关。
- 每 `intervalSeconds`（15 | 30 | 60）增加 `incrementBpm`。
- 到达 `targetBpm` 时：设置精确值 → 触发 `onComplete` → 自动停止。
- **约束**：`startBpm < targetBpm`，否则构造函数抛出。
- BPM 变更实时生效（引擎下一个 tick 读取新 BPM）。

### 5.2 SilentMode

- 不独立调度，由 Hook 的 `BeatCallback` 驱动。
- **触发条件**：`beat === 0 && subTick === 0`（整小节起点）。
- 逻辑：计数已播放小节数，达到 `playBars` 后按 `silentFrequency` 概率触发静音。
- 静音期间：`engine.setMuted(true)`，节拍器继续运行但不发声。
- 静音持续 `silentBars` 小节后自动恢复。

### 5.3 模式互斥

同一时刻只能有一种模式激活。切换模式时：
1. 停止旧模式（`accelRef.current?.stop()` / `silentRef.current?.reset()`）。
2. 清空对应 ref。
3. 启动新模式。

`setNormalMode()` 只重置模式状态，**不停止引擎播放**。

---

## 6. Hook API（useMetronome）

### 6.1 暴露的方法

| 方法 | 说明 |
|------|------|
| `start()` | 启动引擎，预加载音色 |
| `stop()` | 停止引擎，重置所有模式 |
| `setBpm(bpm)` | 设置 BPM，立即生效 |
| `setTimeSignature(ts)` | 设置拍号，重置 beat/subTick |
| `setSoundPreset(preset)` | 切换音色，异步预加载 |
| `setVolumes(accent, normal)` | 设置音量 |
| `setBeatPattern(index, pattern)` | 设置单拍节奏型 |
| `setBeatPatterns(patterns)` | 批量设置所有拍节奏型 |
| `syncAllToFirst()` | 将第一拍 pattern 复制到所有拍 |
| `resetAllPatterns()` | 所有拍重置为 `quarter` |
| `startAccelMode(config)` | 启动渐进加速模式 |
| `startSilentMode(config)` | 启动沉默测试模式 |
| `setNormalMode()` | 切回普通模式（不停止播放） |

### 6.2 暴露的状态

| 字段 | 类型 | 说明 |
|------|------|------|
| `state` | `MetronomeState` | 引擎完整状态快照 |
| `mode` | `'normal' \| 'accel' \| 'silent'` | 当前激活模式 |
| `isSilent` | `boolean` | 当前是否处于静音段 |
| `accelProgress` | `AccelProgress \| null` | 加速模式进度，null = 非加速模式 |

---

## 7. 持久化

### 7.1 exercise_patterns 表

```sql
CREATE TABLE exercise_patterns (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES exercises(id),
  pattern_ids TEXT NOT NULL,  -- JSON array of pattern ID strings
  updated_at INTEGER NOT NULL
);
```

`pattern_ids` 示例：`["quarter","triplet","sixteenth-group","quarter"]`

### 7.2 读写时机

- **读**：进入练习页时，加载该 exercise 的 pattern 配置，调用 `setBeatPatterns()`。
- **写**：用户选择 pattern / 同步 / 重置后立即写入（upsert）。
- **无记录时**：使用引擎默认值（全部 `quarter`），不报错。

### 7.3 长度不一致处理

若 DB 中存储的 `pattern_ids` 长度与当前拍号 beats 不一致：
- 当前实现：直接 `setBeatPatterns(ids.map(getPattern))`，引擎的 `setTimeSignature` 已处理长度对齐。
- 实际效果：多余的 pattern 被截断，不足的补 `DEFAULT_PATTERN`。

---

## 8. 已知限制与未来扩展点

| 限制 | 说明 | 扩展方向 |
|------|------|---------|
| x/8 拍号的 pattern 语义 | 当前 pattern 以四分音符为基准单位，6/8 拍下"两个八分"实际是两个四分 | 引入 `baseUnit` 字段，按拍号 noteValue 缩放 offset |
| 自由节奏型编辑 | 只有预设，不能自定义 offset | 增加自定义 pattern 编辑器 |
| 多声部 | 每个 sub-tick 只有一个音色（强/弱） | 扩展 SubTick 支持多轨道 |
| Web 平台 | expo-audio 在 web 上行为未验证 | 增加 web 音频 fallback |
