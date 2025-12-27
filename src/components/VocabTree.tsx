import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CategoryItem } from '../types';
import { CategoryNode } from './CategoryNode';
import { AddItemInput } from './AddItemInput';
import { AITreeGenerator } from './AITreeGenerator';
import { apiClient } from '../services/api';
import { buildTree, updateTreeItem, removeTreeItem, moveTreeItem, findTreeItem, getExpandedIds, moveItemAcrossCategories } from '../utils/treeUtils';
import { Loader2, Sparkles, Tag, Check } from 'lucide-react';

export const VocabTree: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const categoriesRef = useRef<CategoryItem[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  // Load initial data
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the new combined endpoint that returns categories with their cards
      const categoriesWithCards = await apiClient.getCategoriesWithCards();
      console.log('Categories with cards response:', categoriesWithCards);
      
      const categoriesWithChildren = categoriesWithCards.map((item) => {
        // Log cards to verify is_folder field
        if (item.cards && item.cards.length > 0) {
          console.log(`Category ${item.category?.name || 'Uncategorized'}:`, 
            item.cards.map(card => ({ id: card.id, name: card.name, is_folder: card.is_folder }))
          );
        }
        
        // Handle null category (uncategorized items)
        if (!item.category) {
          const treeData = buildTree(item.cards || []);
          return {
            id: 0, // Use 0 for uncategorized items
            name: 'Uncategorized',
            isExpanded: false,
            children: treeData,
          };
        }
        
        // Handle regular category
        const treeData = buildTree(item.cards || []);
        return {
          id: item.category.id,
          name: item.category.name,
          isExpanded: false,
          children: treeData,
        };
      });
      
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
      // Check if this is a category rename
      // Note: CategoryNode already makes the API call for categories, so we only update UI
      // For non-categories (cards/folders), we need to make the API call
      const isCategory = categories.some(cat => cat.id === id);
      
      if (!isCategory) {
        // For non-categories, make the API call
        await apiClient.updateCard(id, { name: newName });
      }
      
      // Update UI state for both categories and non-categories
      setCategories(prevCategories => 
        prevCategories.map(category => {
          // Check if this is a category rename
          if (category.id === id) {
            return { ...category, name: newName };
          }
          // Otherwise, update children
          return {
            ...category,
            children: updateTreeItem(category.children, id, { name: newName })
          };
        })
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to rename item');
      console.error('Error renaming item:', err);
    }
  }, [categories]);

  const handleDelete = useCallback((id: number) => {
    // This function is called after the API delete has already been handled by handleConditionalDelete
    // We just need to update the UI state
    console.log(`VocabTree handleDelete called for item ${id} - updating UI only`);
    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        children: removeTreeItem(category.children, id)
      }))
    );
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

  const handleMove = useCallback(async (itemId: number, data: { parent_id?: number | null; category_id?: number | null }) => {
    // Store original state for rollback on error (deep clone using JSON)
    const originalCategories = JSON.parse(JSON.stringify(categoriesRef.current));
    
    // Find the item name for the success message
    let itemName = '';
    for (const category of categoriesRef.current) {
      const found = findTreeItem(category.children, itemId);
      if (found) {
        itemName = found.name;
        break;
      }
    }
    
    // Optimistically update UI
    setCategories(prevCategories => {
      const updated = moveItemAcrossCategories(
        prevCategories,
        itemId,
        data.parent_id ?? null,
        data.category_id ?? null
      );
      // Update ref with new state
      categoriesRef.current = updated;
      return updated;
    });
    
    try {
      await apiClient.moveCard(itemId, data);
      // Success - UI already updated optimistically, show success message
      setSuccessMessage(`"${itemName}" moved successfully`);
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      // Rollback on error
      setCategories(originalCategories);
      categoriesRef.current = originalCategories;
      setError(err.response?.data?.detail || 'Failed to move item');
      console.error('Error moving item:', err);
      throw err;
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
    <div className="space-y-4 relative">
      {/* Success Toast Notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg px-4 py-3 flex items-center space-x-2 min-w-[250px] max-w-md">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-800 flex-1">{successMessage}</p>
          </div>
        </div>
      )}

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
              categories={categories}
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