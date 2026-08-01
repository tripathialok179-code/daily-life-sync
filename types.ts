export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;      // One-off due date or starting date for routines
  time: string | null;         // Optional time block (e.g. "07:30")
  recurrence: RecurrenceType;
  weekdays?: number[];         // For weekly: array of days of week (0 = Sunday, 1 = Monday, etc.)
  completedDates?: string[];   // For recurring: list of completed date strings ("yyyy-mm-dd")
  completed: boolean;          // For one-off tasks
  completedAt?: string;        // For one-off tasks
  archived?: boolean;          // Claimed as an achievement
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

// Utility: Get today's local date string as yyyy-mm-dd
export const getLocalTodayString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Utility: Format a local yyyy-mm-dd date safely avoiding timezone shifts
export const formatLocalDate = (dateStr: string, options: Intl.DateTimeFormatOptions): string => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr || '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, options);
};

// Helper: Safely migrate old tasks in localStorage to the new schema
export const migrateTodos = (todos: any[]): TodoItem[] => {
  if (!Array.isArray(todos)) return [];
  return todos.map(todo => {
    if (!todo || typeof todo !== 'object') return null;
    if (todo.timeframe && !todo.recurrence) {
      return {
        id: todo.id || crypto.randomUUID(),
        title: todo.title || 'Untitled Task',
        description: todo.description || '',
        dueDate: todo.dueDate || null,
        time: todo.time || null,
        recurrence: 'none',
        completed: Boolean(todo.completed),
        completedAt: todo.completedAt,
        archived: Boolean(todo.archived),
        completedDates: Array.isArray(todo.completedDates) ? todo.completedDates : []
      };
    }
    return {
      ...todo,
      id: todo.id || crypto.randomUUID(),
      title: todo.title || 'Untitled Task',
      description: todo.description || '',
      dueDate: todo.dueDate || null,
      time: todo.time || null,
      recurrence: todo.recurrence || 'none',
      completed: Boolean(todo.completed),
      completedDates: Array.isArray(todo.completedDates) ? todo.completedDates : []
    };
  }).filter(Boolean) as TodoItem[];
};

// Helper: Determine if a task/routine is active/due on a given date "yyyy-mm-dd"
export const isTaskActiveOnDate = (task: TodoItem, dateStr: string): boolean => {
  if (!task || !dateStr || typeof dateStr !== 'string') return false;

  if (!task.dueDate) {
    if (task.recurrence === 'daily') return true;
    if (task.recurrence === 'none') return false;
  } else {
    if (typeof task.dueDate === 'string' && dateStr < task.dueDate) return false;
  }

  switch (task.recurrence) {
    case 'none':
      return task.dueDate === dateStr;
    case 'daily':
      return true;
    case 'weekly':
      if (!task.weekdays || !Array.isArray(task.weekdays) || task.weekdays.length === 0) return false;
      const parts = dateStr.split('-');
      if (parts.length < 3) return false;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
      const dayOfWeek = new Date(year, month, day).getDay();
      return task.weekdays.includes(dayOfWeek);
    case 'monthly':
      if (!task.dueDate || typeof task.dueDate !== 'string') return false;
      const dueParts = task.dueDate.split('-');
      const currParts = dateStr.split('-');
      if (dueParts.length < 3 || currParts.length < 3) return false;
      const targetDay = parseInt(dueParts[2], 10);
      const currentDay = parseInt(currParts[2], 10);
      if (isNaN(targetDay) || isNaN(currentDay)) return false;
      return targetDay === currentDay;
    case 'yearly':
      if (!task.dueDate || typeof task.dueDate !== 'string' || task.dueDate.length < 5) return false;
      if (dateStr.length < 5) return false;
      const targetMonthDay = task.dueDate.substring(5); // "MM-DD"
      const currentMonthDay = dateStr.substring(5); // "MM-DD"
      return targetMonthDay === currentMonthDay;
    default:
      return false;
  }
};

// Helper: Determine if a task/routine is marked as completed on a given date
export const isTaskCompletedOnDate = (task: TodoItem, dateStr: string): boolean => {
  if (!task) return false;
  if (task.recurrence === 'none') {
    return Boolean(task.completed);
  }
  return Array.isArray(task.completedDates) ? task.completedDates.includes(dateStr) : false;
};
