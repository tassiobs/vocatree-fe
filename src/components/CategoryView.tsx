import React, { useState, useEffect } from 'react';
import { CategoryItem, TreeItem } from '../types';
import { TreeNode } from './TreeNode';
import { X, Tag, Loader2, Folder } from 'lucide-react';
import { apiClient } from '../services/api';
import { buildTree } from '../utils/treeUtils';

interface CategoryViewProps {
  category: CategoryItem;
  onClose: () => void;
  onRename: (id: number, newName: string) => void;
  onDelete: (id: number) => void;
  onMove: (itemId: number, newParentId: number | null) => void;
  onCategoryRefresh: (categoryId: number, expandFolderId?: number) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  category,
  onClose,
  onRename,
  onDelete,
  onMove,
  onCategoryRefresh,
}) => {
  const [categoryData, setCategoryData] = useState<CategoryItem>(category);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCategoryData();
  }, [category.id]);

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
              <h2 className="text-lg sm:text-xl font-bold text-purple-900 truncate">
                {categoryData.name}
              </h2>
              <p className="text-xs sm:text-sm text-purple-600 mt-1">
                {categoryData.children.length} {categoryData.children.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            title="Close"
          >
            <X className="h-5 w-5 text-purple-600" />
          </button>
        </div>

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
              <p className="text-sm text-center">Add folders or cards to get started</p>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

