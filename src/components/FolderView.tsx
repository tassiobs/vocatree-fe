import React, { useState, useEffect } from 'react';
import { TreeItem, CategoryItem } from '../types';
import { TreeNode } from './TreeNode';
import { AddItemInput } from './AddItemInput';
import { AICardForm } from './AICardForm';
import { DropdownMenu, DropdownMenuItem, createEditAction, createDeleteAction, createAICardAction } from './DropdownMenu';
import { handleConditionalDelete } from '../utils/deleteUtils';
import { MoveToModal } from './MoveToModal';
import { X, Folder, Loader2, FileText, Plus, Check, Move } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showAddInput, setShowAddInput] = useState(false);
  const [addType, setAddType] = useState<'folder' | 'card'>('card');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAICardForm, setShowAICardForm] = useState(false);
  const [showMoveToModal, setShowMoveToModal] = useState(false);
  const isRootFolder = folder.parent_id === null;

  useEffect(() => {
    loadFolderData();
  }, [folder.id]);

  // Sync editName with folder.name when folder changes
  useEffect(() => {
    if (!isEditing) {
      setEditName(folderData.name);
    }
  }, [folderData.name, isEditing]);

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

  const handleRename = async () => {
    if (!editName.trim()) {
      setEditName(folderData.name);
      setIsEditing(false);
      return;
    }

    if (editName.trim() === folderData.name) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.updateCard(folderData.id, { name: editName.trim() });
      onRename(folderData.id, editName.trim());
      setFolderData({ ...folderData, name: editName.trim() });
      setIsEditing(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      console.error('Error renaming folder:', err);
      setEditName(folderData.name);
      alert('Failed to rename folder. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(folderData.name);
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
    try {
      setIsDeleting(true);
      await handleConditionalDelete(
        folderData,
        () => {
          onDelete(folderData.id);
          onClose();
        },
        (error) => {
          console.error('Error deleting folder:', error);
          alert('Failed to delete folder');
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
        parent_id: folderData.id,
        is_folder: addType === 'folder',
        category_id: folderData.category_id,
      });

      await loadFolderData();
      setShowAddInput(false);
      if (onRefresh) {
        onRefresh();
      }
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
    loadFolderData();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Create dropdown menu items for folder
  const getFolderDropdownItems = (): DropdownMenuItem[] => {
    const items: DropdownMenuItem[] = [
      createEditAction(() => setIsEditing(true)),
      {
        id: 'move',
        label: 'Move To...',
        icon: <Move className="h-4 w-4" />,
        onClick: () => setShowMoveToModal(true),
      },
      createDeleteAction(handleDelete),
      createAICardAction(() => setShowAICardForm(true)),
    ];
    return items;
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
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="flex-1 border border-blue-300 rounded-md px-3 py-1 text-lg sm:text-xl font-bold bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                </>
              )}
            </div>
          </div>
          
          {/* Add buttons */}
          {!isEditing && (
            <div className="flex items-center space-x-2 mr-2">
              {isRootFolder && (
                <button
                  onClick={handleAddFolder}
                  className="p-2 hover:bg-blue-100 rounded-lg bg-blue-50 transition-colors"
                  title="Add subfolder"
                >
                  <Folder className="h-4 w-4 text-blue-600" />
                </button>
              )}
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
                items={getFolderDropdownItems()}
                className="opacity-100"
                disabled={isDeleting}
              />
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            title="Close"
          >
            <X className="h-5 w-5 text-blue-600" />
          </button>
        </div>

        {/* Add item input */}
        {showAddInput && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-100">
            <AddItemInput
              parentId={folderData.id}
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
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading folder...</span>
            </div>
          ) : folderData.children.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Folder className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No items in this folder</p>
              <p className="text-sm text-center mb-4">
                {isRootFolder ? 'Add subfolders or cards to get started' : 'Add cards to get started'}
              </p>
              <div className="flex items-center justify-center space-x-2">
                {isRootFolder && (
                  <button
                    onClick={handleAddFolder}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Add Subfolder
                  </button>
                )}
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

        {/* AI Card Form Modal */}
        {showAICardForm && (
          <AICardForm
            parentId={folderData.id}
            parentName={folderData.name}
            onClose={() => setShowAICardForm(false)}
            onSuccess={handleAICardSuccess}
          />
        )}

        {/* Move To Modal */}
        {showMoveToModal && categories.length > 0 && (
          <MoveToModal
            item={folderData}
            categories={categories}
            onClose={() => setShowMoveToModal(false)}
            onMove={onMove}
          />
        )}
      </div>
    </div>
  );
};

