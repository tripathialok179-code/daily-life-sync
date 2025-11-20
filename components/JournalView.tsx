
import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { enhanceJournalEntry } from '../services/gemini';
import { PenTool, Wand2, Calendar as CalendarIcon, Save, ChevronLeft, Smile, Meh, Frown, Search } from 'lucide-react';
import Ripple from './Ripple';

interface JournalViewProps {
  entries: JournalEntry[];
  setEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
}

const JournalView: React.FC<JournalViewProps> = ({ entries, setEntries }) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(entry => 
      (entry.title?.toLowerCase().includes(query) || false) || 
      (entry.content?.toLowerCase().includes(query) || false)
    );
  }, [entries, searchQuery]);

  const handleNewEntry = () => {
    const today = new Date().toISOString().split('T')[0];
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

  const handleEnhance = async () => {
    if (!currentEntry.content) return;
    setIsEnhancing(true);
    const enhanced = await enhanceJournalEntry(currentEntry.content);
    setCurrentEntry(prev => ({ ...prev, content: enhanced }));
    setIsEnhancing(false);
  };

  const moods: { value: JournalEntry['mood']; icon: any; color: string }[] = [
    { value: 'happy', icon: Smile, color: 'text-green-500' },
    { value: 'neutral', icon: Meh, color: 'text-blue-500' },
    { value: 'sad', icon: Frown, color: 'text-gray-400' },
  ];

  if (isEditing) {
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
              onClick={handleEnhance}
              disabled={isEnhancing}
              className="relative overflow-hidden flex items-center px-4 py-2 bg-purple-50/80 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-full text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors backdrop-blur-sm"
            >
              <Ripple className="bg-purple-500/20" />
              <Wand2 size={16} className={`mr-2 ${isEnhancing ? 'animate-spin' : ''}`} />
              Refine
            </button>
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

        {/* Meta Fields */}
        <div className="p-8 pb-0 space-y-6">
           <div className="flex items-center gap-6">
             <div className="relative group">
                <input 
                  type="date" 
                  value={currentEntry.date}
                  onChange={e => setCurrentEntry({...currentEntry, date: e.target.value})}
                  className="pl-10 pr-4 py-2 bg-transparent rounded-full text-sm font-mono text-gray-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors outline-none cursor-pointer"
                />
                <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-500 transition-colors"/>
             </div>
             <div className="flex bg-gray-100/50 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-sm">
               {moods.map(m => (
                 <button
                    key={m.value}
                    onClick={() => setCurrentEntry({...currentEntry, mood: m.value})}
                    className={`relative overflow-hidden p-2 rounded-full transition-all duration-300 ${currentEntry.mood === m.value ? 'bg-white dark:bg-gray-700 shadow-sm scale-110' : 'opacity-50 hover:opacity-100'}`}
                 >
                   <Ripple />
                   <m.icon size={20} className={m.color} strokeWidth={2} />
                 </button>
               ))}
             </div>
           </div>
           <input 
              type="text" 
              placeholder="Title of the day..."
              value={currentEntry.title || ''}
              onChange={e => setCurrentEntry({...currentEntry, title: e.target.value})}
              className="w-full text-4xl font-bold font-display text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 bg-transparent outline-none"
           />
        </div>

        {/* Main Editor */}
        <div className="flex-1 p-8 relative">
            <textarea
            value={currentEntry.content || ''}
            onChange={e => setCurrentEntry({...currentEntry, content: e.target.value})}
            placeholder="Start writing your thoughts..."
            className="w-full h-full text-xl leading-loose text-gray-700 dark:text-gray-300 bg-transparent outline-none resize-none journal-font placeholder-gray-300/50"
            />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
        <div>
          <h1 className="text-4xl font-bold font-display text-gray-900 dark:text-white">Daily Journal</h1>
          <p className="text-gray-500 font-light text-lg mt-1">Capture your moments, feelings, and memories.</p>
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

      <div className="relative group mx-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={22} />
        <input 
          type="text"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-4 glass-panel rounded-full outline-none focus:ring-2 focus:ring-brand-500/50 border-0 transition-all text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-2">
        {filteredEntries.length === 0 ? (
           <div className="col-span-full text-center py-32 glass-card rounded-[3rem] border-dashed border border-gray-300 dark:border-gray-700">
              <BookOpenIcon size={64} className="mx-auto text-gray-200 dark:text-gray-800 mb-6" />
              <h3 className="text-xl font-medium text-gray-500">
                {searchQuery ? 'No matching entries found' : 'Your journal is empty'}
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
                  {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {entry.mood && (
                  <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full backdrop-blur-sm">
                     {moods.find(m => m.value === entry.mood)?.icon ? React.createElement(moods.find(m => m.value === entry.mood)!.icon, { size: 20, className: moods.find(m => m.value === entry.mood)!.color }) : null}
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-bold font-display text-gray-900 dark:text-white mb-3 line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors pointer-events-none">
                {entry.title || "Untitled"}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 font-serif leading-relaxed line-clamp-4 flex-1 text-lg pointer-events-none">
                {entry.content}
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

const BookOpenIcon = ({size, className}: any) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
)

export default JournalView;
