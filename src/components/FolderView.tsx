import React, { useState, useEffect } from 'react';
import { TreeItem, CategoryItem } from '../types';
import { TreeNode } from './TreeNode';
import { X, Folder, Loader2, FileText } from 'lucide-react';
import { apiClient } from '../services/api';
import { Card } from '../types/api';
import { cardToTreeItem } from '../utils/treeUtils';

interface FolderViewProps {
  folder: TreeItem;
  onClose: () => void;
  onRename: (id: number, newName: string) => void;
  onDelete: (id: number) => void;
  onMove: (itemId: number, data: { parent_id?: number | null; category_id?: number | null }) => Promise<void>;
  onRefresh?: () => void;
  categories?: CategoryItem[];
}

export const FolderView: React.FC<FolderViewProps> = ({
  folder,
  onClose,
  onRename,
  onDelete,
  onMove,
  onRefresh,
  categories = [],
}) => {
  const [folderData, setFolderData] = useState<TreeItem>(folder);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadFolderData();
  }, [folder.id]);

  const loadFolderData = async () => {
    try {
      setIsLoading(true);
      // Get the folder's direct children
      const response = await apiClient.getCardsByParent(folder.id);
      const children: TreeItem[] = response.items.map((card: Card) => cardToTreeItem(card));
      
      setFolderData({
        ...folder,
        children: children,
      });
    } catch (err: any) {
      console.error('Error loading folder data:', err);
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
      
      setFolderData((prev) => ({
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
        category_id: folder.category_id,
      });

      // Refresh the folder data
      await loadFolderData();
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      console.error('Error adding child to folder:', err);
      const errorMessage = err.message || err.response?.data?.detail || 'Failed to add item';
      alert(`Failed to add item: ${errorMessage}`);
    }
  };

  // Count items
  const totalItems = folderData.children.length;
  const folderCount = folderData.children.filter(child => child.is_folder).length;
  const cardCount = folderData.children.filter(child => !child.is_folder).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Folder className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-blue-900 truncate">
                {folderData.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                <p className="text-xs sm:text-sm text-blue-600">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </p>
                {folderCount > 0 && (
                  <p className="text-xs sm:text-sm text-blue-600 flex items-center">
                    <Folder className="h-3 w-3 mr-1" />
                    {folderCount} {folderCount === 1 ? 'folder' : 'folders'}
                  </p>
                )}
                {cardCount > 0 && (
                  <p className="text-xs sm:text-sm text-blue-600 flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            title="Close"
          >
            <X className="h-5 w-5 text-blue-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading folder...</span>
            </div>
          ) : folderData.children.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Folder className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No items in this folder</p>
              <p className="text-sm text-center">Add subfolders or cards to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {folderData.children.map((item) => (
                <TreeNode
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onRename={onRename}
                  onDelete={onDelete}
                  onAddChild={handleAddChildToFolder}
                  onMove={onMove}
                  level={0}
                  categoryId={folder.category_id}
                  categories={categories}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

