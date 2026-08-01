import React, { useState, useMemo } from 'react';
import { TodoItem, JournalEntry, AppView, isTaskActiveOnDate, isTaskCompletedOnDate, getLocalTodayString, formatLocalDate } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Circle, Trophy, ArrowRight, Plus, X } from 'lucide-react';
import Ripple from './Ripple';
import { scheduleReminder, cancelReminder, generateNumericId, parseLocalDateAndTime } from '../utils/NotificationService';

interface CalendarViewProps {
  todos: TodoItem[];
  journalEntries: JournalEntry[];
  setTodos: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  navigateTo: (view: AppView) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ todos, journalEntries, setTodos, setJournalEntries, navigateTo }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const renderGrid = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const todayStr = getLocalTodayString();

    return (
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">
            {d}
          </div>
        ))}
        
        {blanks.map(x => <div key={`blank-${x}`} className="aspect-square bg-transparent" />)}
        
        {daysArray.map(day => {
          const dateStr = formatDate(year, month, day);
          const isToday = dateStr === todayStr;
          
          // Compute dynamic status
          const activeTasks = todos.filter(t => !t.archived && isTaskActiveOnDate(t, dateStr));
          const hasUncompleted = activeTasks.some(t => !isTaskCompletedOnDate(t, dateStr));
          const hasCompleted = activeTasks.length > 0 && activeTasks.every(t => isTaskCompletedOnDate(t, dateStr));
          const hasJournal = journalEntries.some(j => j.date === dateStr);
          
          const hasActivity = activeTasks.length > 0 || hasJournal;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(dateStr)}
              className={`
                relative aspect-square rounded-3xl flex flex-col items-center justify-start pt-2 transition-all duration-300 group overflow-hidden
                ${dateStr === selectedDate 
                  ? 'ring-2 ring-brand-500 z-10 bg-white/90 dark:bg-gray-800/90 shadow-xl scale-110 backdrop-blur-md' 
                  : 'glass-card hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-lg hover:scale-[1.05]'}
              `}
            >
              <Ripple />
              <span className={`
                text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 transition-colors
                ${isToday ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-gray-500 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-300'}
              `}>
                {day}
              </span>
              
              {/* Dots Indicator with high-end glowing effect */}
              <div className="flex gap-1 items-center mt-1 pointer-events-none">
                {hasJournal && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_5px_rgba(192,132,252,0.8)]" />}
                {hasUncompleted && <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_5px_rgba(56,189,248,0.8)]" />}
                {hasCompleted && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const toggleTask = (todo: TodoItem) => {
    if (!selectedDate) return;
    if (todo.recurrence === 'none') {
      const nextStatus = !todo.completed;
      if (nextStatus) {
        cancelReminder(generateNumericId(todo.id));
        cancelReminder(generateNumericId(todo.id + "_early"));
      }
      setTodos(prev => prev.map(t => {
        if (t.id === todo.id) {
          return { ...t, completed: nextStatus, completedAt: nextStatus ? new Date().toISOString() : undefined };
        }
        return t;
      }));
    } else {
      const completed = todo.completedDates || [];
      const nextCompleted = completed.includes(selectedDate)
        ? completed.filter(d => d !== selectedDate)
        : [...completed, selectedDate];

      setTodos(prev => prev.map(t => {
        if (t.id === todo.id) {
          return { ...t, completedDates: nextCompleted };
        }
        return t;
      }));
    }
  };

  const handleWriteJournal = () => {
    if (!selectedDate) return;
    const newId = crypto.randomUUID();
    const newEntry: JournalEntry = {
      id: newId,
      date: selectedDate,
      title: '',
      content: '',
      mood: 'neutral',
      tags: []
    };
    setJournalEntries(prev => [newEntry, ...prev]);
    navigateTo('journal');
  };

  // Schedule 15-minute early reminders for active tasks (acting as calendar events)
  useEffect(() => {
    try {
      if (!Array.isArray(todos)) return;
      todos.forEach(todo => {
        if (todo && !todo.archived && todo.time && todo.dueDate && !todo.completed) {
          const scheduleTime = parseLocalDateAndTime(todo.dueDate, todo.time);
          
          // 15 minutes before the event
          const earlyReminderTime = new Date(scheduleTime.getTime() - 15 * 60000);
          
          if (earlyReminderTime > new Date()) {
            const earlyId = generateNumericId(todo.id + "_early");
            scheduleReminder(earlyId, `Upcoming: ${todo.title}`, `Starts in 15 minutes!`, earlyReminderTime).catch(console.error);
          }
        }
      });
    } catch (e) {
      console.error("Calendar reminder error:", e);
    }
  }, [todos]);

  const renderDetails = () => {
    if (!selectedDate) return null;

    const activeTasks = todos.filter(t => !t.archived && isTaskActiveOnDate(t, selectedDate));
    const journalEntry = journalEntries.find(j => j.date === selectedDate);
    const formattedDate = formatLocalDate(selectedDate, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
      <div className="fixed inset-0 z-[60] flex justify-end bg-gray-900/20 backdrop-blur-sm transition-all duration-500" onClick={() => setSelectedDate(null)}>
        <div className="w-full max-w-md glass-panel h-full shadow-2xl border-l border-white/20 p-8 overflow-y-auto animate-slide-in-right m-2 sm:m-4 rounded-[2.5rem]" onClick={e => e.stopPropagation()}>
          
          <div className="flex items-center justify-between mb-10">
             <h3 className="text-2xl font-bold font-display text-gray-900 dark:text-white leading-tight">{formattedDate}</h3>
             <button onClick={() => setSelectedDate(null)} className="relative overflow-hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 transition-colors">
               <Ripple />
               <X size={24} />
             </button>
          </div>

          {/* Journal Section */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center px-2">
              <BookOpen size={14} className="mr-2 text-purple-500" />
              Daily Journal
            </h4>
            {journalEntry ? (
              <div className="bg-purple-50/50 dark:bg-purple-900/10 p-6 rounded-[2rem] border border-purple-100/50 dark:border-purple-900/20 shadow-sm backdrop-blur-md relative overflow-hidden">
                <h5 className="font-bold text-xl text-gray-900 dark:text-white font-display mb-2">{journalEntry.title || 'Untitled Entry'}</h5>
                <p className="text-gray-600 dark:text-gray-300 text-base line-clamp-4 font-serif italic mb-4 leading-relaxed">"{journalEntry.content}"</p>
                <button 
                  onClick={() => navigateTo('journal')}
                  className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center"
                >
                  Read Full Entry <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50/40 dark:bg-gray-800/40 rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 text-sm mb-4">No journal entry recorded for this day.</p>
                <button 
                  onClick={handleWriteJournal}
                  className="relative overflow-hidden inline-flex items-center px-5 py-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-700 rounded-full text-sm font-bold shadow-sm transition-all"
                >
                   <Ripple />
                   <Plus size={16} className="mr-2 text-purple-500" /> Write Entry
                </button>
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
             <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center px-2">
              <Circle size={14} className="mr-2 text-brand-500" />
              Goals & Routines
            </h4>
            <div className="space-y-3">
              {activeTasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic px-2">No active tasks or routines scheduled.</p>
              ) : (
                activeTasks.map(task => {
                  const completed = isTaskCompletedOnDate(task, selectedDate);
                  return (
                    <div key={task.id} className="relative overflow-hidden flex items-center p-4 rounded-[2rem] glass-card shadow-sm backdrop-blur-sm transition-all hover:scale-[1.02]">
                      <Ripple className="bg-gray-400/10" />
                      <button 
                        onClick={() => toggleTask(task)}
                        className={`relative overflow-hidden rounded-full flex-shrink-0 mr-4 ${completed ? 'text-green-500' : 'text-gray-300 hover:text-brand-500'}`}
                      >
                        <Ripple className="bg-gray-500/20" />
                        {completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                      <div className="min-w-0 pointer-events-none">
                         <p className={`text-base font-semibold truncate ${completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</p>
                         {task.time && <p className="text-[10px] text-brand-500 font-bold">⏰ {task.time}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-20">
       <div className="flex items-center justify-between px-2">
         <div>
            <h1 className="text-4xl font-bold font-display text-gray-900 dark:text-white">Calendar</h1>
            <p className="text-gray-500 font-light text-lg mt-1">Holistic view of all dynamic routines and memories.</p>
         </div>
         
         <div className="flex items-center glass-panel rounded-full shadow-sm p-1.5">
           <button onClick={() => handleMonthChange(-1)} className="relative overflow-hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
             <Ripple />
             <ChevronLeft size={20} />
           </button>
           <span className="px-4 font-bold font-display text-gray-900 dark:text-white min-w-[120px] text-center text-lg">
             {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
           </span>
           <button onClick={() => handleMonthChange(1)} className="relative overflow-hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
             <Ripple />
             <ChevronRight size={20} />
           </button>
         </div>
       </div>

       <div className="glass-panel rounded-[2.5rem] shadow-xl p-6 sm:p-8 overflow-hidden border-0">
          {renderGrid()}
       </div>
       
       {renderDetails()}
    </div>
  );
};

export default CalendarView;
