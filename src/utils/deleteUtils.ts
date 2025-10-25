import { TreeItem } from '../types';
import { apiClient } from '../services/api';

/**
 * Check if a tree item has children (cards or folders)
 */
export const hasChildren = (item: TreeItem): boolean => {
  return item.children && item.children.length > 0;
};

/**
 * Get the count of children for a tree item
 */
export const getChildrenCount = (item: TreeItem): number => {
  return item.children ? item.children.length : 0;
};

/**
 * Recursively delete all children of a tree item
 */
const deleteChildrenRecursively = async (children: TreeItem[]): Promise<void> => {
  for (const child of children) {
    console.log(`Deleting child:`, child.id, child.name, child.is_folder ? 'folder' : 'card');
    // If child has children, delete them first
    if (hasChildren(child)) {
      await deleteChildrenRecursively(child.children || []);
    }
    // Delete the child itself
    try {
      await apiClient.deleteCard(child.id);
      console.log(`Successfully deleted child:`, child.id, child.name);
      // Small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.warn(`Child ${child.id} (${child.name}) not found, continuing...`);
      } else {
        throw error; // Re-throw if it's not a 404 error
      }
    }
  }
};

/**
 * Handle conditional delete for a tree item
 * Shows appropriate confirmation message based on whether the item has children
 */
export const handleConditionalDelete = async (
  item: TreeItem,
  onSuccess: () => void,
  onError?: (error: any) => void
): Promise<void> => {
  const hasChildItems = hasChildren(item);
  const childrenCount = getChildrenCount(item);
  
  let confirmMessage: string;
  
  if (hasChildItems) {
    const folderCount = item.children?.filter(child => child.is_folder).length || 0;
    const cardCount = item.children?.filter(child => !child.is_folder).length || 0;
    
    let itemDescription = '';
    if (folderCount > 0 && cardCount > 0) {
      itemDescription = `${folderCount} folder${folderCount === 1 ? '' : 's'} and ${cardCount} card${cardCount === 1 ? '' : 's'}`;
    } else if (folderCount > 0) {
      itemDescription = `${folderCount} folder${folderCount === 1 ? '' : 's'}`;
    } else {
      itemDescription = `${cardCount} card${cardCount === 1 ? '' : 's'}`;
    }
    
    confirmMessage = `This ${item.is_folder ? 'folder' : 'category'} contains ${itemDescription}. Deleting it will also delete all items inside. Do you want to continue?`;
  } else {
    confirmMessage = `Are you sure you want to delete this ${item.is_folder ? 'folder' : 'card'}?`;
  }

  const confirmed = window.confirm(confirmMessage);
  
  if (!confirmed) {
    return;
  }

  try {
    // Check if this is a category (has no parent_id and is_folder is true)
    const isCategory = item.parent_id === null && item.is_folder;
    
    if (isCategory) {
      // For categories, use the bulk delete endpoint
      console.log(`Deleting category with bulk delete:`, item.id, item.name);
      await apiClient.bulkDeleteCategory(item.id);
    } else if (hasChildItems) {
      console.log(`Deleting ${item.is_folder ? 'folder' : 'category'} with children recursively:`, item.id, item.name);
      // Delete all children first (recursively)
      await deleteChildrenRecursively(item.children || []);
      // Then delete the parent
      console.log(`Deleting parent ${item.is_folder ? 'folder' : 'category'}:`, item.id, item.name);
      await apiClient.deleteCard(item.id);
    } else {
      console.log(`Deleting ${item.is_folder ? 'folder' : 'card'} without children using standard delete:`, item.id, item.name);
      await apiClient.deleteCard(item.id);
    }
    onSuccess();
  } catch (error: any) {
    console.error('Error deleting item:', error);
    
    // Handle specific error cases
    if (error?.response?.status === 404) {
      // Item not found - might have been deleted already
      console.warn(`Item ${item.id} not found, might have been deleted already`);
      // Still call onSuccess to update the UI since the item is effectively gone
      onSuccess();
      return;
    }
    
    if (onError) {
      onError(error);
    } else {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred';
      const statusCode = error?.response?.status;
      
      if (statusCode === 404) {
        alert(`The ${item.is_folder ? 'folder' : 'card'} was not found. It may have been deleted already.`);
      } else {
        alert(`Failed to delete ${item.is_folder ? 'folder' : 'card'}: ${errorMessage}`);
      }
    }
  }
};
