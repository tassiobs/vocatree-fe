import { TreeItem } from '../types';
import { Card } from '../types/api';

// Convert API Card to TreeItem (recursively handles children)
export const cardToTreeItem = (card: Card): TreeItem => {
  const children = card.children && card.children.length > 0 
    ? card.children.map(childCard => cardToTreeItem(childCard))
    : [];
  
  return {
    id: card.id,
    name: card.name,
    type: 'card',
    parent_id: card.parent_id,
    children: children,
    isExpanded: false, // Start collapsed
    example_phrases: card.example_phrases,
    meanings: card.meanings,
    grammar_roles: card.grammar_roles,
    collocations: card.collocations,
    synonyms: card.synonyms,
    antonyms: card.antonyms,
    use_count: card.use_count,
    notes: card.notes,
    created_at: card.created_at,
    user_created: card.user_created,
  };
};

// Build tree structure from hierarchical cards (from /cards/hierarchy endpoint)
export const buildTree = (cards: Card[]): TreeItem[] => {
  // The /cards/hierarchy endpoint returns cards with children already populated
  // So we just need to recursively convert them to TreeItems
  const treeItems = cards.map(card => cardToTreeItem(card));
  
  // Sort children by name
  const sortChildren = (items: TreeItem[]) => {
    items.sort((a, b) => {
      // Folders first, then cards
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    items.forEach(item => {
      if (item.children.length > 0) {
        sortChildren(item.children);
      }
    });
  };

  sortChildren(treeItems);
  return treeItems;
};

// Find item in tree by ID
export const findTreeItem = (tree: TreeItem[], id: number): TreeItem | null => {
  for (const item of tree) {
    if (item.id === id) {
      return item;
    }
    const found = findTreeItem(item.children, id);
    if (found) {
      return found;
    }
  }
  return null;
};

// Update item in tree
export const updateTreeItem = (tree: TreeItem[], id: number, updates: Partial<TreeItem>): TreeItem[] => {
  return tree.map(item => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    if (item.children.length > 0) {
      return { ...item, children: updateTreeItem(item.children, id, updates) };
    }
    return item;
  });
};

// Remove item from tree
export const removeTreeItem = (tree: TreeItem[], id: number): TreeItem[] => {
  return tree.filter(item => {
    if (item.id === id) {
      return false;
    }
    if (item.children.length > 0) {
      item.children = removeTreeItem(item.children, id);
    }
    return true;
  });
};

// Move item to new parent
export const moveTreeItem = (
  tree: TreeItem[], 
  itemId: number, 
  newParentId: number | null
): TreeItem[] => {
  // Find the item to move
  const itemToMove = findTreeItem(tree, itemId);
  if (!itemToMove) {
    return tree;
  }

  // Remove from current location
  let updatedTree = removeTreeItem(tree, itemId);
  
  // Update item's parent_id
  itemToMove.parent_id = newParentId;

  // Add to new location
  if (newParentId === null) {
    // Moving to root
    updatedTree.push(itemToMove);
  } else {
    // Moving to a parent
    updatedTree = updateTreeItem(updatedTree, newParentId, {
      children: [...(findTreeItem(updatedTree, newParentId)?.children || []), itemToMove]
    });
  }

  return updatedTree;
};

// Get all parent IDs for a given item (for breadcrumb navigation)
export const getParentIds = (tree: TreeItem[], itemId: number): number[] => {
  const findParentIds = (items: TreeItem[], targetId: number, currentPath: number[]): number[] | null => {
    for (const item of items) {
      const newPath = [...currentPath, item.id];
      
      if (item.id === targetId) {
        return currentPath; // Return path without the target item itself
      }
      
      if (item.children.length > 0) {
        const result = findParentIds(item.children, targetId, newPath);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  return findParentIds(tree, itemId, []) || [];
};

// Flatten tree to array (useful for drag and drop operations)
export const flattenTree = (tree: TreeItem[]): TreeItem[] => {
  const result: TreeItem[] = [];
  
  const traverse = (items: TreeItem[]) => {
    items.forEach(item => {
      result.push(item);
      if (item.children.length > 0) {
        traverse(item.children);
      }
    });
  };
  
  traverse(tree);
  return result;
};

