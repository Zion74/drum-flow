import { ExerciseCategory } from './types';

export interface CategoryInfo {
  key: ExerciseCategory;
  label: string;
  description: string;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'pad', label: '哑鼓垫基本功', description: '手法技巧训练', icon: 'drum' },
  { key: 'kit', label: '套鼓协调', description: '四肢协调训练', icon: 'music-circle' },
  { key: 'musicality', label: '音乐性', description: '律动和表现力', icon: 'music-note' },
];
