import React, { useState } from 'react';
import { TreeNodeProps } from '../types';
import { AddItemInput } from './AddItemInput';
import { CardDetail } from './CardDetail';
import { DropdownMenu, DropdownMenuItem, createEditAction, createDeleteAction, createAddChildAction, createMoveAction, createDuplicateAction } from './DropdownMenu';
import { handleConditionalDelete } from '../utils/deleteUtils';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  Plus,
  GripVertical,
  Hash
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
  const [showDetail, setShowDetail] = useState(false);

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

  const handleCardClick = () => {
    if (!isEditing) {
      setShowDetail(true);
    }
  };

  const handleDetailClose = () => {
    setShowDetail(false);
  };

  const handleDetailSave = () => {
    // Refresh the parent tree to show updated data
    window.location.reload();
  };

  // Create dropdown menu items
  const getDropdownItems = (): DropdownMenuItem[] => {
    const items: DropdownMenuItem[] = [
      createEditAction(() => setIsEditing(true)),
      createDeleteAction(() => handleConditionalDelete(item, () => onDelete(item.id))),
    ];

    // Add child actions for folders
    if (item.is_folder) {
      items.push(createAddChildAction(handleAddFolder, 'folder'));
      items.push(createAddChildAction(handleAddCard, 'card'));
    }

    // Add move and duplicate actions (placeholders for now)
    items.push(createMoveAction(() => {
      // TODO: Implement move functionality
      console.log('Move action clicked for item:', item.id);
    }));

    items.push(createDuplicateAction(() => {
      // TODO: Implement duplicate functionality
      console.log('Duplicate action clicked for item:', item.id);
    }));

    return items;
  };

  // Calculate indentation based on level
  const indentPx = level * 24; // Increased from 20px for better visual separation
  
  // Get item count for folders
  const itemCount = item.children ? item.children.length : 0;
  const hasChildren = item.children && item.children.length > 0;
  
  // Different styling based on level and type
  const isTopLevelFolder = level === 0 && item.is_folder;
  const isSubfolder = level === 1 && item.is_folder;
  const isCard = !item.is_folder;

  return (
    <div className="relative">
      {/* Main item container */}
      <div 
        className={`group flex items-center transition-all duration-200 ${
          isTopLevelFolder 
            ? 'py-3 px-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg mb-2 hover:bg-blue-100' 
            : isSubfolder
            ? 'py-2 px-3 ml-6 bg-gray-50 border-l-2 border-gray-300 rounded-md mb-1 hover:bg-gray-100'
            : isCard
            ? 'py-1.5 px-3 ml-8 hover:bg-gray-50 rounded-md border-l border-gray-200'
            : 'py-2 px-3 hover:bg-gray-50 rounded-md'
        }`}
        style={{ marginLeft: `${indentPx}px` }}
      >
        <div className="flex items-center flex-1 min-w-0">
          {/* Drag handle - only show for folders */}
          {item.is_folder && (
            <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="h-3 w-3 text-gray-400" />
            </div>
          )}

          {/* Expand/collapse button - only for items with children */}
          {hasChildren && (
            <button
              onClick={() => onToggle(item.id)}
              className={`mr-2 p-1 hover:bg-gray-200 rounded transition-colors ${
                isTopLevelFolder ? 'hover:bg-blue-200' : ''
              }`}
            >
              {item.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}

          {/* Spacer for items without expand button */}
          {!hasChildren && <div className="w-6 mr-2" />}

          {/* Icon with different styling based on type and level */}
          <div className="mr-3 flex-shrink-0">
            {item.is_folder ? (
              <Folder className={`${isTopLevelFolder ? 'h-5 w-5 text-blue-600' : 'h-4 w-4 text-blue-500'}`} />
            ) : (
              <FileText className="h-3.5 w-3.5 text-gray-500" />
            )}
          </div>

          {/* Name with appropriate styling */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className={`w-full border-0 outline-none bg-transparent ${
                  isTopLevelFolder ? 'text-lg font-semibold' : 'text-sm'
                }`}
                autoFocus
              />
            ) : (
              <button
                onClick={isCard ? handleCardClick : undefined}
                className={`truncate text-left w-full transition-colors ${
                  isTopLevelFolder 
                    ? 'text-lg font-semibold text-gray-900 hover:text-blue-700' 
                    : isSubfolder
                    ? 'text-sm font-medium text-gray-800 hover:text-blue-600'
                    : 'text-sm text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.name}
              </button>
            )}
          </div>

          {/* Item count for folders */}
          {item.is_folder && itemCount > 0 && (
            <div className="mr-2 flex items-center">
              <Hash className="h-3 w-3 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500">{itemCount}</span>
            </div>
          )}

          {/* Add buttons - only for folders */}
          {item.is_folder && (
            <div className="flex items-center space-x-1">
              {item.parent_id === null && (
                <button
                  onClick={handleAddFolder}
                  className="p-1 hover:bg-blue-100 rounded bg-blue-50"
                  title="Add subfolder"
                >
                  <Folder className="h-3 w-3 text-blue-600" />
                </button>
              )}
              <button
                onClick={handleAddCard}
                className="p-1 hover:bg-gray-200 rounded bg-gray-100"
                title="Add card"
              >
                <Plus className="h-3 w-3 text-gray-700" />
              </button>
            </div>
          )}

          {/* Actions dropdown menu */}
          <div className="ml-2">
            <DropdownMenu
              items={getDropdownItems()}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>

      {/* Add item input */}
      {showAddInput && (
        <div 
          className="mt-2"
          style={{ marginLeft: `${indentPx + 24}px` }}
        >
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
      {item.isExpanded && item.children && item.children.length > 0 && (
        <div className="mt-1">
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

      {/* Card Detail Modal */}
      {showDetail && (
        <CardDetail
          cardId={item.id}
          onClose={handleDetailClose}
          onSave={handleDetailSave}
        />
      )}
    </div>
  );
};