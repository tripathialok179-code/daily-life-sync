
import React, { useState, useMemo } from 'react';
import { TodoItem, Timeframe } from '../types';
import { generateDescription } from '../services/gemini';
import { Plus, Trash2, Calendar, CheckCircle2, Circle, Sparkles, Trophy, ArrowRight, CheckSquare, X as XIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Ripple from './Ripple';

interface TodoViewProps {
  todos: TodoItem[];
  setTodos: React.Dispatch<React.SetStateAction<TodoItem[]>>;
}

const TodoView: React.FC<TodoViewProps> = ({ todos, setTodos }) => {
  const [activeTab, setActiveTab] = useState<Timeframe | 'Achievements'>(Timeframe.DAILY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completionModal, setCompletionModal] = useState<TodoItem | null>(null);
  
  const [newItem, setNewItem] = useState<Partial<TodoItem>>({
    title: '',
    description: '',
    timeframe: Timeframe.DAILY,
    dueDate: new Date().toISOString().split('T')[0]
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredTodos = useMemo(() => {
    if (activeTab === 'Achievements') {
      return todos.filter(t => t.archived).sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
    }
    return todos.filter(t => t.timeframe === activeTab && !t.archived);
  }, [todos, activeTab]);

  const stats = useMemo(() => {
    const archived = todos.filter(t => t.archived);
    return [
      { name: 'Daily', count: archived.filter(t => t.timeframe === Timeframe.DAILY).length },
      { name: 'Weekly', count: archived.filter(t => t.timeframe === Timeframe.WEEKLY).length },
      { name: 'Monthly', count: archived.filter(t => t.timeframe === Timeframe.MONTHLY).length },
      { name: 'Yearly', count: archived.filter(t => t.timeframe === Timeframe.YEARLY).length },
    ];
  }, [todos]);

  const handleAddTodo = async () => {
    if (!newItem.title) return;
    
    const todo: TodoItem = {
      id: crypto.randomUUID(),
      title: newItem.title,
      description: newItem.description || '',
      timeframe: newItem.timeframe || Timeframe.DAILY,
      dueDate: newItem.dueDate || null,
      completed: false,
    };
    
    setTodos(prev => [...prev, todo]);
    setIsModalOpen(false);
    setNewItem({ title: '', description: '', timeframe: activeTab === 'Achievements' ? Timeframe.DAILY : activeTab, dueDate: new Date().toISOString().split('T')[0] });
  };

  const handleAIGenerateDesc = async () => {
    if (!newItem.title) return;
    setIsGenerating(true);
    const desc = await generateDescription(newItem.title);
    setNewItem(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleToggleComplete = (todo: TodoItem) => {
    if (todo.completed) {
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: false } : t));
    } else {
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: true, completedAt: new Date().toISOString() } : t));
      setCompletionModal(todo);
    }
  };

  const handleArchive = (item: TodoItem) => {
    setTodos(prev => prev.map(t => t.id === item.id ? { ...t, archived: true } : t));
    setCompletionModal(null);
  };

  const handleDelete = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    setCompletionModal(null);
  };

  const tabs = [Timeframe.DAILY, Timeframe.WEEKLY, Timeframe.MONTHLY, Timeframe.YEARLY, 'Achievements'];

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-4xl font-bold font-display text-gray-900 dark:text-white">My Tasks</h1>
          <p className="text-gray-500 font-light text-lg mt-1">Organize your life, one step at a time.</p>
        </div>
        {activeTab !== 'Achievements' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="relative overflow-hidden flex items-center justify-center px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-medium transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 transform hover:-translate-y-1 active:scale-95"
          >
            <Ripple className="bg-white/30" />
            <Plus className="w-5 h-5 mr-2" />
            New Task
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="glass-panel p-2 rounded-full inline-flex flex-wrap gap-1 mx-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
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

      {/* Achievements Stats */}
      {activeTab === 'Achievements' && (
        <div className="glass-panel p-8 rounded-[2.5rem] animate-scale-in mx-2">
          <h2 className="text-xl font-bold font-display mb-6 flex items-center text-gray-800 dark:text-white px-4">
            <Trophy className="w-6 h-6 text-amber-500 mr-2" />
            Productivity Overview
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} fontFamily="Plus Jakarta Sans" />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} fontFamily="Plus Jakarta Sans" />
                <Tooltip 
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(4px)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 6, 6]} barSize={40}>
                   {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][index % 4]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-4 px-1">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-[2.5rem] border-dashed border border-gray-300/50 dark:border-gray-700/50 mx-2">
             <div className="mx-auto w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                {activeTab === 'Achievements' ? <Trophy className="w-10 h-10 text-gray-300" /> : <CheckSquare className="w-10 h-10 text-gray-300" />}
             </div>
             <h3 className="text-xl font-display font-medium text-gray-900 dark:text-white">No items found</h3>
             <p className="text-gray-500 text-sm mt-2">
               {activeTab === 'Achievements' 
                  ? "Complete some tasks to see them here!" 
                  : "Add a task to get started."}
             </p>
          </div>
        ) : (
          filteredTodos.map((todo, idx) => (
            <div 
              key={todo.id}
              style={{ animationDelay: `${idx * 50}ms` }}
              className={`group relative overflow-hidden p-4 pl-6 pr-6 rounded-[2rem] transition-all duration-500 animate-fade-in-up mx-2 flex items-center
                ${todo.completed 
                  ? 'bg-green-50/30 dark:bg-green-900/10 border border-green-100/20 shadow-inner grayscale-[0.5]' 
                  : 'backdrop-blur-2xl bg-gradient-to-br from-white/80 via-white/40 to-white/20 dark:from-gray-800/80 dark:via-gray-800/40 dark:to-gray-900/20 border-t border-l border-white/60 dark:border-white/15 border-b border-r border-black/5 dark:border-black/20 shadow-[8px_8px_16px_0_rgba(0,0,0,0.05),-4px_-4px_12px_0_rgba(255,255,255,0.6)] dark:shadow-[8px_8px_16px_0_rgba(0,0,0,0.3),-1px_-1px_2px_0_rgba(255,255,255,0.05)] hover:-translate-y-1 hover:shadow-[12px_12px_20px_0_rgba(0,0,0,0.1),-4px_-4px_12px_0_rgba(255,255,255,0.6)]'
                }
              `}
            >
              {/* Subtle shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <Ripple className={todo.completed ? 'bg-green-500/10' : 'bg-gray-400/10'} />

              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if(activeTab !== 'Achievements') handleToggleComplete(todo);
                }}
                disabled={activeTab === 'Achievements'}
                className={`relative rounded-full mr-5 transition-all duration-300 flex-shrink-0 z-10 ${
                  todo.completed 
                    ? 'text-green-500 scale-110 drop-shadow-sm' 
                    : 'text-gray-400 hover:text-brand-500 hover:scale-110 hover:drop-shadow-md dark:text-gray-500'
                }`}
              >
                {todo.completed ? <CheckCircle2 className="w-8 h-8" strokeWidth={2} /> : <Circle className="w-8 h-8" strokeWidth={1.5} />}
              </button>
              
              {/* Content */}
              <div className="flex-1 min-w-0 py-1 pointer-events-none z-10">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className={`text-lg font-bold font-display truncate transition-colors ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-white drop-shadow-sm'}`}>
                    {todo.title}
                  </h3>
                  {todo.dueDate && (
                    <span className="hidden sm:flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-sm">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(todo.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  )}
                </div>
                
                {todo.description && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">{todo.description}</p>
                )}

                {/* Mobile Date */}
                 {todo.dueDate && (
                    <span className="sm:hidden flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">
                      {new Date(todo.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  )}
                  
                 {activeTab === 'Achievements' && todo.completedAt && (
                   <span className="text-green-600 dark:text-green-400 text-xs font-bold flex items-center mt-1">
                     Completed on {new Date(todo.completedAt).toLocaleDateString()}
                   </span>
                 )}
              </div>

              {/* Actions */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(todo.id); }} 
                className="ml-4 p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 relative overflow-hidden z-10"
              >
                <Ripple className="bg-red-500/20" />
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in border-0">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold font-display text-gray-900 dark:text-white">Add Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors relative overflow-hidden">
                  <Ripple />
                  <XIcon size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Title</label>
                  <input
                    type="text"
                    autoFocus
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="What needs to be done?"
                    className="w-full px-6 py-4 rounded-[1.5rem] border-0 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder-gray-400 text-lg font-medium"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 px-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Details</label>
                    <button 
                      onClick={handleAIGenerateDesc}
                      disabled={isGenerating || !newItem.title}
                      className="relative overflow-hidden text-xs flex items-center text-brand-600 hover:text-brand-700 font-bold disabled:opacity-50 transition-colors bg-brand-50 px-3 py-1.5 rounded-full"
                    >
                      <Ripple className="bg-brand-500/20" />
                      <Sparkles size={12} className="mr-1" />
                      {isGenerating ? 'Thinking...' : 'AI Assist'}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Add some context..."
                    className="w-full px-6 py-4 rounded-[1.5rem] border-0 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">When</label>
                    <div className="relative">
                       <select
                        value={newItem.timeframe}
                        onChange={(e) => setNewItem({ ...newItem, timeframe: e.target.value as Timeframe })}
                        className="w-full px-6 py-4 rounded-[1.5rem] border-0 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
                      >
                        {Object.values(Timeframe).map((tf) => (
                          <option key={tf} value={tf}>{tf}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">Date</label>
                    <input
                      type="date"
                      value={newItem.dueDate || ''}
                      onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                      className="w-full px-6 py-4 rounded-[1.5rem] border-0 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddTodo}
                className="relative overflow-hidden w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-[1.5rem] shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all transform hover:-translate-y-0.5 text-lg"
              >
                <Ripple className="bg-white/30" />
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion / Archive Modal */}
      {completionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-md animate-in fade-in duration-200">
           <div className="glass-panel rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 text-center animate-scale-in border-0">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <Sparkles className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold font-display text-gray-900 dark:text-white mb-3">Awesome!</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg leading-relaxed">
                You've completed <strong>{completionModal.title}</strong>.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleArchive(completionModal)}
                  className="relative overflow-hidden w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 text-amber-800 dark:text-amber-200 rounded-2xl font-bold transition-all hover:shadow-lg hover:scale-[1.02] group"
                >
                  <Ripple className="bg-amber-500/20" />
                  <span className="flex items-center"><Trophy size={20} className="mr-3"/> Claim Achievement</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => handleDelete(completionModal.id)}
                  className="relative overflow-hidden w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-medium transition-all"
                >
                   <Ripple />
                  <span className="flex items-center"><Trash2 size={20} className="mr-3"/> Just Remove</span>
                  <ArrowRight size={20} />
                </button>
              </div>
              <button 
                onClick={() => {
                    setTodos(prev => prev.map(t => t.id === completionModal.id ? { ...t, completed: false } : t));
                    setCompletionModal(null);
                }}
                className="mt-6 text-sm text-gray-400 hover:text-gray-600 underline decoration-gray-300 underline-offset-4"
              >
                Cancel
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TodoView;
