import React, { useState } from 'react';
import { CategoryItem } from '../types';
import { TreeNode } from './TreeNode';
import { AddItemInput } from './AddItemInput';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { apiClient } from '../services/api';

interface CategoryNodeProps {
  category: CategoryItem;
  onToggle: (id: number) => void;
  onRename: (id: number, newName: string) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number, type: 'folder' | 'card', name: string) => void;
  onMove: (itemId: number, newParentId: number | null) => void;
  onCategoryUpdate: () => void;
  onCategoryRefresh: (categoryId: number, expandFolderId?: number) => void;
}

export const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  onToggle,
  onRename,
  onDelete,
  onAddChild,
  onMove,
  onCategoryUpdate,
  onCategoryRefresh,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [showAddInput, setShowAddInput] = useState(false);
  const [addType, setAddType] = useState<'folder' | 'card'>('folder');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRename = async () => {
    if (editName.trim() && editName.trim() !== category.name) {
      try {
        await apiClient.updateCard(category.id, { name: editName.trim() });
        onRename(category.id, editName.trim());
      } catch (err: any) {
        console.error('Error renaming category:', err);
        setEditName(category.name); // Reset on error
      }
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(category.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete the category "${category.name}" and all its contents?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiClient.deleteCard(category.id);
      onDelete(category.id);
      onCategoryUpdate();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddChild = async (name: string) => {
    try {
      await apiClient.createCard({
        name,
        parent_id: null, // Root level items in category
        is_folder: addType === 'folder',
        category_id: category.id,
      });

      // Refresh only this specific category
      onCategoryRefresh(category.id);
      setShowAddInput(false);
    } catch (err: any) {
      console.error('Error adding child:', err);
      alert('Failed to add item');
    }
  };

  const handleAddChildToFolder = async (parentId: number, type: 'folder' | 'card', name: string) => {
    try {
      await apiClient.createCard({
        name,
        parent_id: parentId, // Set the folder as parent
        is_folder: type === 'folder',
        category_id: category.id, // Keep the same category
      });

      // Refresh the category to show the new card, and expand the parent folder
      onCategoryRefresh(category.id, parentId);
    } catch (err: any) {
      console.error('Error adding child to folder:', err);
      alert('Failed to add item');
    }
  };

  const handleAddFolder = () => {
    setAddType('folder');
    setShowAddInput(true);
  };

  const handleAddCard = () => {
    setAddType('card');
    setShowAddInput(true);
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-4 bg-white">
      {/* Category Header */}
      <div className="group flex items-center py-3 px-4 hover:bg-gray-50 rounded-t-lg border-b border-gray-100">
        <div className="flex items-center flex-1 min-w-0">
          {/* Expand/collapse button */}
          <button
            onClick={() => onToggle(category.id)}
            className="mr-3 p-1 hover:bg-gray-200 rounded"
          >
            {category.isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Category Icon */}
          <div className="mr-3 flex-shrink-0">
            <Folder className="h-5 w-5 text-purple-600" />
          </div>

          {/* Category Name */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="w-full border-0 outline-none text-lg font-semibold bg-transparent"
                autoFocus
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {category.name}
              </h3>
            )}
          </div>

          {/* Add buttons - always visible for categories */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleAddFolder}
              className="p-1.5 hover:bg-blue-100 rounded bg-blue-50"
              title="Add folder"
            >
              <Folder className="h-4 w-4 text-blue-600" />
            </button>
            <button
              onClick={handleAddCard}
              className="p-1.5 hover:bg-gray-200 rounded bg-gray-100"
              title="Add card"
            >
              <Plus className="h-4 w-4 text-gray-700" />
            </button>
          </div>

          {/* Edit/Delete actions - show on hover */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-gray-200 rounded"
              title="Rename category"
            >
              <Edit2 className="h-4 w-4 text-gray-600" />
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 hover:bg-gray-200 rounded text-red-600 disabled:opacity-50"
              title="Delete category"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add item input */}
      {showAddInput && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <AddItemInput
            parentId={category.id}
            type={addType}
            onSubmit={handleAddChild}
            onCancel={() => setShowAddInput(false)}
            placeholder={`Add ${addType}...`}
          />
        </div>
      )}

      {/* Category Children */}
      {category.isExpanded && category.children.length > 0 && (
        <div className="p-4">
          {category.children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={handleAddChildToFolder}
              onMove={onMove}
              level={0}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {category.isExpanded && category.children.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No items in this category yet</p>
          <p className="text-xs mt-1">Add folders or cards to get started</p>
        </div>
      )}
    </div>
  );
};
