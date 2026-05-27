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
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return date.toLocaleDateString(undefined, options);
};

// Helper: Safely migrate old tasks in localStorage to the new schema
export const migrateTodos = (todos: any[]): TodoItem[] => {
  if (!Array.isArray(todos)) return [];
  return todos.map(todo => {
    if (todo.timeframe && !todo.recurrence) {
      return {
        id: todo.id,
        title: todo.title,
        description: todo.description || '',
        dueDate: todo.dueDate || null,
        time: todo.time || null,
        recurrence: 'none',
        completed: todo.completed || false,
        completedAt: todo.completedAt,
        archived: todo.archived || false,
        completedDates: todo.completedDates || []
      };
    }
    return {
      ...todo,
      recurrence: todo.recurrence || 'none',
      completedDates: todo.completedDates || []
    };
  });
};

// Helper: Determine if a task/routine is active/due on a given date "yyyy-mm-dd"
export const isTaskActiveOnDate = (task: TodoItem, dateStr: string): boolean => {
  if (!task.dueDate) {
    if (task.recurrence === 'daily') return true;
    if (task.recurrence === 'none') return false;
  } else {
    if (dateStr < task.dueDate) return false;
  }

  switch (task.recurrence) {
    case 'none':
      return task.dueDate === dateStr;
    case 'daily':
      return true;
    case 'weekly':
      if (!task.weekdays || task.weekdays.length === 0) return false;
      const parts = dateStr.split('-');
      const dayOfWeek = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).getDay();
      return task.weekdays.includes(dayOfWeek);
    case 'monthly':
      if (!task.dueDate) return false;
      const targetDay = parseInt(task.dueDate.split('-')[2]);
      const currentDay = parseInt(dateStr.split('-')[2]);
      return targetDay === currentDay;
    case 'yearly':
      if (!task.dueDate) return false;
      const targetMonthDay = task.dueDate.substring(5); // "MM-DD"
      const currentMonthDay = dateStr.substring(5); // "MM-DD"
      return targetMonthDay === currentMonthDay;
    default:
      return false;
  }
};

// Helper: Determine if a task/routine is marked as completed on a given date
export const isTaskCompletedOnDate = (task: TodoItem, dateStr: string): boolean => {
  if (task.recurrence === 'none') {
    return task.completed;
  }
  return task.completedDates?.includes(dateStr) || false;
};
