import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface ListInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export const ListInput: React.FC<ListInputProps> = ({ 
  label, 
  items, 
  onChange, 
  placeholder = 'Add item...' 
}) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* List of existing items */}
      <div className="space-y-2 mb-2">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center space-x-2 bg-gray-50 p-2 rounded border border-gray-200"
          >
            <span className="flex-1 text-sm text-gray-900">{item}</span>
            <button
              onClick={() => handleRemove(index)}
              className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Input to add new item */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          title="Add item"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add</span>
        </button>
      </div>
    </div>
  );
};



