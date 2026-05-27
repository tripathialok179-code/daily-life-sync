import React, { useState, useMemo } from 'react';
import { JournalEntry, getLocalTodayString, formatLocalDate } from '../types';
import { PenTool, Calendar as CalendarIcon, Save, ChevronLeft, Smile, Meh, Frown, Search, Coffee, Zap, Filter, Heart } from 'lucide-react';
import Ripple from './Ripple';

interface JournalViewProps {
  entries: JournalEntry[];
  setEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
}

const JournalView: React.FC<JournalViewProps> = ({ entries, setEntries }) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');

  const moods: { value: JournalEntry['mood']; icon: any; color: string; bgClass: string, label: string }[] = [
    { value: 'happy', icon: Smile, color: 'text-green-500', bgClass: 'bg-green-50/50 dark:bg-green-950/20', label: 'Happy' },
    { value: 'calm', icon: Coffee, color: 'text-teal-500', bgClass: 'bg-teal-50/50 dark:bg-teal-950/20', label: 'Calm' },
    { value: 'excited', icon: Zap, color: 'text-amber-500', bgClass: 'bg-amber-50/50 dark:bg-amber-950/20', label: 'Excited' },
    { value: 'neutral', icon: Meh, color: 'text-blue-500', bgClass: 'bg-blue-50/50 dark:bg-blue-950/20', label: 'Neutral' },
    { value: 'sad', icon: Frown, color: 'text-gray-400', bgClass: 'bg-gray-50/50 dark:bg-gray-800/20', label: 'Sad' },
  ];

  // Mood Filtering and Search Logic
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (selectedMoodFilter !== 'all') {
      result = result.filter(entry => entry.mood === selectedMoodFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(entry => 
        (entry.title?.toLowerCase().includes(query) || false) || 
        (entry.content?.toLowerCase().includes(query) || false)
      );
    }
    return result;
  }, [entries, searchQuery, selectedMoodFilter]);

  // Emotional Trends Analysis
  const moodTrends = useMemo(() => {
    const counts = { happy: 0, calm: 0, excited: 0, neutral: 0, sad: 0 };
    entries.forEach(entry => {
      if (entry.mood && counts[entry.mood] !== undefined) {
        counts[entry.mood]++;
      }
    });
    
    const total = entries.length || 1;
    return Object.keys(counts).map(key => ({
      mood: key,
      count: counts[key as keyof typeof counts],
      percentage: Math.round((counts[key as keyof typeof counts] / total) * 100)
    }));
  }, [entries]);

  const handleNewEntry = () => {
    const today = getLocalTodayString();
    const newId = crypto.randomUUID();
    const newEntry: JournalEntry = {
      id: newId,
      date: today,
      title: '',
      content: '',
      mood: 'neutral',
      tags: []
    };
    setCurrentEntry(newEntry);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!currentEntry.date || !currentEntry.content) return;

    setEntries(prev => {
      const exists = prev.find(e => e.id === currentEntry.id);
      if (exists) {
        return prev.map(e => e.id === currentEntry.id ? currentEntry as JournalEntry : e);
      }
      return [currentEntry as JournalEntry, ...prev];
    });
    setIsEditing(false);
    setSelectedEntryId(null);
  };

  if (isEditing) {
    const moodConfig = moods.find(m => m.value === currentEntry.mood) || moods[3];
    return (
      <div className="max-w-4xl mx-auto glass-panel min-h-[85vh] rounded-[2.5rem] flex flex-col animate-scale-in relative overflow-hidden shadow-2xl">
        
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm">
          <button onClick={() => setIsEditing(false)} className="relative overflow-hidden p-3 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-full text-gray-500 transition-colors">
            <Ripple />
            <ChevronLeft strokeWidth={2.5} />
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSave}
              className="relative overflow-hidden flex items-center px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <Ripple className="bg-white/30 dark:bg-black/30" />
              <Save size={16} className="mr-2" />
              Save
            </button>
          </div>
        </div>

        {/* Paper texture container */}
        <div className="flex-1 flex flex-col bg-amber-50/15 dark:bg-gray-950/20">
          
          {/* Meta Fields & Header */}
          <div className="p-8 pb-0 space-y-6">
             <div className="flex flex-wrap items-center gap-4">
               
               {/* Date Picker */}
               <div className="relative group">
                  <input 
                    type="date" 
                    value={currentEntry.date}
                    onChange={e => setCurrentEntry({...currentEntry, date: e.target.value})}
                    className="pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-full text-sm font-mono text-gray-500 hover:bg-gray-100/50 dark:hover:bg-gray-800/80 transition-all outline-none cursor-pointer border border-gray-200/20"
                  />
                  <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-500 transition-colors"/>
               </div>
               
               {/* Mood Picker */}
               <div className="flex bg-white/40 dark:bg-gray-900/40 rounded-full p-1 border border-gray-200/20 backdrop-blur-sm">
                 {moods.map(m => (
                   <button
                      key={m.value}
                      onClick={() => setCurrentEntry({...currentEntry, mood: m.value})}
                      title={`Feel ${m.label}`}
                      className={`relative overflow-hidden p-2 rounded-full transition-all duration-300 ${currentEntry.mood === m.value ? 'bg-white dark:bg-gray-700 shadow-sm scale-110' : 'opacity-40 hover:opacity-100'}`}
                   >
                     <Ripple />
                     <m.icon size={20} className={m.color} strokeWidth={2.5} />
                   </button>
                 ))}
               </div>
               
               {/* Floating Active Mood Indicator Label */}
               <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${moodConfig.bgClass} ${moodConfig.color}`}>
                 Feeling {moodConfig.label}
               </span>
             </div>
             
             {/* Title of Day Input */}
             <input 
                type="text" 
                placeholder="Title of the day..."
                value={currentEntry.title || ''}
                onChange={e => setCurrentEntry({...currentEntry, title: e.target.value})}
                className="w-full text-4xl font-bold font-display text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 bg-transparent outline-none border-b border-dashed border-gray-200 dark:border-gray-800 pb-3"
             />
          </div>

          {/* Main ruled notebook textarea */}
          <div className="flex-1 p-8 relative">
              <textarea
                value={currentEntry.content || ''}
                onChange={e => setCurrentEntry({...currentEntry, content: e.target.value})}
                placeholder="Write down your thoughts, experiences, and accomplishments today..."
                className="w-full h-full text-lg text-gray-800 dark:text-gray-200 bg-transparent outline-none resize-none journal-font placeholder-gray-300/40 leading-[38px] pr-2 focus:ring-0 focus:outline-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 37px, rgba(226, 232, 240, 0.4) 37px, rgba(226, 232, 240, 0.4) 38px)',
                  backgroundAttachment: 'local',
                  lineHeight: '38px'
                }}
              />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {/* List Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
        <div>
          <h1 className="text-4xl font-bold font-display text-gray-900 dark:text-white">Daily Journal</h1>
          <p className="text-gray-500 font-light text-lg mt-1">Capture your memories, feelings, and reflection logs.</p>
        </div>
        <button 
          onClick={handleNewEntry}
          className="relative overflow-hidden flex items-center px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold shadow-2xl shadow-gray-500/20 hover:shadow-gray-500/30 transition-all transform hover:-translate-y-1"
        >
          <Ripple className="bg-white/30 dark:bg-black/30" />
          <PenTool className="w-5 h-5 mr-3" />
          Write Today
        </button>
      </div>

      {/* Mood Analytics and Statistics */}
      {entries.length > 0 && (
        <div className="glass-panel p-6 rounded-[2.5rem] mx-2 grid grid-cols-2 sm:grid-cols-5 gap-4">
          <h4 className="col-span-full text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Emotional Trends Summary</h4>
          {moodTrends.map(trend => {
            const m = moods.find(md => md.value === trend.mood) || moods[3];
            return (
              <div key={trend.mood} className={`p-4 rounded-[1.5rem] flex flex-col justify-between ${m.bgClass} border border-gray-100/5 dark:border-gray-900/10`}>
                <span className="flex items-center text-xs font-bold text-gray-500 dark:text-gray-400">
                  <m.icon size={16} className={`${m.color} mr-1.5`} />
                  {m.label}
                </span>
                <span className="text-2xl font-bold font-display text-gray-800 dark:text-white mt-2">
                  {trend.percentage}%
                  <span className="text-xs text-gray-400 font-normal ml-1 font-mono">({trend.count}x)</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Input */}
      <div className="relative group mx-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={22} />
        <input 
          type="text"
          placeholder="Search thoughts & memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-4 glass-panel rounded-full outline-none focus:ring-2 focus:ring-brand-500/50 border-0 transition-all text-lg"
        />
      </div>

      {/* Mood Quick-filters */}
      <div className="flex flex-wrap gap-2 px-2 items-center">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center mr-2">
          <Filter size={12} className="mr-1.5 text-brand-500" />
          Filter Mood:
        </span>
        <button
          onClick={() => setSelectedMoodFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all relative overflow-hidden ${
            selectedMoodFilter === 'all'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'bg-white/40 dark:bg-gray-800/40 text-gray-500 border border-gray-200/10 hover:bg-white/60 dark:hover:bg-gray-800/60'
          }`}
        >
          <Ripple />
          All Memories
        </button>
        {moods.map((m) => (
          <button
            key={m.value}
            onClick={() => setSelectedMoodFilter(m.value)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all relative overflow-hidden flex items-center gap-1.5 ${
              selectedMoodFilter === m.value
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : `bg-white/40 dark:bg-gray-800/40 text-gray-500 border border-gray-200/10 hover:bg-white/60 dark:hover:bg-gray-800/60`
            }`}
          >
            <Ripple />
            <m.icon size={14} className={selectedMoodFilter === m.value ? 'text-white' : m.color} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Entries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-2">
        {filteredEntries.length === 0 ? (
           <div className="col-span-full text-center py-32 glass-card rounded-[3rem] border-dashed border border-gray-300 dark:border-gray-700">
              <Heart size={64} className="mx-auto text-gray-200 dark:text-gray-800 mb-6 animate-pulse" />
              <h3 className="text-xl font-medium text-gray-500">
                {searchQuery || selectedMoodFilter !== 'all' ? 'No matching diary entries found' : 'Your journal is empty'}
              </h3>
           </div>
        ) : (
          filteredEntries.map((entry, idx) => (
            <div 
              key={entry.id}
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => {
                setCurrentEntry(entry);
                setIsEditing(true);
              }}
              className="group cursor-pointer glass-card p-8 rounded-[2.5rem] hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex flex-col h-80 animate-fade-in-up relative overflow-hidden"
            >
              <Ripple />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500/0 via-brand-500/50 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-6 pointer-events-none">
                <span className="text-xs font-bold font-mono text-gray-400 uppercase tracking-widest">
                  {formatLocalDate(entry.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {entry.mood && (
                  <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full backdrop-blur-sm">
                     {React.createElement((moods.find(m => m.value === entry.mood) || moods[3]).icon, { size: 20, className: (moods.find(m => m.value === entry.mood) || moods[3]).color })}
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold font-display text-gray-900 dark:text-white mb-3 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors pointer-events-none">
                {entry.title || "Untitled"}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 font-serif leading-relaxed line-clamp-4 flex-1 text-lg pointer-events-none italic">
                "{entry.content}"
              </p>
              
              <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-all pointer-events-none">
                 <span className="text-xs text-gray-400 font-medium">Read entry</span>
                 <ChevronLeft className="rotate-180 text-brand-500" size={20} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JournalView;
