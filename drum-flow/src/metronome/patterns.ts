// ===== Sub-tick based rhythm pattern system =====

export interface SubTick {
  /** Position within the beat, 0.0 = beat start, 1.0 = next beat */
  offset: number;
  /** If true, no sound plays at this position */
  isRest: boolean;
}

export interface RhythmPattern {
  id: string;
  name: string;
  /** Short visual label for the beat cell */
  label: string;
  category: 'basic' | 'combo' | 'triplet' | 'rest';
  subTicks: SubTick[];
}

// ===== Basic patterns =====

const QUARTER: RhythmPattern = {
  id: 'quarter',
  name: '四分音符',
  label: '♩',
  category: 'basic',
  subTicks: [{ offset: 0, isRest: false }],
};

const EIGHTH_PAIR: RhythmPattern = {
  id: 'eighth-pair',
  name: '两个八分',
  label: '♪♪',
  category: 'basic',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.5, isRest: false },
  ],
};

const SIXTEENTH_GROUP: RhythmPattern = {
  id: 'sixteenth-group',
  name: '四个十六分',
  label: '♬♬♬♬',
  category: 'basic',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.25, isRest: false },
    { offset: 0.5, isRest: false },
    { offset: 0.75, isRest: false },
  ],
};

// ===== Combination patterns =====

const EIGHTH_TWO_SIXTEENTH: RhythmPattern = {
  id: 'eighth-two-sixteenth',
  name: '前八后十六',
  label: '♪♬♬',
  category: 'combo',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.5, isRest: false },
    { offset: 0.75, isRest: false },
  ],
};

const TWO_SIXTEENTH_EIGHTH: RhythmPattern = {
  id: 'two-sixteenth-eighth',
  name: '前十六后八',
  label: '♬♬♪',
  category: 'combo',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.25, isRest: false },
    { offset: 0.5, isRest: false },
  ],
};

const SMALL_SYNCOPATION: RhythmPattern = {
  id: 'small-syncopation',
  name: '小切分',
  label: '♬♪♬',
  category: 'combo',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.25, isRest: false },
    { offset: 0.75, isRest: false },
  ],
};

const BIG_SYNCOPATION: RhythmPattern = {
  id: 'big-syncopation',
  name: '大切分',
  label: '♪♩♪',
  category: 'combo',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.25, isRest: false },
    { offset: 0.75, isRest: false },
  ],
};

const DOTTED_EIGHTH_SIXTEENTH: RhythmPattern = {
  id: 'dotted-eighth-sixteenth',
  name: '附点八分+十六',
  label: '♪.♬',
  category: 'combo',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.75, isRest: false },
  ],
};

const SIXTEENTH_DOTTED_EIGHTH: RhythmPattern = {
  id: 'sixteenth-dotted-eighth',
  name: '十六+附点八分',
  label: '♬♪.',
  category: 'combo',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.25, isRest: false },
  ],
};

// ===== Triplet patterns =====

const TRIPLET: RhythmPattern = {
  id: 'triplet',
  name: '三连音',
  label: '♪♪♪',
  category: 'triplet',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 1 / 3, isRest: false },
    { offset: 2 / 3, isRest: false },
  ],
};

const SHUFFLE: RhythmPattern = {
  id: 'shuffle',
  name: 'Shuffle',
  label: '♪_♪',
  category: 'triplet',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 2 / 3, isRest: false },
  ],
};

const SEXTUPLET: RhythmPattern = {
  id: 'sextuplet',
  name: '六连音',
  label: '♬×6',
  category: 'triplet',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 1 / 6, isRest: false },
    { offset: 2 / 6, isRest: false },
    { offset: 3 / 6, isRest: false },
    { offset: 4 / 6, isRest: false },
    { offset: 5 / 6, isRest: false },
  ],
};

// ===== Rest patterns =====

const REST_EIGHTH: RhythmPattern = {
  id: 'rest-eighth',
  name: '前休后八',
  label: '𝄾♪',
  category: 'rest',
  subTicks: [
    { offset: 0, isRest: true },
    { offset: 0.5, isRest: false },
  ],
};

const EIGHTH_REST: RhythmPattern = {
  id: 'eighth-rest',
  name: '前八后休',
  label: '♪𝄾',
  category: 'rest',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.5, isRest: true },
  ],
};

const REST_TWO_SIXTEENTH: RhythmPattern = {
  id: 'rest-two-sixteenth',
  name: '休+两个十六',
  label: '𝄾♬♬',
  category: 'rest',
  subTicks: [
    { offset: 0, isRest: true },
    { offset: 0.5, isRest: false },
    { offset: 0.75, isRest: false },
  ],
};

const TWO_SIXTEENTH_REST: RhythmPattern = {
  id: 'two-sixteenth-rest',
  name: '两个十六+休',
  label: '♬♬𝄾',
  category: 'rest',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.25, isRest: false },
    { offset: 0.5, isRest: true },
  ],
};

const SINGLE_SIXTEENTH_1: RhythmPattern = {
  id: 'single-sixteenth-1',
  name: '第1个十六分',
  label: '♬𝄾𝄾𝄾',
  category: 'rest',
  subTicks: [
    { offset: 0, isRest: false },
    { offset: 0.25, isRest: true },
    { offset: 0.5, isRest: true },
    { offset: 0.75, isRest: true },
  ],
};

const SINGLE_SIXTEENTH_3: RhythmPattern = {
  id: 'single-sixteenth-3',
  name: '第3个十六分',
  label: '𝄾𝄾♬𝄾',
  category: 'rest',
  subTicks: [
    { offset: 0, isRest: true },
    { offset: 0.25, isRest: true },
    { offset: 0.5, isRest: false },
    { offset: 0.75, isRest: true },
  ],
};

// ===== Exports =====

export const ALL_PATTERNS: RhythmPattern[] = [
  QUARTER,
  EIGHTH_PAIR,
  SIXTEENTH_GROUP,
  EIGHTH_TWO_SIXTEENTH,
  TWO_SIXTEENTH_EIGHTH,
  SMALL_SYNCOPATION,
  BIG_SYNCOPATION,
  DOTTED_EIGHTH_SIXTEENTH,
  SIXTEENTH_DOTTED_EIGHTH,
  TRIPLET,
  SHUFFLE,
  SEXTUPLET,
  REST_EIGHTH,
  EIGHTH_REST,
  REST_TWO_SIXTEENTH,
  TWO_SIXTEENTH_REST,
  SINGLE_SIXTEENTH_1,
  SINGLE_SIXTEENTH_3,
];

export const PATTERN_MAP = new Map(ALL_PATTERNS.map((p) => [p.id, p]));

export const DEFAULT_PATTERN = QUARTER;

export function getPattern(id: string): RhythmPattern {
  return PATTERN_MAP.get(id) ?? DEFAULT_PATTERN;
}

export const PATTERN_CATEGORIES: { key: RhythmPattern['category']; label: string }[] = [
  { key: 'basic', label: '基础' },
  { key: 'combo', label: '组合' },
  { key: 'triplet', label: '连音' },
  { key: 'rest', label: '休止' },
];
