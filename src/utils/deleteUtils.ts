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
 * Handle conditional delete for a tree item
 * Shows appropriate confirmation message based on whether the item has children
 */
export const handleConditionalDelete = async (
  item: TreeItem,
  onSuccess: () => void,
  onError?: (error: any) => void
): Promise<void> => {
  const deleteId = Math.random().toString(36).substr(2, 9);
  console.log(`[${deleteId}] Starting delete process for item ${item.id} (${item.name})`);
  
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
    console.log('Delete item details:', {
      id: item.id,
      name: item.name,
      is_folder: item.is_folder,
      parent_id: item.parent_id,
      hasChildren: hasChildItems,
      isCategory: item.isCategory
    });
    
    if (item.isCategory) {
      // This is a category - use category bulk delete endpoint
      console.log(`[${deleteId}] Deleting category with bulk delete:`, item.id, item.name);
      await apiClient.bulkDeleteCategory(item.id);
    } else if (hasChildItems) {
      // This is a folder with children - use card bulk delete endpoint
      console.log(`[${deleteId}] Deleting folder with children using card bulk delete:`, item.id, item.name);
      await apiClient.deleteCardBulk(item.id);
    } else {
      // This is a card or folder without children - use standard delete endpoint
      console.log(`[${deleteId}] Deleting ${item.is_folder ? 'folder' : 'card'} without children using standard delete:`, item.id, item.name);
      await apiClient.deleteCard(item.id);
    }
    console.log(`[${deleteId}] Delete successful for item ${item.id}, calling onSuccess`);
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
    
    // Handle the specific "already deleted" error from backend
    const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error occurred';
    if (errorMessage.includes('has been deleted') || errorMessage.includes('not present')) {
      console.warn(`Item ${item.id} appears to have been deleted already:`, errorMessage);
      // Still call onSuccess to update the UI since the item is effectively gone
      onSuccess();
      return;
    }
    
    if (onError) {
      onError(error);
    } else {
      const statusCode = error?.response?.status;
      
      if (statusCode === 404) {
        alert(`The ${item.is_folder ? 'folder' : 'card'} was not found. It may have been deleted already.`);
      } else {
        alert(`Failed to delete ${item.is_folder ? 'folder' : 'card'}: ${errorMessage}`);
      }
    }
  }
};
