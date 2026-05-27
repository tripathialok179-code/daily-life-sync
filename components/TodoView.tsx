import React, { useState, useMemo, useEffect } from 'react';
import { TodoItem, Timeframe, getLocalTodayString, formatLocalDate, isTaskActiveOnDate, isTaskCompletedOnDate } from '../types';
import { Plus, Trash2, Calendar, CheckCircle2, Circle, Trophy, ArrowRight, X as XIcon, RefreshCw, Flame, BarChart2, Check, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Ripple from './Ripple';

interface TodoViewProps {
  todos: TodoItem[];
  setTodos: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  journalEntries?: any[]; // Passed down to calculate mood correlation
}

const TodoView: React.FC<TodoViewProps> = ({ todos, setTodos, journalEntries = [] }) => {
  const [activeTab, setActiveTab] = useState<'Today' | 'Upcoming' | 'Routines' | 'Insights'>('Today');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [celebration, setCelebration] = useState<{ title: string; todo: TodoItem } | null>(null);
  
  // Form State for creating task/routine
  const [newItem, setNewItem] = useState<{
    title: string;
    description: string;
    dueDate: string;
    time: string;
    recurrence: 'none' | 'weekly' | 'monthly' | 'yearly';
    weekdays: number[]; // [0-6] for Sun-Sat
  }>({
    title: '',
    description: '',
    dueDate: getLocalTodayString(),
    time: '',
    recurrence: 'none',
    weekdays: []
  });

  // Auto-dismiss completion celebration after 4 seconds
  useEffect(() => {
    if (celebration) {
      const timer = setTimeout(() => setCelebration(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [celebration]);

  // Today Tasks calculation
  const todayStr = getLocalTodayString();
  const todayTasks = useMemo(() => {
    return todos.filter(t => !t.archived && isTaskActiveOnDate(t, todayStr));
  }, [todos, todayStr]);

  // Upcoming 7-day planner projection
  const upcomingDays = useMemo(() => {
    const days = [];
    const baseDate = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const dayTasks = todos.filter(t => !t.archived && isTaskActiveOnDate(t, dateStr));
      days.push({
        dateStr,
        formattedLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
        tasks: dayTasks
      });
    }
    return days;
  }, [todos]);

  // Routines templates list
  const routineTemplates = useMemo(() => {
    return todos.filter(t => t.recurrence !== 'none');
  }, [todos]);

  // Streak calculations
  const calculateStreak = (todo: TodoItem): number => {
    if (todo.recurrence === 'none') return 0;
    const completed = todo.completedDates || [];
    if (completed.length === 0) return 0;
    
    const sorted = [...completed].sort((a, b) => b.localeCompare(a));
    const yesterdayStr = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    
    if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) {
      return 0;
    }
    
    let streak = 0;
    const checkDate = new Date();
    if (!completed.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    for (let i = 0; i < 365; i++) {
      const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      
      if (isTaskActiveOnDate(todo, checkStr)) {
        if (completed.includes(checkStr)) {
          streak++;
        } else {
          break;
        }
      }
      
      if (todo.dueDate && checkStr < todo.dueDate) {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
  };

  // Productivity Insights Calculations
  const insightsData = useMemo(() => {
    // 1. Habit heat map (past 6 weeks - 42 days)
    const heatMap = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 41); // Go back 41 days
    
    for (let i = 0; i < 42; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Count total tasks completed on this date
      const activeTodos = todos.filter(t => !t.archived && isTaskActiveOnDate(t, dateStr));
      const completedCount = activeTodos.filter(t => isTaskCompletedOnDate(t, dateStr)).length;
      
      heatMap.push({
        dateStr,
        count: completedCount,
        dayName: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      });
    }

    // 2. Mood Correlation
    const moodCompletion: Record<string, { totalCompleted: number, daysCount: number }> = {
      happy: { totalCompleted: 0, daysCount: 0 },
      neutral: { totalCompleted: 0, daysCount: 0 },
      sad: { totalCompleted: 0, daysCount: 0 },
      excited: { totalCompleted: 0, daysCount: 0 },
      calm: { totalCompleted: 0, daysCount: 0 },
    };

    journalEntries.forEach(entry => {
      if (entry.mood && moodCompletion[entry.mood] !== undefined) {
        const dateStr = entry.date;
        const activeOnDay = todos.filter(t => isTaskActiveOnDate(t, dateStr));
        const completedOnDay = activeOnDay.filter(t => isTaskCompletedOnDate(t, dateStr)).length;
        
        moodCompletion[entry.mood].totalCompleted += completedOnDay;
        moodCompletion[entry.mood].daysCount += 1;
      }
    });

    const correlationChart = Object.keys(moodCompletion).map(key => {
      const entry = moodCompletion[key];
      const avg = entry.daysCount > 0 ? parseFloat((entry.totalCompleted / entry.daysCount).toFixed(1)) : 0;
      return {
        mood: key.charAt(0).toUpperCase() + key.slice(1),
        avgCompletions: avg
      };
    });

    return { heatMap, correlationChart };
  }, [todos, journalEntries]);

  // Handlers
  const handleAddTask = () => {
    if (!newItem.title) return;

    const todo: TodoItem = {
      id: crypto.randomUUID(),
      title: newItem.title,
      description: newItem.description || '',
      dueDate: newItem.dueDate || getLocalTodayString(),
      time: newItem.time || null,
      recurrence: newItem.recurrence,
      weekdays: newItem.recurrence === 'weekly' ? newItem.weekdays : undefined,
      completedDates: [],
      completed: false
    };

    setTodos(prev => [...prev, todo]);
    setIsModalOpen(false);
    setNewItem({
      title: '',
      description: '',
      dueDate: getLocalTodayString(),
      time: '',
      recurrence: 'none',
      weekdays: []
    });
  };

  const handleToggleComplete = (todo: TodoItem, dateStr: string) => {
    if (todo.recurrence === 'none') {
      const nextStatus = !todo.completed;
      setTodos(prev => prev.map(t => {
        if (t.id === todo.id) {
          return { ...t, completed: nextStatus, completedAt: nextStatus ? new Date().toISOString() : undefined };
        }
        return t;
      }));
      if (nextStatus) {
        setCelebration({ title: todo.title, todo });
      }
    } else {
      const completed = todo.completedDates || [];
      const alreadyCompleted = completed.includes(dateStr);
      const nextCompleted = alreadyCompleted 
        ? completed.filter(d => d !== dateStr)
        : [...completed, dateStr];

      setTodos(prev => prev.map(t => {
        if (t.id === todo.id) {
          return { ...t, completedDates: nextCompleted };
        }
        return t;
      }));
      if (!alreadyCompleted) {
        setCelebration({ title: todo.title, todo });
      }
    }
  };

  const handleArchive = (todo: TodoItem) => {
    setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, archived: true } : t));
    setCelebration(null);
  };

  const handleDelete = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const toggleWeekdaySelection = (dayNum: number) => {
    setNewItem(prev => {
      const weekdays = prev.weekdays.includes(dayNum)
        ? prev.weekdays.filter(d => d !== dayNum)
        : [...prev.weekdays, dayNum];
      return { ...prev, weekdays };
    });
  };

  const tabs: Array<'Today' | 'Upcoming' | 'Routines' | 'Insights'> = ['Today', 'Upcoming', 'Routines', 'Insights'];

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-4xl font-bold font-display text-gray-900 dark:text-white">My Tasks</h1>
          <p className="text-gray-500 font-light text-lg mt-1">Organize scheduled and recurring life routines seamlessly.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative overflow-hidden flex items-center justify-center px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-medium transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transform hover:-translate-y-1 active:scale-95"
        >
          <Ripple className="bg-white/30" />
          <Plus className="w-5 h-5 mr-2" />
          New Task
        </button>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-2 rounded-full inline-flex flex-wrap gap-1 mx-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative overflow-hidden px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400 scale-105'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Ripple className={activeTab === tab ? 'bg-brand-500/20' : 'bg-gray-400/20'} />
            {tab}
          </button>
        ))}
      </div>

      {/* VIEW: Today */}
      {activeTab === 'Today' && (
        <div className="space-y-4 px-1">
          {todayTasks.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-[2.5rem] border-dashed border border-gray-300/50 dark:border-gray-700/50 mx-2">
               <div className="mx-auto w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <CheckCircle2 className="w-10 h-10 text-gray-300" />
               </div>
               <h3 className="text-xl font-display font-medium text-gray-900 dark:text-white">All caught up!</h3>
               <p className="text-gray-500 text-sm mt-2">No tasks or recurring routines scheduled for today.</p>
            </div>
          ) : (
            todayTasks.map((todo, idx) => {
              const completed = isTaskCompletedOnDate(todo, todayStr);
              return (
                <div 
                  key={todo.id}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className={`group relative overflow-hidden p-4 pl-6 pr-6 rounded-[2rem] transition-all duration-500 animate-fade-in-up mx-2 flex items-center
                    ${completed 
                      ? 'bg-green-50/30 dark:bg-green-900/10 border border-green-100/20 shadow-inner grayscale-[0.5]' 
                      : 'backdrop-blur-2xl bg-gradient-to-br from-white/80 via-white/40 to-white/20 dark:from-gray-800/80 dark:via-gray-800/40 dark:to-gray-900/20 border-t border-l border-white/60 dark:border-white/15 border-b border-r border-black/5 dark:border-black/20 shadow-[8px_8px_16px_0_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-lg'
                    }
                  `}
                >
                  <Ripple className={completed ? 'bg-green-500/10' : 'bg-gray-400/10'} />
                  
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(todo, todayStr)}
                    className={`relative rounded-full mr-5 transition-all duration-300 flex-shrink-0 z-10 ${
                      completed ? 'text-green-500 scale-110' : 'text-gray-400 hover:text-brand-500 hover:scale-110'
                    }`}
                  >
                    {completed ? <CheckCircle2 className="w-8 h-8" strokeWidth={2} /> : <Circle className="w-8 h-8" strokeWidth={1.5} />}
                  </button>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 py-1 pointer-events-none z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`text-lg font-bold font-display truncate transition-colors ${completed ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-white'}`}>
                        {todo.title}
                      </h3>
                      {todo.time && (
                        <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-brand-500 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded-full animate-pulse-slow">
                          ⏰ {todo.time}
                        </span>
                      )}
                      {todo.recurrence !== 'none' && (
                        <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                          🔄 {todo.recurrence === 'none' ? 'Single' : `${todo.recurrence} task`}
                        </span>
                      )}
                    </div>
                    {todo.description && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">{todo.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(todo.id); }} 
                    className="ml-4 p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 relative overflow-hidden z-10"
                  >
                    <Ripple className="bg-red-500/20" />
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW: Upcoming 7-day Planner */}
      {activeTab === 'Upcoming' && (
        <div className="space-y-8 px-1">
          {upcomingDays.map((day, dIdx) => (
            <div key={day.dateStr} className="space-y-3 animate-fade-in-up" style={{ animationDelay: `${dIdx * 100}ms` }}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-4 mb-2 flex items-center">
                <Calendar size={14} className="mr-2 text-brand-500" />
                {day.formattedLabel}
              </h3>
              
              <div className="space-y-3">
                {day.tasks.length === 0 ? (
                  <p className="text-sm text-gray-400 italic pl-6">No tasks scheduled for this day.</p>
                ) : (
                  day.tasks.map((todo) => {
                    const completed = isTaskCompletedOnDate(todo, day.dateStr);
                    return (
                      <div 
                        key={`${todo.id}-${day.dateStr}`} 
                        className={`flex items-center p-4 pl-6 pr-6 rounded-[2rem] glass-card shadow-sm transition-all hover:scale-[1.01] ${
                          completed ? 'bg-green-50/10 border-green-200/20 opacity-70' : ''
                        }`}
                      >
                        <button
                          onClick={() => handleToggleComplete(todo, day.dateStr)}
                          className={`relative rounded-full mr-5 transition-all duration-300 flex-shrink-0 z-10 ${
                            completed ? 'text-green-500' : 'text-gray-400 hover:text-brand-500'
                          }`}
                        >
                          {completed ? <CheckCircle2 className="w-6 h-6" strokeWidth={2} /> : <Circle className="w-6 h-6" strokeWidth={1.5} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-semibold truncate ${completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {todo.title}
                          </p>
                          {todo.time && <p className="text-[10px] text-brand-500 font-bold">⏰ {todo.time}</p>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: Routines habit manager */}
      {activeTab === 'Routines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
          {routineTemplates.length === 0 ? (
            <div className="col-span-full text-center py-20 glass-card rounded-[2.5rem]">
              <p className="text-gray-500">Create your first recurring routine using the **New Task** button!</p>
            </div>
          ) : (
            routineTemplates.map((todo, idx) => {
              const streak = calculateStreak(todo);
              return (
                <div 
                  key={todo.id}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className="glass-card p-6 rounded-[2.5rem] flex flex-col justify-between h-48 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  <Ripple />
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-xl text-gray-900 dark:text-white truncate pr-4">{todo.title}</h4>
                      <button 
                        onClick={() => handleDelete(todo.id)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-full relative overflow-hidden transition-colors"
                      >
                        <Ripple className="bg-red-500/20" />
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-brand-500 font-semibold mb-3 flex items-center">
                      <RefreshCw size={12} className="mr-1.5 animate-spin-slow" />
                      {todo.recurrence === 'weekly' && todo.weekdays 
                        ? `Weekly on: ${todo.weekdays.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`
                        : todo.recurrence === 'monthly' && todo.dueDate
                        ? `Monthly on date: ${todo.dueDate.split('-')[2]}`
                        : todo.recurrence === 'yearly' && todo.dueDate
                        ? `Yearly on: ${formatLocalDate(todo.dueDate, {month: 'short', day: 'numeric'})}`
                        : `${todo.recurrence.charAt(0).toUpperCase() + todo.recurrence.slice(1)} Task`
                      }
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-2">{todo.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100/50 dark:border-gray-800/50">
                    <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">Recurring Task</span>
                    <span className="flex items-center text-orange-500 font-bold text-sm bg-orange-50 dark:bg-orange-950/30 px-3 py-1 rounded-full shadow-sm shadow-orange-500/10">
                      <Flame size={16} className="mr-1 fill-orange-500 animate-pulse" />
                      {streak} streak
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW: Insights Streaks & Heatmap */}
      {activeTab === 'Insights' && (
        <div className="space-y-8 px-2">
          
          {/* Heat map grid */}
          <div className="glass-panel p-8 rounded-[2.5rem] shadow-sm">
            <h3 className="text-lg font-bold font-display mb-4 dark:text-white flex items-center">
              <Award className="mr-2 text-amber-500" size={22}/> Task Achievement Map (Past 6 Weeks)
            </h3>
            <div className="flex flex-wrap gap-2 justify-center py-4 bg-gray-50/40 dark:bg-gray-900/20 rounded-[2rem] p-4">
              {insightsData.heatMap.map((cell) => {
                let colorClass = 'bg-gray-100 dark:bg-gray-800 text-gray-400';
                if (cell.count === 1) colorClass = 'bg-brand-100 dark:bg-brand-900/30 border border-brand-200/50 text-brand-700';
                if (cell.count === 2) colorClass = 'bg-brand-300 dark:bg-brand-700 text-white';
                if (cell.count >= 3) colorClass = 'bg-brand-500 dark:bg-brand-500 text-white shadow-sm shadow-brand-500/20';
                
                return (
                  <div 
                    key={cell.dateStr} 
                    title={`${formatLocalDate(cell.dateStr, {month: 'short', day: 'numeric'})}: ${cell.count} completions`}
                    className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all transform hover:scale-110 cursor-pointer ${colorClass}`}
                  >
                    <span>{cell.dayName}</span>
                    <span className="text-[8px] opacity-70 font-mono mt-0.5">{cell.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mood Productivity Correlation */}
          <div className="glass-panel p-8 rounded-[2.5rem] shadow-sm">
            <h3 className="text-lg font-bold font-display mb-6 dark:text-white flex items-center">
              <BarChart2 className="mr-2 text-brand-500" size={22}/> Mood Productivity Correlation
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Analyze how your daily emotional states recorded in the **Journal** impact your daily task completions.
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insightsData.correlationChart}>
                  <XAxis dataKey="mood" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} fontFamily="Plus Jakarta Sans" />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} fontFamily="Plus Jakarta Sans" />
                  <Tooltip 
                    cursor={{fill: 'rgba(0,0,0,0.02)'}}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="avgCompletions" radius={[6, 6, 6, 6]} barSize={40}>
                     {insightsData.correlationChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#9ca3af', '#ec4899', '#6366f1'][index % 5]} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Floating Celebration Toast */}
      {celebration && (
        <div className="fixed bottom-6 right-6 z-[100] glass-panel p-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-slide-in-right bg-gradient-to-r from-brand-500/10 to-transparent border border-brand-500/20 max-w-sm">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
            <Trophy size={20} className="animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Task Completed!</p>
            <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5 truncate">{celebration.title}</p>
          </div>
          <button 
            onClick={() => handleArchive(celebration.todo)}
            className="px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
          >
            Archive
          </button>
          <button 
            onClick={() => setCelebration(null)}
            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-400"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border-0">
            <div className="p-8 space-y-6">
              
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Create New Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors relative overflow-hidden">
                  <Ripple />
                  <XIcon size={24} />
                </button>
              </div>

              <div className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Title</label>
                  <input
                    type="text"
                    autoFocus
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="What task are we doing?"
                    className="w-full px-6 py-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-950/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-brand-500/30 outline-none transition-all placeholder-gray-400 text-lg font-medium"
                  />
                </div>

                {/* Details */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Details</label>
                  <textarea
                    rows={2}
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Add some context..."
                    className="w-full px-6 py-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-950/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-brand-500/30 outline-none resize-none transition-all"
                  />
                </div>

                {/* Recurrence Rule Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Task Recurrence</label>
                  <div className="relative">
                    <select
                      value={newItem.recurrence}
                      onChange={(e) => setNewItem({ ...newItem, recurrence: e.target.value as any })}
                      className="w-full px-6 py-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-950/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-brand-500/30 outline-none appearance-none cursor-pointer"
                    >
                      <option value="none" className="bg-white dark:bg-gray-900">Single Task</option>
                      <option value="weekly" className="bg-white dark:bg-gray-900">Weekly Task</option>
                      <option value="monthly" className="bg-white dark:bg-gray-900">Monthly Task</option>
                      <option value="yearly" className="bg-white dark:bg-gray-900">Yearly Task</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-450 text-xs">▼</div>
                  </div>
                </div>

                {/* Weekly selection day buttons */}
                {newItem.recurrence === 'weekly' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">Select Days of Week</label>
                    <div className="flex gap-1 justify-between bg-gray-100/50 dark:bg-gray-950/30 p-1 rounded-2xl">
                      {['S','M','T','W','T','F','S'].map((day, idx) => {
                        const isSelected = newItem.weekdays.includes(idx);
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleWeekdaySelection(idx)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all relative overflow-hidden ${
                              isSelected 
                                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20' 
                                : 'text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <Ripple />
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">
                      {newItem.recurrence === 'none' ? 'Due Date' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={newItem.dueDate}
                      onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-950/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-brand-500/30 outline-none font-mono text-sm cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Time (Optional)</label>
                    <input
                      type="time"
                      value={newItem.time}
                      onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/40 dark:bg-gray-950/40 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-brand-500/30 outline-none font-mono text-sm cursor-pointer animate-pulse-slow"
                    />
                  </div>
                </div>

              </div>

              <button
                onClick={handleAddTask}
                className="relative overflow-hidden w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-[1.5rem] shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all transform hover:-translate-y-0.5 text-lg"
              >
                <Ripple className="bg-white/30" />
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoView;
