
import React, { useState } from 'react';
import { CustomList, CustomListItem } from '../types';
import { Plus, MoreVertical, Trash, GripVertical, X, Check } from 'lucide-react';
import Ripple from './Ripple';

interface ListsViewProps {
  lists: CustomList[];
  setLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
}

const ListsView: React.FC<ListsViewProps> = ({ lists, setLists }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const handleCreateList = () => {
    if (!newListTitle) return;
    const newList: CustomList = {
      id: crypto.randomUUID(),
      title: newListTitle,
      items: [],
      color: 'bg-white'
    };
    setLists(prev => [newList, ...prev]);
    setNewListTitle('');
    setIsCreating(false);
  };

  const handleAddItem = (listId: string, text: string) => {
    if (!text) return;
    setLists(prev => prev.map(list => {
      if (list.id === listId) {
        return { ...list, items: [...list.items, { id: crypto.randomUUID(), text, checked: false }] };
      }
      return list;
    }));
  };

  const handleToggleItem = (listId: string, itemId: string) => {
    setLists(prev => prev.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item => item.id === itemId ? { ...item, checked: !item.checked } : item)
        };
      }
      return list;
    }));
  };

  const handleDeleteItem = (listId: string, itemId: string) => {
    setLists(prev => prev.map(list => {
      if (list.id === listId) {
        return { ...list, items: list.items.filter(i => i.id !== itemId) };
      }
      return list;
    }));
  };

  const handleDeleteList = (listId: string) => {
    setLists(prev => prev.filter(l => l.id !== listId));
  }



  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h1 className="text-4xl font-bold font-display text-gray-900 dark:text-white">My Lists</h1>
          <p className="text-gray-500 font-light text-lg mt-1">Groceries, movies, bucket lists, and more.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="relative overflow-hidden flex items-center px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full font-medium shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5"
        >
          <Ripple className="bg-white/30" />
          <Plus className="w-5 h-5 mr-2" />
          New List
        </button>
      </div>

      {/* Create List Input Area */}
      {isCreating && (
        <div className="glass-panel p-4 rounded-[2rem] shadow-xl flex gap-4 animate-scale-in mb-8 mx-2">
          <input
            autoFocus
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="List Title (e.g. Weekend Shopping)"
            className="flex-1 px-6 py-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-[1.5rem] outline-none text-gray-900 dark:text-white text-lg font-medium"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
          />
          <button onClick={handleCreateList} className="relative overflow-hidden px-6 py-3 bg-brand-500 text-white rounded-[1.5rem] font-bold">
            <Ripple className="bg-white/30" />
            Create
          </button>
          <button onClick={() => setIsCreating(false)} className="p-3 text-gray-400 hover:text-gray-600 rounded-full relative overflow-hidden">
            <Ripple />
            <X />
          </button>
        </div>
      )}

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-2">
        {lists.length === 0 && !isCreating && (
          <div className="col-span-full text-center text-gray-400 py-20">
            <p className="text-lg font-light">Create your first list to get organized.</p>
          </div>
        )}
        {lists.map((list, idx) => (
          <div
            key={list.id}
            style={{ animationDelay: `${idx * 50}ms` }}
            className="flex flex-col glass-card rounded-[2.5rem] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-[450px] animate-fade-in-up border-0"
          >
            <div className="p-6 border-b border-gray-100/50 dark:border-gray-700/50 flex justify-between items-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-md">
              <h3 className="font-bold text-xl font-display text-gray-900 dark:text-white truncate pr-4">{list.title}</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDeleteList(list.id)}
                  className="relative overflow-hidden p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <Ripple className="bg-red-500/20" />
                  <Trash size={18} />
                </button>
              </div>
            </div>

            {/* Items Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
              {list.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm text-center p-4 opacity-60">
                  <p>Empty list.</p>
                  <p className="text-xs mt-1">Add items.</p>
                </div>
              ) : (
                list.items.map(item => (
                  <div key={item.id} className="group flex items-center gap-3 p-2 pr-4 rounded-full bg-white/30 dark:bg-gray-800/30 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors relative overflow-hidden">
                    <button
                      onClick={() => handleToggleItem(list.id, item.id)}
                      className={`relative flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 overflow-hidden ${item.checked
                        ? 'bg-gray-300 border-gray-300 dark:bg-gray-600 dark:border-gray-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-brand-500 bg-white/50 dark:bg-gray-900/50'
                        }`}
                    >
                      <Ripple className="bg-gray-500/20" />
                      <Check size={16} strokeWidth={4} />
                    </button>
                    <span className={`flex-1 text-base font-medium ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => handleDeleteItem(list.id, item.id)}
                      className="relative overflow-hidden rounded-full opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <Ripple className="bg-red-500/20" />
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Item Input */}
            <div className="p-4 bg-white/30 dark:bg-gray-800/30 border-t border-gray-100/50 dark:border-gray-700/50 backdrop-blur-sm">
              <input
                type="text"
                placeholder="+ Add item"
                className="w-full px-6 py-3 bg-white/50 dark:bg-gray-900/50 rounded-full text-sm outline-none focus:ring-2 focus:ring-brand-500/50 dark:text-white transition-all placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddItem(list.id, e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListsView;
