import React, { useState, useEffect, useRef } from 'react';
import { AddItemInputProps } from '../types';
import { Check, X } from 'lucide-react';

export const AddItemInput: React.FC<AddItemInputProps> = ({
  parentId,
  type,
  onSubmit,
  onCancel,
  placeholder,
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleCancel = () => {
    setName('');
    onCancel();
  };

  return (
    <div className="flex items-center space-x-2 py-1 px-3 bg-white border border-gray-300 rounded-md shadow-sm">
      <form onSubmit={handleSubmit} className="flex-1">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border-0 outline-none text-sm"
          autoComplete="off"
        />
      </form>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Add item"
        >
          <Check className="h-3 w-3" />
        </button>
        
        <button
          onClick={handleCancel}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded"
          title="Cancel"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

