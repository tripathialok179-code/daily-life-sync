
export enum Timeframe {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  timeframe: Timeframe;
  completed: boolean;
  completedAt?: string;
  archived?: boolean; // If true, it's in achievements
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'calm';
  tags: string[];
}

export interface CustomListItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface CustomList {
  id: string;
  title: string;
  items: CustomListItem[];
  color: string;
}

export type AppView = 'todo' | 'journal' | 'lists' | 'calendar' | 'settings';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeColor = 'blue' | 'purple' | 'rose' | 'orange' | 'emerald' | 'slate';
