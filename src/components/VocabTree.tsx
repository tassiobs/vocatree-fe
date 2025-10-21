import React, { useState, useEffect, useCallback } from 'react';
import { CategoryItem } from '../types';
import { CategoryNode } from './CategoryNode';
import { AddItemInput } from './AddItemInput';
import { AITreeGenerator } from './AITreeGenerator';
import { apiClient } from '../services/api';
import { buildTree, updateTreeItem, removeTreeItem, moveTreeItem, findTreeItem, getExpandedIds } from '../utils/treeUtils';
import { Loader2, Sparkles, Tag } from 'lucide-react';

export const VocabTree: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Load initial data
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First try to get categories
      let categoriesData;
      try {
        categoriesData = await apiClient.getCategories();
        console.log('Categories response:', categoriesData);
      } catch (categoryErr: any) {
        console.error('Categories endpoint error:', categoryErr);
        // If categories endpoint doesn't exist, fall back to loading all cards without categories
        const allCards = await apiClient.getCardsHierarchy();
        const treeData = buildTree(allCards);
        
        // Create a default "All Items" category
        setCategories([{
          id: 0,
          name: 'All Items',
          isExpanded: true,
          children: treeData,
        }]);
        setIsLoading(false);
        return;
      }
      
      const categoriesWithChildren = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const cards = await apiClient.getCardsHierarchy(category.id);
            const treeData = buildTree(cards);
            return {
              id: category.id,
              name: category.name,
              isExpanded: false,
              children: treeData,
            };
          } catch (err: any) {
            console.error(`Error loading cards for category ${category.id}:`, err);
            return {
              id: category.id,
              name: category.name,
              isExpanded: false,
              children: [],
            };
          }
        })
      );
      setCategories(categoriesWithChildren);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError(`Failed to load categories: ${err.message || err.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = useCallback((id: number) => {
    setCategories(prevCategories => 
      prevCategories.map(category => {
        if (category.id === id) {
          return { ...category, isExpanded: !category.isExpanded };
        }
        return {
          ...category,
          children: updateTreeItem(category.children, id, { 
            isExpanded: !findTreeItem(category.children, id)?.isExpanded 
          })
        };
      })
    );
  }, []);

  const handleRename = useCallback(async (id: number, newName: string) => {
    try {
      await apiClient.updateCard(id, { name: newName });
      setCategories(prevCategories => 
        prevCategories.map(category => ({
          ...category,
          children: updateTreeItem(category.children, id, { name: newName })
        }))
      );
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
      setCategories(prevCategories => 
        prevCategories.map(category => ({
          ...category,
          children: removeTreeItem(category.children, id)
        }))
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete item');
      console.error('Error deleting item:', err);
    }
  }, []);

  const handleCategoryRefresh = useCallback(async (categoryId: number, expandFolderId?: number) => {
    try {
      setCategories(prevCategories => {
        // Find the category to get current expanded state
        const currentCategory = prevCategories.find(cat => cat.id === categoryId);
        
        // Get currently expanded IDs
        const expandedIds = currentCategory ? getExpandedIds(currentCategory.children) : new Set<number>();
        
        // If we have a folder to expand, add it to the set
        if (expandFolderId) {
          expandedIds.add(expandFolderId);
        }
        
        return prevCategories; // Return unchanged for now, will update after fetch
      });
      
      const updatedCards = await apiClient.getCardsHierarchy(categoryId);
      
      setCategories(prevCategories => {
        const currentCategory = prevCategories.find(cat => cat.id === categoryId);
        const expandedIds = currentCategory ? getExpandedIds(currentCategory.children) : new Set<number>();
        
        if (expandFolderId) {
          expandedIds.add(expandFolderId);
        }
        
        const updatedTreeData = buildTree(updatedCards, expandedIds);
        
        return prevCategories.map(category => {
          if (category.id === categoryId) {
            return {
              ...category,
              children: updatedTreeData,
              isExpanded: true, // Auto-expand when adding children
            };
          }
          return category;
        });
      });
    } catch (err: any) {
      console.error('Error refreshing category:', err);
    }
  }, []);

  const handleAddCategory = async (name: string) => {
    try {
      const newCategory = await apiClient.createCategory(name);
      const newCategoryItem: CategoryItem = {
        id: newCategory.id,
        name: newCategory.name,
        isExpanded: false,
        children: [],
      };

      setCategories(prevCategories => [...prevCategories, newCategoryItem]);
      setShowAddCategory(false);
    } catch (err: any) {
      console.error('Error adding category:', err);
      setError(`Failed to add category: ${err.message || err.response?.data?.detail || 'Unknown error'}`);
    }
  };

  const handleMove = useCallback(async (itemId: number, newParentId: number | null) => {
    try {
      await apiClient.moveCard(itemId, newParentId);
      setCategories(prevCategories => 
        prevCategories.map(category => ({
          ...category,
          children: moveTreeItem(category.children, itemId, newParentId)
        }))
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to move item');
      console.error('Error moving item:', err);
    }
  }, []);



  const handleAIGeneratorSuccess = () => {
    loadCategories(); // Reload categories after AI generation
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
          onClick={loadCategories}
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
            onClick={() => setShowAIGenerator(true)}
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate with AI</span>
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <Tag className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Add category input */}
      {showAddCategory && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <AddItemInput
            parentId={null}
            type="folder"
            onSubmit={handleAddCategory}
            onCancel={() => setShowAddCategory(false)}
            placeholder="Add category..."
          />
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 border border-gray-200 rounded-lg bg-white">
            <Tag className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No categories yet</p>
            <p className="text-sm mb-4">Start by adding your first category</p>
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
            >
              Add Category
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <CategoryNode
              key={category.id}
              category={category}
              onToggle={handleToggle}
              onRename={handleRename}
              onDelete={handleDelete}
              onAddChild={() => {}} // Not used anymore
              onMove={handleMove}
              onCategoryUpdate={loadCategories}
              onCategoryRefresh={handleCategoryRefresh}
            />
          ))
        )}
      </div>

      {/* AI Tree Generator Modal */}
      {showAIGenerator && (
        <AITreeGenerator
          onClose={() => setShowAIGenerator(false)}
          onSuccess={handleAIGeneratorSuccess}
        />
      )}
    </div>
  );
};