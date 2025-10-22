import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Plus, 
  Move, 
  Copy,
  Folder,
  FileText
} from 'lucide-react';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  className?: string;
  disabled?: boolean;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate menu position
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Position to the right of the button, aligned to the right edge
      let right = viewportWidth - rect.right;
      let top = rect.bottom + 4; // Small gap below button
      
      // Ensure menu doesn't go off screen
      if (right < 200) { // If not enough space on right, position to the left
        right = viewportWidth - rect.left;
      }
      
      // If not enough space below, position above
      if (top + 200 > viewportHeight) {
        top = rect.top - 4; // Small gap above button
      }
      
      setPosition({ top, right });
    }
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
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
      // Use both mouse and touch events for better mobile support
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Three dots button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={disabled}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-100 active:bg-gray-200'
          }
          ${className}
        `}
        style={{ minWidth: '44px', minHeight: '44px' }} // Mobile-friendly tap target
        aria-label="More actions"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4 text-gray-600" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] max-w-[240px]"
          style={{
            top: `${position.top}px`,
            right: `${position.right}px`,
            maxHeight: '300px',
            overflowY: 'auto',
          }}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`
                w-full flex items-center px-4 py-3 text-sm transition-colors
                ${item.disabled
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : item.destructive
                  ? 'text-red-600 hover:bg-red-50 active:bg-red-100'
                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                }
              `}
              style={{ minHeight: '44px' }} // Mobile-friendly tap target
              role="menuitem"
            >
              <div className="mr-3 flex-shrink-0">
                {item.icon}
              </div>
              <span className="text-left flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Predefined action items for common use cases
export const createEditAction = (onEdit: () => void): DropdownMenuItem => ({
  id: 'edit',
  label: 'Edit',
  icon: <Edit2 className="h-4 w-4" />,
  onClick: onEdit,
});

export const createDeleteAction = (onDelete: () => void): DropdownMenuItem => ({
  id: 'delete',
  label: 'Delete',
  icon: <Trash2 className="h-4 w-4" />,
  onClick: onDelete,
  destructive: true,
});

export const createAddChildAction = (onAddChild: () => void, type: 'folder' | 'card' = 'card'): DropdownMenuItem => ({
  id: 'add-child',
  label: `Add ${type === 'folder' ? 'Subfolder' : 'Card'}`,
  icon: type === 'folder' ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />,
  onClick: onAddChild,
});

export const createMoveAction = (onMove: () => void): DropdownMenuItem => ({
  id: 'move',
  label: 'Move',
  icon: <Move className="h-4 w-4" />,
  onClick: onMove,
});

export const createDuplicateAction = (onDuplicate: () => void): DropdownMenuItem => ({
  id: 'duplicate',
  label: 'Duplicate',
  icon: <Copy className="h-4 w-4" />,
  onClick: onDuplicate,
});
