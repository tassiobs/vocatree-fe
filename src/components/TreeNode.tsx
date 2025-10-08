import React, { useState } from 'react';
import { TreeNodeProps } from '../types';
import { AddItemInput } from './AddItemInput';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  Edit2, 
  Trash2, 
  Plus,
  GripVertical
} from 'lucide-react';

export const TreeNode: React.FC<TreeNodeProps> = ({
  item,
  onToggle,
  onRename,
  onDelete,
  onAddChild,
  onMove,
  level,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [showAddInput, setShowAddInput] = useState(false);
  const [addType, setAddType] = useState<'folder' | 'card'>('card');

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== item.name) {
      onRename(item.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(item.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleAddChild = (name: string) => {
    onAddChild(item.id, addType, name);
    setShowAddInput(false);
  };

  const handleAddFolder = () => {
    setAddType('folder');
    setShowAddInput(true);
  };

  const handleAddCard = () => {
    setAddType('card');
    setShowAddInput(true);
  };

  const indentStyle = {
    paddingLeft: `${level * 20}px`,
  };

  return (
    <div style={indentStyle}>
      <div className="group flex items-center py-2 px-3 hover:bg-gray-50 rounded-md">
        <div className="flex items-center flex-1 min-w-0">
          {/* Drag handle */}
          <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>

          {/* Expand/collapse button */}
          {item.type === 'folder' && (
            <button
              onClick={() => onToggle(item.id)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {item.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Icon */}
          <div className="mr-2 flex-shrink-0">
            {item.type === 'folder' ? (
              <Folder className="h-4 w-4 text-blue-500" />
            ) : (
              <FileText className="h-4 w-4 text-gray-600" />
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="w-full border-0 outline-none text-sm bg-transparent"
                autoFocus
              />
            ) : (
              <span className="text-sm text-gray-900 truncate">
                {item.name}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.type === 'folder' && (
              <>
                <button
                  onClick={handleAddFolder}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Add folder"
                >
                  <Folder className="h-3 w-3 text-blue-500" />
                </button>
                <button
                  onClick={handleAddCard}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Add card"
                >
                  <Plus className="h-3 w-3 text-gray-600" />
                </button>
              </>
            )}
            
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Rename"
            >
              <Edit2 className="h-3 w-3 text-gray-600" />
            </button>
            
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 hover:bg-gray-200 rounded text-red-600"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Add item input */}
      {showAddInput && (
        <div className="mt-1 ml-6">
          <AddItemInput
            parentId={item.id}
            type={addType}
            onSubmit={handleAddChild}
            onCancel={() => setShowAddInput(false)}
            placeholder={`Add ${addType}...`}
          />
        </div>
      )}

      {/* Children */}
      {item.type === 'folder' && item.isExpanded && item.children.length > 0 && (
        <div>
          {item.children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onMove={onMove}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};