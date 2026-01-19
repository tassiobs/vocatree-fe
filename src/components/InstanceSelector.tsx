import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useInstance } from '../hooks/useInstance';

export const InstanceSelector: React.FC = () => {
  const { instances, selectedInstanceId, isLoading, selectInstance } = useInstance();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (instanceId: number) => {
    selectInstance(instanceId);
    setIsOpen(false);
  };

  const selectedInstance = instances.find(inst => inst.id === selectedInstanceId);

  // Don't show selector if no instances or only one instance (auto-selected)
  if (isLoading || instances.length <= 1) {
    return null;
  }

  // Show message if no instances
  if (instances.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        No instances available
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-gray-900 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate max-w-[150px] sm:max-w-[200px]">
          {selectedInstance?.name || 'Select instance'}
        </span>
        <ChevronDown className={`h-4 w-4 text-blue-600 flex-shrink-0 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 max-h-60 overflow-auto"
          role="listbox"
        >
          {instances.map((instance) => (
            <button
              key={instance.id}
              onClick={() => handleSelect(instance.id)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                instance.id === selectedInstanceId
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={instance.id === selectedInstanceId}
            >
              {instance.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
