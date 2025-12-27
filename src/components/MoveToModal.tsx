import React, { useState, useEffect } from 'react';
import { X, Folder, Tag, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { CategoryItem, TreeItem } from '../types';
import { apiClient } from '../services/api';

interface MoveToModalProps {
  item: TreeItem;
  categories: CategoryItem[];
  onClose: () => void;
  onMove: (itemId: number, data: { parent_id?: number | null; category_id?: number | null }) => Promise<void>;
}

export const MoveToModal: React.FC<MoveToModalProps> = ({
  item,
  categories,
  onClose,
  onMove,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  // Check if target folder is a subfolder (has a parent_id)
  const isSubfolder = (folder: TreeItem): boolean => {
    return folder.parent_id !== null && folder.parent_id !== undefined;
  };

  // Check if trying to move a folder into a subfolder
  const validateMove = (targetFolderId: number | null, targetCategoryId: number | null): boolean => {
    if (item.is_folder && targetFolderId) {
      // Find the target folder
      let targetFolder: TreeItem | null = null;
      for (const category of categories) {
        const findFolder = (items: TreeItem[]): TreeItem | null => {
          for (const it of items) {
            if (it.id === targetFolderId) {
              return it;
            }
            if (it.children.length > 0) {
              const found = findFolder(it.children);
              if (found) return found;
            }
          }
          return null;
        };
        targetFolder = findFolder(category.children);
        if (targetFolder) break;
      }

      if (targetFolder && isSubfolder(targetFolder)) {
        setError('Subfolders cannot contain other folders. Please select a top-level folder or category.');
        return false;
      }
    }
    return true;
  };

  const handleMove = async () => {
    setError(null);
    
    const moveData: { parent_id?: number | null; category_id?: number | null } = {};
    
    if (selectedCategoryId) {
      moveData.category_id = selectedCategoryId;
      moveData.parent_id = null;
    } else if (selectedFolderId) {
      moveData.parent_id = selectedFolderId;
    } else {
      setError('Please select a destination');
      return;
    }

    if (!validateMove(selectedFolderId, selectedCategoryId)) {
      return;
    }

    try {
      setIsMoving(true);
      await onMove(item.id, moveData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to move item');
    } finally {
      setIsMoving(false);
    }
  };

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolder = (folder: TreeItem, level: number = 0): React.ReactNode => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSub = isSubfolder(folder);
    const canSelect = !isSub || !item.is_folder;
    const hasFolderChildren = folder.children.filter((child) => child.is_folder).length > 0;

    return (
      <div key={folder.id} className={level > 0 ? "ml-4 mt-1" : "mt-1"}>
        <div
          className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
            selectedFolderId === folder.id
              ? 'bg-blue-100 border-2 border-blue-500'
              : canSelect
              ? 'hover:bg-gray-100'
              : 'opacity-50 cursor-not-allowed'
          }`}
          onClick={() => {
            if (canSelect) {
              setSelectedFolderId(folder.id);
              setSelectedCategoryId(null);
              setError(null);
            }
          }}
        >
          {hasFolderChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasFolderChildren && <div className="w-6 mr-2" />}
          <Folder className="h-4 w-4 mr-2 text-blue-600" />
          <span className="text-sm flex-1">{folder.name}</span>
          {isSub && item.is_folder && (
            <span className="text-xs text-gray-500 ml-2">(Cannot move folder here)</span>
          )}
        </div>
        {isExpanded && hasFolderChildren && (
          <div className="ml-4">
            {folder.children
              .filter((child) => child.is_folder)
              .map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Move To</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Moving: <span className="font-semibold">{item.name}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Categories with their folders grouped */}
            {categories.map((category) => {
              const categoryFolders = category.children.filter((child) => child.is_folder);
              const isCategoryExpanded = expandedFolders.has(category.id);
              
              return (
                <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Category header */}
                  <div
                    className={`flex items-center p-3 cursor-pointer transition-colors ${
                      selectedCategoryId === category.id
                        ? 'bg-purple-100 border-b border-purple-300'
                        : 'hover:bg-gray-50 border-b border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setSelectedFolderId(null);
                      setError(null);
                    }}
                  >
                    {categoryFolders.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFolder(category.id);
                        }}
                        className="mr-2 p-1 hover:bg-gray-200 rounded"
                      >
                        {isCategoryExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                    )}
                    {categoryFolders.length === 0 && <div className="w-6 mr-2" />}
                    <Tag className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="text-sm font-semibold flex-1">{category.name}</span>
                    {categoryFolders.length > 0 && (
                      <span className="text-xs text-gray-500">({categoryFolders.length} folders)</span>
                    )}
                  </div>
                  
                  {/* Folders under this category */}
                  {isCategoryExpanded && categoryFolders.length > 0 && (
                    <div className="bg-gray-50 p-2">
                      {categoryFolders.map((folder) => renderFolder(folder, 0))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isMoving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={isMoving || (!selectedCategoryId && !selectedFolderId)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isMoving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Moving...</span>
              </>
            ) : (
              <span>Move</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

