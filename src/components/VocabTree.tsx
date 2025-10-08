import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';
import { TreeItem } from '../types';
import { TreeNode } from './TreeNode';
import { AddItemInput } from './AddItemInput';
import { apiClient } from '../services/api';
import { buildTree, updateTreeItem, removeTreeItem, moveTreeItem, findTreeItem } from '../utils/treeUtils';
import { Plus, Folder, FileText, Loader2 } from 'lucide-react';

export const VocabTree: React.FC = () => {
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const [addType, setAddType] = useState<'folder' | 'card'>('folder');

  // Load initial data
  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cards = await apiClient.getCardsHierarchy();
      const treeData = buildTree(cards);
      setTree(treeData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load vocabulary tree');
      console.error('Error loading tree:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = useCallback((id: number) => {
    setTree(prevTree => 
      updateTreeItem(prevTree, id, { isExpanded: !findTreeItem(prevTree, id)?.isExpanded })
    );
  }, []);

  const handleRename = useCallback(async (id: number, newName: string) => {
    try {
      await apiClient.updateCard(id, { name: newName });
      setTree(prevTree => updateTreeItem(prevTree, id, { name: newName }));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to rename item');
      console.error('Error renaming item:', err);
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await apiClient.deleteCard(id);
      setTree(prevTree => removeTreeItem(prevTree, id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete item');
      console.error('Error deleting item:', err);
    }
  }, []);

  const handleAddChild = useCallback(async (parentId: number, type: 'folder' | 'card', name: string) => {
    try {
      const newCard = await apiClient.createCard({
        name,
        parent_id: parentId,
      });
      
      const newTreeItem: TreeItem = {
        id: newCard.id,
        name: newCard.name,
        type: type,
        parent_id: newCard.parent_id,
        children: [],
      };

      setTree(prevTree => 
        updateTreeItem(prevTree, parentId, {
          children: [...(findTreeItem(prevTree, parentId)?.children || []), newTreeItem],
          isExpanded: true, // Auto-expand when adding children
        })
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add item');
      console.error('Error adding item:', err);
    }
  }, []);

  const handleAddRootItem = async (name: string) => {
    try {
      const newCard = await apiClient.createCard({
        name,
        parent_id: null,
      });
      
      const newTreeItem: TreeItem = {
        id: newCard.id,
        name: newCard.name,
        type: addType,
        parent_id: null,
        children: [],
      };

      setTree(prevTree => [...prevTree, newTreeItem]);
      setShowAddInput(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add item');
      console.error('Error adding root item:', err);
    }
  };

  const handleMove = useCallback(async (itemId: number, newParentId: number | null) => {
    try {
      await apiClient.moveCard(itemId, newParentId);
      setTree(prevTree => moveTreeItem(prevTree, itemId, newParentId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to move item');
      console.error('Error moving item:', err);
    }
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const { draggableId, destination } = result;
    const itemId = parseInt(draggableId);
    
    // Find the destination parent ID
    let newParentId: number | null = null;
    
    if (destination.droppableId !== 'root') {
      newParentId = parseInt(destination.droppableId);
    }

    handleMove(itemId, newParentId);
  };

  const handleAddFolder = () => {
    setAddType('folder');
    setShowAddInput(true);
  };

  const handleAddCard = () => {
    setAddType('card');
    setShowAddInput(true);
  };

  // Note: flattenTree utility is available for future drag and drop enhancements

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="text-gray-600">Loading vocabulary tree...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
        <button
          onClick={loadTree}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vocabulary Tree</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAddFolder}
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Folder className="h-4 w-4" />
            <span>Add Folder</span>
          </button>
          <button
            onClick={handleAddCard}
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Add item input */}
      {showAddInput && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <AddItemInput
            parentId={null}
            type={addType}
            onSubmit={handleAddRootItem}
            onCancel={() => setShowAddInput(false)}
            placeholder={`Add ${addType}...`}
          />
        </div>
      )}

      {/* Tree */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="root" type="TREE_ITEM">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`
                min-h-64 border border-gray-200 rounded-lg
                ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-white'}
              `}
            >
              {tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Plus className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No vocabulary items yet</p>
                  <p className="text-sm mb-4">Start by adding your first folder or card</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddFolder}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
                    >
                      Add Folder
                    </button>
                    <button
                      onClick={handleAddCard}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md"
                    >
                      Add Card
                    </button>
                  </div>
                </div>
              ) : (
                tree.map((item, index) => (
                  <TreeNode
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                    onMove={handleMove}
                    level={0}
                  />
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};