# 数据层 Spec

> 版本：1.0 | 最后更新：2026-03-31
> 覆盖范围：`src/storage/`

---

## 1. 模块结构

```
src/storage/
├── database.ts     # DB 实例初始化（单例）
├── schemas.ts      # Drizzle 表定义
├── migrations.ts   # 手写 SQL migration（幂等）
└── seed.ts         # 预设数据写入
```

---

## 2. 表清单

| 表名 | 用途 |
|------|------|
| `exercises` | 练习动作库（预设 + 用户自定义） |
| `practice_sessions` | 每次练习记录 |
| `training_plans` | 训练计划模板 |
| `plan_items` | 训练计划中的练习项 |
| `warmup_routines` | 热身方案 |
| `warmup_items` | 热身方案中的练习项 |
| `songs` | 歌曲库 |
| `song_progress` | 歌曲练习进度 |
| `section_progress` | 歌曲段落进度 |
| `drum_sheets` | 鼓谱（关联 exercise） |
| `bar_items` | 鼓谱中的小节图片 |
| `exercise_patterns` | 每个练习保存的节奏型配置 |
| `user_settings` | KV 配置（seed_version、core_exercise_ids 等） |

---

## 3. 关键表字段说明

### 3.1 exercises

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PK | nanoid |
| `category` | TEXT | `pad` / `kit` / `musicality` |
| `level` | TEXT | `beginner` / `intermediate` / `advanced` |
| `defaultBpm` | INTEGER | 首次进入练习页的默认 BPM |
| `defaultTimeSignatureBeats` | INTEGER | 拍号分子 |
| `defaultTimeSignatureNoteValue` | INTEGER | 拍号分母 |
| `tags` | TEXT | JSON 字符串数组 |
| `isCustom` | INTEGER(boolean) | 0=预设，1=用户创建 |

### 3.2 practice_sessions

| 字段 | 类型 | 说明 |
|------|------|------|
| `exerciseId` | TEXT FK | 关联 exercises.id |
| `date` | INTEGER(timestamp) | 练习开始时间 |
| `startBpm` | INTEGER | 开始时 BPM |
| `endBpm` | INTEGER | 结束时 BPM |
| `maxBpm` | INTEGER | 本次练习达到的最高 BPM |
| `mode` | TEXT | `normal` / `accel` / `silent` |
| `success` | INTEGER(boolean) | 用户自评是否成功 |

**索引**：
```sql
CREATE INDEX idx_ps_bpm_lookup ON practice_sessions(exercise_id, success, date DESC);
CREATE INDEX idx_ps_date ON practice_sessions(date);
```

`idx_ps_bpm_lookup` 支持 `getLastSuccessBpm(exerciseId)` 查询（按 exercise + success=1 + 最新日期）。

### 3.3 exercise_patterns

| 字段 | 类型 | 说明 |
|------|------|------|
| `exerciseId` | TEXT FK | 关联 exercises.id |
| `patternIds` | TEXT | JSON 字符串数组，如 `["quarter","triplet","quarter","quarter"]` |
| `updatedAt` | INTEGER(timestamp) | 最后修改时间 |

每个 exercise 最多一条记录（upsert 语义）。

### 3.4 user_settings

KV 表，已知 key：

| key | value 格式 | 说明 |
|-----|-----------|------|
| `seed_version` | `"1"` | 防止重复 seed |
| `core_exercise_ids` | JSON 字符串数组 | 首页核心指标展示的 exercise ID 列表 |

---

## 4. Migration 规范

- 所有建表语句使用 `CREATE TABLE IF NOT EXISTS`，幂等。
- 新增表：在 `migrations.ts` 末尾追加，不修改已有语句。
- 不支持 ALTER TABLE（SQLite 限制多）。如需加字段，新建表 + 数据迁移，或用 user_settings 存 JSON 绕过。
- Migration 在 app 启动时同步执行（`_layout.tsx` 中 `await runMigrations()`）。

---

## 5. Seed 规范

- 检查 `user_settings.seed_version`，已存在则跳过。
- 预设 exercise 使用固定 ID（`preset-single-stroke` 等），确保跨设备一致。
- `core_exercise_ids` 写入 `user_settings`，首页读取时优先使用 DB 值，fallback 到代码常量 `CORE_EXERCISE_IDS`。

---

## 6. 查询服务

### 6.1 src/history/bpm-history.ts

| 函数 | 说明 |
|------|------|
| `getLastSuccessBpm(exerciseId)` | 返回该练习最近一次 success=true 的 endBpm，无记录返回 null |
| `getBpmHistory(exerciseId, limit)` | 返回最近 N 次记录的 [date, maxBpm] 数组，用于折线图 |
| `getMaxBpm(exerciseId)` | 返回历史最高 BPM |

### 6.2 src/history/charts.ts

| 函数 | 说明 |
|------|------|
| `getDailyStats(days)` | 返回最近 N 天每天的练习总秒数 |
| `getStreakDays()` | 返回连续打卡天数（今天或昨天有记录才算连续） |
| `getCategoryDistribution()` | 返回各 category 的练习时长占比 |

### 6.3 src/history/recorder.ts

| 函数 | 说明 |
|------|------|
| `recordSession(input)` | 写入一条 practice_session，自动生成 id 和 date |

**最短记录时长**：调用方负责过滤（当前页面判断 `duration < 3` 秒则不记录）。
