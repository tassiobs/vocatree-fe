import React, { useState } from 'react';
import { CategoryItem } from '../types';
import { TreeNode } from './TreeNode';
import { AddItemInput } from './AddItemInput';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  Plus,
  Hash,
  Tag,
  FileText
} from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, createEditAction, createDeleteAction, createAddChildAction, createMoveAction, createDuplicateAction } from './DropdownMenu';
import { handleConditionalDelete } from '../utils/deleteUtils';
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
    // Create a temporary TreeItem structure for the category to use with conditional delete
    const categoryAsTreeItem = {
      id: category.id,
      name: category.name,
      type: 'folder' as const,
      parent_id: null,
      is_folder: true,
      children: category.children,
      isExpanded: category.isExpanded,
      isCategory: true, // Add flag to identify this as a category
    };

    try {
      setIsDeleting(true);
      await handleConditionalDelete(
        categoryAsTreeItem,
        () => {
          // Category deletion should refresh the entire category list
          onCategoryUpdate();
        },
        (error) => {
          console.error('Error deleting category:', error);
          alert('Failed to delete category');
        }
      );
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

  // Create dropdown menu items for category
  const getCategoryDropdownItems = (): DropdownMenuItem[] => {
    return [
      createEditAction(() => setIsEditing(true)),
      createDeleteAction(handleDelete),
      createAddChildAction(handleAddFolder, 'folder'),
      createAddChildAction(handleAddCard, 'card'),
      createMoveAction(() => {
        // TODO: Implement move functionality for categories
        console.log('Move action clicked for category:', category.id);
      }),
      createDuplicateAction(() => {
        // TODO: Implement duplicate functionality for categories
        console.log('Duplicate action clicked for category:', category.id);
      }),
    ];
  };

  // Calculate total items in category
  const totalItems = category.children.length;
  const folderCount = category.children.filter(child => child.is_folder).length;
  const cardCount = category.children.filter(child => !child.is_folder).length;

  return (
    <div className="border border-gray-200 rounded-xl mb-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Category Header */}
      <div className="group flex items-center py-4 px-5 hover:bg-purple-50 rounded-t-xl border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center flex-1 min-w-0">
          {/* Expand/collapse button */}
          <button
            onClick={() => onToggle(category.id)}
            className="mr-4 p-2 hover:bg-purple-100 rounded-lg transition-colors"
          >
            {category.isExpanded ? (
              <ChevronDown className="h-5 w-5 text-purple-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-purple-600" />
            )}
          </button>

          {/* Category Icon */}
          <div className="mr-4 flex-shrink-0">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="h-6 w-6 text-purple-600" />
            </div>
          </div>

          {/* Category Name and Stats */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="w-full border-0 outline-none text-xl font-bold bg-transparent text-purple-900"
                autoFocus
              />
            ) : (
              <div>
                <h3 className="text-xl font-bold text-purple-900 truncate">
                  {category.name}
                </h3>
                {totalItems > 0 && (
                  <div className="flex items-center space-x-4 mt-1">
                    {/* Desktop stats - show text labels */}
                    <div className="hidden lg:flex items-center space-x-4">
                      <div className="flex items-center text-sm text-purple-600">
                        <Hash className="h-3 w-3 mr-1" />
                        <span>{totalItems} total</span>
                      </div>
                      {folderCount > 0 && (
                        <div className="flex items-center text-sm text-blue-600">
                          <Folder className="h-3 w-3 mr-1" />
                          <span>{folderCount} folders</span>
                        </div>
                      )}
                      {cardCount > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Hash className="h-3 w-3 mr-1" />
                          <span>{cardCount} cards</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Mobile stats - icon + number only */}
                    <div className="lg:hidden stats flex items-center space-x-3">
                      {folderCount > 0 && (
                        <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                          <Folder className="h-3 w-3 text-blue-600 mr-1" />
                          <span className="text-xs font-medium text-blue-700">{folderCount}</span>
                        </div>
                      )}
                      {cardCount > 0 && (
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                          <FileText className="h-3 w-3 text-gray-600 mr-1" />
                          <span className="text-xs font-medium text-gray-700">{cardCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Add buttons - always visible for categories */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddFolder}
              className="p-2 hover:bg-blue-100 rounded-lg bg-blue-50 transition-colors"
              title="Add folder"
            >
              <Folder className="h-4 w-4 text-blue-600" />
            </button>
            <button
              onClick={handleAddCard}
              className="p-2 hover:bg-gray-200 rounded-lg bg-gray-100 transition-colors"
              title="Add card"
            >
              <Plus className="h-4 w-4 text-gray-700" />
            </button>
          </div>

          {/* Actions dropdown menu */}
          <div className="ml-3">
            <DropdownMenu
              items={getCategoryDropdownItems()}
              className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              disabled={isDeleting}
            />
          </div>
        </div>
      </div>

      {/* Add item input */}
      {showAddInput && (
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
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
        <div className="p-5 bg-gray-50/30">
          <div className="space-y-1">
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
        </div>
      )}

      {/* Empty state */}
      {category.isExpanded && category.children.length === 0 && (
        <div className="p-12 text-center text-gray-500 bg-gray-50/30">
          <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Tag className="h-8 w-8 text-purple-300" />
          </div>
          <p className="text-lg font-medium text-gray-600 mb-2">No items in this category yet</p>
          <p className="text-sm text-gray-500 mb-4">Add folders or cards to get started</p>
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={handleAddFolder}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Add Folder
            </button>
            <button
              onClick={handleAddCard}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Add Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
