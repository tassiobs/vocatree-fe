import React, { useState, useEffect } from 'react';
import { CategoryItem, TreeItem } from '../types';
import { TreeNode } from './TreeNode';
import { AddItemInput } from './AddItemInput';
import { AICardForm } from './AICardForm';
import { DropdownMenu, DropdownMenuItem, createEditAction, createDeleteAction, createAICardAction } from './DropdownMenu';
import { handleConditionalDelete } from '../utils/deleteUtils';
import { X, Tag, Loader2, Folder, Plus, Check } from 'lucide-react';
import { apiClient } from '../services/api';
import { buildTree } from '../utils/treeUtils';

interface CategoryViewProps {
  category: CategoryItem;
  onClose: () => void;
  onRename: (id: number, newName: string) => void;
  onDelete: (id: number) => void;
  onMove: (itemId: number, data: { parent_id?: number | null; category_id?: number | null }) => Promise<void>;
  onCategoryRefresh: (categoryId: number, expandFolderId?: number) => void;
  categories?: CategoryItem[];
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  onClose,
  onRename,
  onDelete,
  onMove,
  onCategoryRefresh,
  categories = [],
}) => {
  const [categoryData, setCategoryData] = useState<CategoryItem>(category);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [allCategories, setAllCategories] = useState<CategoryItem[]>(categories);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [showAddInput, setShowAddInput] = useState(false);
  const [addType, setAddType] = useState<'folder' | 'card'>('folder');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAICardForm, setShowAICardForm] = useState(false);

  useEffect(() => {
    loadCategoryData();
    loadAllCategories();
  }, [category.id]);

  // Sync editName with category.name when category changes
  useEffect(() => {
    if (!isEditing) {
      setEditName(categoryData.name);
    }
  }, [categoryData.name, isEditing]);

  const loadAllCategories = async () => {
    try {
      const cats = await apiClient.getCategories();
      setAllCategories(cats.map((cat) => ({
        id: cat.id,
        name: cat.name,
        isExpanded: false,
        children: [],
      })));
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadCategoryData = async () => {
    try {
      setIsLoading(true);
      const cards = await apiClient.getCardsHierarchy(category.id);
      const treeData = buildTree(cards, expandedIds);
      
      setCategoryData({
        ...category,
        children: treeData,
        isExpanded: true,
      });
    } catch (err: any) {
      console.error('Error loading category data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      // Update the tree items with new expansion state
      const updateTreeExpansion = (items: TreeItem[]): TreeItem[] => {
        return items.map((item) => ({
          ...item,
          isExpanded: newSet.has(item.id),
          children: item.children ? updateTreeExpansion(item.children) : [],
        }));
      };
      
      setCategoryData((prev) => ({
        ...prev,
        children: updateTreeExpansion(prev.children),
      }));
      
      return newSet;
    });
  };

  const handleAddChildToFolder = async (parentId: number, type: 'folder' | 'card', name: string) => {
    try {
      await apiClient.createCard({
        name,
        parent_id: parentId,
        is_folder: type === 'folder',
        category_id: category.id,
      });

      // Refresh the category data
      await loadCategoryData();
    } catch (err: any) {
      console.error('Error adding child to folder:', err);
      const errorMessage = err.message || err.response?.data?.detail || 'Failed to add item';
      alert(`Failed to add item: ${errorMessage}`);
    }
  };

  const handleCategoryRefresh = async () => {
    await loadCategoryData();
  };

  const handleRename = async () => {
    if (!editName.trim()) {
      setEditName(categoryData.name);
      setIsEditing(false);
      return;
    }

    if (editName.trim() === categoryData.name) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.updateCategory(categoryData.id, { name: editName.trim() });
      onRename(categoryData.id, editName.trim());
      setCategoryData({ ...categoryData, name: editName.trim() });
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error renaming category:', err);
      setEditName(categoryData.name); // Reset on error
      alert('Failed to rename category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(categoryData.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && (relatedTarget.closest('.edit-actions') || relatedTarget.closest('button'))) {
      return;
    }
    setTimeout(() => {
      if (isEditing) {
        handleRename();
      }
    }, 200);
  };

  const handleDelete = async () => {
    const categoryAsTreeItem = {
      id: categoryData.id,
      name: categoryData.name,
      type: 'folder' as const,
      parent_id: null,
      is_folder: true,
      children: categoryData.children,
      isExpanded: false,
      isCategory: true,
    };

    try {
      setIsDeleting(true);
      await handleConditionalDelete(
        categoryAsTreeItem,
        () => {
          onDelete(categoryData.id);
          onClose();
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
        parent_id: null,
        is_folder: addType === 'folder',
        category_id: categoryData.id,
      });

      await loadCategoryData();
      setShowAddInput(false);
    } catch (err: any) {
      console.error('Error adding child:', err);
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

  const handleAICardSuccess = (cardId: number) => {
    setShowAICardForm(false);
    loadCategoryData();
  };

  // Create dropdown menu items for category
  const getCategoryDropdownItems = (): DropdownMenuItem[] => {
    return [
      createAICardAction(() => setShowAICardForm(true)),
      createEditAction(() => setIsEditing(true)),
      createDeleteAction(handleDelete),
    ];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border border-purple-300 rounded-md px-3 py-1 text-lg sm:text-xl font-bold bg-white text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                    disabled={isSaving}
                  />
                  <div className="edit-actions flex items-center space-x-1">
                    <button
                      onClick={handleRename}
                      disabled={isSaving || !editName.trim()}
                      className="p-1.5 hover:bg-green-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save"
                    >
                      <Check className="h-5 w-5 text-green-600" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="p-1.5 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancel"
                    >
                      <X className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-purple-900 truncate">
                    {categoryData.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-600 mt-1">
                    {categoryData.children.length} {categoryData.children.length === 1 ? 'item' : 'items'}
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Add buttons */}
          {!isEditing && (
            <div className="flex items-center space-x-2 mr-2">
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
          )}

          {/* Actions dropdown menu */}
          {!isEditing && (
            <div className="mr-2">
              <DropdownMenu
                items={getCategoryDropdownItems()}
                className="opacity-100"
                disabled={isDeleting}
              />
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            title="Close"
          >
            <X className="h-5 w-5 text-purple-600" />
          </button>
        </div>

        {/* Add item input */}
        {showAddInput && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-100">
            <AddItemInput
              parentId={null}
              type={addType}
              onSubmit={handleAddChild}
              onCancel={() => setShowAddInput(false)}
              placeholder={`Add ${addType}...`}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Loading category...</span>
            </div>
          ) : categoryData.children.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Folder className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No items in this category</p>
              <p className="text-sm text-center mb-4">Add folders or cards to get started</p>
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
          ) : (
            <div className="space-y-2">
              {categoryData.children.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onRename={onRename}
                  onDelete={onDelete}
                  onAddChild={handleAddChildToFolder}
                  onMove={onMove}
                  level={0}
                  categoryId={category.id}
                  categories={allCategories}
                />
              ))}
            </div>
          )}
        </div>

        {/* AI Card Form Modal */}
        {showAICardForm && (
          <AICardForm
            categoryId={categoryData.id}
            categoryName={categoryData.name}
            onClose={() => setShowAICardForm(false)}
            onSuccess={handleAICardSuccess}
          />
        )}
      </div>
    </div>
  );
};

