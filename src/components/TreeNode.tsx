import React, { useState, useRef, useEffect } from 'react';
import { TreeNodeProps, TreeItem, CategoryItem } from '../types';
import { AddItemInput } from './AddItemInput';
import { CardDetail } from './CardDetail';
import { UpdateCardAI } from './UpdateCardAI';
import { AICardForm } from './AICardForm';
import { PracticeCard } from './PracticeCard';
import { FolderView } from './FolderView';
import { MoveToModal } from './MoveToModal';
import { DropdownMenu, DropdownMenuItem, createEditAction, createDeleteAction, createAICardAction, createPracticeCardAction, createPracticeFolderAction } from './DropdownMenu';
import { FolderPracticeSession } from './FolderPracticeSession';
import { handleConditionalDelete } from '../utils/deleteUtils';
import { apiClient } from '../services/api';
import { Card } from '../types/api';
import { useInstance } from '../hooks/useInstance';
import { useAuth } from '../hooks/useAuth';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileText, 
  Plus,
  GripVertical,
  Hash,
  Sparkles,
  Move
} from 'lucide-react';

export const TreeNode: React.FC<TreeNodeProps> = ({
  item,
  onToggle,
  onRename,
  onDelete,
  onAddChild,
  onMove,
  level,
  categoryId,
  categories = [],
}) => {
  const { selectedInstanceId } = useInstance();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [showAddInput, setShowAddInput] = useState(false);
  const [addType, setAddType] = useState<'folder' | 'card'>('card');
  const [showDetail, setShowDetail] = useState(false);
  const [showUpdateAI, setShowUpdateAI] = useState(false);
  const [showAICardForm, setShowAICardForm] = useState(false);
  const [showPracticeCard, setShowPracticeCard] = useState(false);
  const [newCardId, setNewCardId] = useState<number | null>(null);
  const [showFolderView, setShowFolderView] = useState(false);
  const [showMoveToModal, setShowMoveToModal] = useState(false);
  const [showPracticeSession, setShowPracticeSession] = useState(false);
  const [isInstanceOwner, setIsInstanceOwner] = useState(false);
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isDragTarget, setIsDragTarget] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const draggedItemRef = useRef<TreeItem | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Check if user is instance owner
  useEffect(() => {
    const checkInstanceOwnership = async () => {
      if (!selectedInstanceId || !user) {
        setIsInstanceOwner(false);
        return;
      }

      try {
        const instanceData = await apiClient.getInstance(selectedInstanceId);
        // Check if user is owner via user_role or created_by
        const isOwner = instanceData.user_role === 'owner' || instanceData.instance.created_by === user.id;
        setIsInstanceOwner(isOwner);
      } catch (error) {
        console.error('Error checking instance ownership:', error);
        setIsInstanceOwner(false);
      }
    };

    checkInstanceOwnership();
  }, [selectedInstanceId, user]);

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== item.name) {
      onRename(item.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(item.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleAddChild = (name: string) => {
    onAddChild(item.id, addType, name);
    setShowAddInput(false);
  };

  const handleAddFolder = () => {
    setAddType('folder');
    setShowAddInput(true);
  };

  const handleAddCard = () => {
    setAddType('card');
    setShowAddInput(true);
  };

  const handleCardClick = () => {
    if (!isEditing) {
      setShowDetail(true);
    }
  };

  const handleFolderClick = () => {
    if (!isEditing && item.is_folder) {
      setShowFolderView(true);
    }
  };

  const handleDetailClose = () => {
    setShowDetail(false);
  };

  const handleDetailSave = () => {
    // Refresh the parent tree to show updated data
    window.location.reload();
  };

  const handleAICardSuccess = (cardId: number) => {
    setShowAICardForm(false);
    // Open the card detail view immediately to show the created card data
    setNewCardId(cardId);
  };

  const handleNewCardDetailClose = () => {
    setNewCardId(null);
    // Refresh the tree after closing to show the new card in the tree
    window.location.reload();
  };

  const handleNewCardDetailSave = () => {
    // Refresh the parent tree to show updated data
    window.location.reload();
  };

  // Check if target folder is a subfolder (has a parent_id)
  const isTargetSubfolder = (targetItem: TreeItem): boolean => {
    return targetItem.parent_id !== null && targetItem.parent_id !== undefined;
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    const dragData = {
      id: item.id,
      type: item.type,
      parent_id: item.parent_id,
      category_id: item.category_id,
      is_folder: item.is_folder,
      name: item.name,
    };
    // Set data in multiple formats for better browser compatibility
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', item.id.toString()); // Fallback
    draggedItemRef.current = item;
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setDragOver(false);
    // Don't clear draggedItemRef here - it's needed in handleDrop
    // It will be cleared after the drop is processed
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only folders can be drop targets
    if (!item.is_folder) {
      e.dataTransfer.dropEffect = 'none';
      setDragOver(false);
      setIsDragTarget(false);
      return;
    }
    
    // Check if we have a dragged item
    if (!draggedItemRef.current) {
      // Try to get it from dataTransfer as fallback
      try {
        const dragDataStr = e.dataTransfer.getData('application/json');
        if (dragDataStr) {
          const dragData = JSON.parse(dragDataStr);
          // We can't fully validate without the full item, but allow the drop
          e.dataTransfer.dropEffect = 'move';
          setDragOver(true);
          setIsDragTarget(true);
          return;
        }
      } catch (err) {
        // Ignore parse errors
      }
      e.dataTransfer.dropEffect = 'none';
      setDragOver(false);
      setIsDragTarget(false);
      return;
    }
    
    // Validate if dragged item can be moved to this folder
    if (canMoveToTarget(draggedItemRef.current, item)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
      setIsDragTarget(true);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDragOver(false);
      setIsDragTarget(false);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setIsDragTarget(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('DROP EVENT FIRED on:', item.name, 'is_folder:', item.is_folder);
    setDragOver(false);
    setIsDragTarget(false);
    
    try {
      // Get drag data from dataTransfer (this works in drop event)
      let dragData: any = null;
      let draggedItemId: number | null = null;
      
      try {
        const dragDataStr = e.dataTransfer.getData('application/json');
        console.log('Drag data string:', dragDataStr);
        if (dragDataStr) {
          dragData = JSON.parse(dragDataStr);
          draggedItemId = dragData.id;
          console.log('Parsed drag data:', dragData);
        }
      } catch (parseErr) {
        console.warn('Could not parse JSON drag data, trying text/plain:', parseErr);
        // Fallback to text/plain
        const textData = e.dataTransfer.getData('text/plain');
        console.log('Text/plain data:', textData);
        if (textData) {
          draggedItemId = parseInt(textData, 10);
        }
      }
      
      // Try to get item from ref first (works if dragging within same component)
      let draggedItem = draggedItemRef.current;
      console.log('Dragged item from ref:', draggedItem);
      
      // If ref is null, try to construct minimal item from drag data
      if (!draggedItem && dragData) {
        draggedItem = {
          id: dragData.id,
          name: dragData.name || 'Unknown',
          type: dragData.type || 'card',
          parent_id: dragData.parent_id,
          is_folder: dragData.is_folder || false,
          children: [],
          category_id: dragData.category_id,
        } as TreeItem;
        console.log('Constructed dragged item from drag data:', draggedItem);
      }
      
      // If we still don't have an item ID, we can't proceed
      if (!draggedItemId) {
        console.error('Could not determine dragged item ID. Drag data:', dragData);
        alert('Failed to move: Could not identify dragged item');
        return;
      }
      
      // Ensure we're dropping on a folder
      if (!item.is_folder) {
        console.log('Drop target is not a folder, ignoring drop');
        return;
      }
      
      // Can't move item to itself
      if (draggedItemId === item.id) {
        console.log('Cannot move item to itself');
        return;
      }
      
      // Validate move if we have the full item
      if (draggedItem && !canMoveToTarget(draggedItem, item)) {
        alert('Cannot move here. Subfolders cannot contain other folders.');
        return;
      }

      console.log('Moving item:', {
        itemId: draggedItemId,
        itemName: draggedItem?.name || 'Unknown',
        targetFolderId: item.id,
        targetFolderName: item.name
      });

      // Move to this folder - use the ID we got from drag data
      await onMove(draggedItemId, { parent_id: item.id });
      
      // Clear the ref after successful move
      draggedItemRef.current = null;
    } catch (err: any) {
      console.error('Error handling drop:', err);
      draggedItemRef.current = null;
      alert(err.response?.data?.detail || err.message || 'Failed to move item');
    }
  };

  // Check if dragged item can be moved to target
  const canMoveToTarget = (draggedItem: TreeItem, targetItem: TreeItem): boolean => {
    // Can't move to itself
    if (draggedItem.id === targetItem.id) return false;
    
    // Can't move to its own children (prevent circular reference)
    const isDescendant = (parent: TreeItem, childId: number): boolean => {
      if (parent.id === childId) return true;
      return parent.children.some((child) => isDescendant(child, childId));
    };
    if (isDescendant(draggedItem, targetItem.id)) return false;
    
    // Folders can't be moved into subfolders
    if (draggedItem.is_folder && targetItem.is_folder && isTargetSubfolder(targetItem)) {
      return false;
    }
    
    return true;
  };

  // Mobile long-press handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing || !isMobile) return;
    
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true);
      // Trigger drag on mobile
      const touch = e.touches[0];
      const dragEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
      });
      // Note: Touch drag is limited, so we'll use Move To modal instead
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsDragging(false);
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Create dropdown menu items
  const getDropdownItems = (): DropdownMenuItem[] => {
    const items: DropdownMenuItem[] = [];

    // For cards (is_folder = false)
    if (!item.is_folder) {
      items.push(
        createPracticeCardAction(() => setShowPracticeCard(true))
      );
      
      // Only show Update Card using AI and Move To if user is instance owner
      if (isInstanceOwner) {
        items.push(
          {
            id: 'update-ai',
            label: 'Update Card using AI',
            icon: <Sparkles className="h-4 w-4" />,
            onClick: () => setShowUpdateAI(true),
          },
          {
            id: 'move',
            label: 'Move To...',
            icon: <Move className="h-4 w-4" />,
            onClick: () => {
              console.log('Move action clicked for item:', item.name, 'parent_id:', item.parent_id, 'categories:', categories.length);
              setShowMoveToModal(true);
            },
          },
          createEditAction(() => setIsEditing(true)),
          createDeleteAction(() => handleConditionalDelete(item, () => onDelete(item.id)))
        );
      }
    }

    // For folders (is_folder = true)
    if (item.is_folder) {
      items.push(
        createPracticeFolderAction(() => setShowPracticeSession(true))
      );
      
      // Only show Update Card using AI and Move To if user is instance owner
      if (isInstanceOwner) {
        items.push(
          {
            id: 'update-ai',
            label: 'Update Card using AI',
            icon: <Sparkles className="h-4 w-4" />,
            onClick: () => setShowUpdateAI(true),
          },
          {
            id: 'move',
            label: 'Move To...',
            icon: <Move className="h-4 w-4" />,
            onClick: () => {
              console.log('Move action clicked for item:', item.name, 'parent_id:', item.parent_id, 'categories:', categories.length);
              setShowMoveToModal(true);
            },
          },
          createEditAction(() => setIsEditing(true)),
          createDeleteAction(() => handleConditionalDelete(item, () => onDelete(item.id)))
        );
      }
    }

    return items;
  };

  // Handle AI update success
  const handleAIUpdateSuccess = async (updatedCard: Card) => {
    setShowUpdateAI(false);
    // Open the card detail view with updated data
    // The CardDetail component will automatically reload the card data
    setShowDetail(true);
  };

  // Calculate indentation based on level
  const indentPx = level * 24; // Increased from 20px for better visual separation
  
  // Get item count for folders
  const itemCount = item.children ? item.children.length : 0;
  const hasChildren = item.children && item.children.length > 0;
  
  // Different styling based on level and type
  const isTopLevelFolder = level === 0 && item.is_folder;
  const isSubfolder = level === 1 && item.is_folder;
  const isCard = !item.is_folder;

  return (
    <div className="relative">
      {/* Main item container */}
      <div 
        ref={nodeRef}
        draggable={!isEditing && !isMobile}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        className={`group transition-all duration-200 ${
          isTopLevelFolder 
            ? 'py-3 px-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg mb-2 hover:bg-blue-100' 
            : isSubfolder
            ? 'py-2 px-3 ml-6 bg-gray-50 border-l-2 border-gray-300 rounded-md mb-1 hover:bg-gray-100'
            : isCard
            ? 'py-1.5 px-3 ml-8 hover:bg-gray-50 rounded-md border-l border-gray-200'
            : 'py-2 px-3 hover:bg-gray-50 rounded-md'
        } ${
          isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-move'
        } ${
          dragOver && item.is_folder ? 'bg-green-100 border-green-400 border-2 ring-2 ring-green-300' : ''
        }`}
        style={{ marginLeft: `${indentPx}px` }}
      >
        {/* Desktop layout - single row */}
        <div 
          className="hidden lg:flex items-center flex-1 min-w-0"
          onDragOver={(e) => {
            // Allow drop on nested elements
            if (item.is_folder) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onDrop={(e) => {
            // Forward drop to parent handler
            if (item.is_folder) {
              handleDrop(e);
            }
          }}
        >
          {/* Drag handle - always visible for draggable items */}
          <div 
            className={`mr-2 transition-opacity ${
              isMobile ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'
            } cursor-grab active:cursor-grabbing`}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              e.stopPropagation();
              if (isMobile) {
                handleTouchStart(e as any);
              }
            }}
          >
            <GripVertical className="h-3 w-3 text-gray-400" />
          </div>

          {/* Expand/collapse button - only for items with children */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(item.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`mr-2 p-1 hover:bg-gray-200 rounded transition-colors ${
                isTopLevelFolder ? 'hover:bg-blue-200' : ''
              }`}
            >
              {item.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}

          {/* Spacer for items without expand button */}
          {!hasChildren && <div className="w-6 mr-2" />}

          {/* Icon with different styling based on type and level */}
          <div className="mr-3 flex-shrink-0">
            {item.is_folder ? (
              <Folder className={`${isTopLevelFolder ? 'h-5 w-5 text-blue-600' : 'h-4 w-4 text-blue-500'}`} />
            ) : (
              <FileText className="h-3.5 w-3.5 text-gray-500" />
            )}
          </div>

          {/* Name with appropriate styling */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className={`w-full border-0 outline-none bg-transparent ${
                  isTopLevelFolder ? 'text-lg font-semibold' : 'text-sm'
                }`}
                autoFocus
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCard) handleCardClick();
                  else handleFolderClick();
                }}
                onMouseDown={(e) => {
                  // Don't prevent drag if clicking on the button
                  // Only stop propagation to prevent parent handlers
                  e.stopPropagation();
                }}
                className={`truncate text-left w-full transition-colors ${
                  isTopLevelFolder 
                    ? 'text-lg font-semibold text-gray-900 hover:text-blue-700' 
                    : isSubfolder
                    ? 'text-sm font-medium text-gray-800 hover:text-blue-600'
                    : 'text-sm text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.name}
              </button>
            )}
          </div>

          {/* Item count for folders - Desktop */}
          {item.is_folder && itemCount > 0 && (
            <div className="mr-2 flex items-center">
              <Hash className="h-3 w-3 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500">{itemCount}</span>
            </div>
          )}

          {/* Add buttons - only for folders */}
          {item.is_folder && (
            <div className="flex items-center space-x-1">
              {item.parent_id === null && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddFolder();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-blue-100 rounded bg-blue-50"
                  title="Add subfolder"
                >
                  <Folder className="h-3 w-3 text-blue-600" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddCard();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="p-1 hover:bg-gray-200 rounded bg-gray-100"
                title="Add card"
              >
                <Plus className="h-3 w-3 text-gray-700" />
              </button>
            </div>
          )}

          {/* Actions dropdown menu */}
          <div className="ml-2">
            <DropdownMenu
              items={getDropdownItems()}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>

        {/* Mobile layout - responsive stacked design */}
        <div 
          className="lg:hidden"
          onDragOver={(e) => {
            // Allow drop on nested elements
            if (item.is_folder) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onDrop={(e) => {
            // Forward drop to parent handler
            if (item.is_folder) {
              handleDrop(e);
            }
          }}
        >
          {/* Top row: Icon, name, and expand button */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center flex-1 min-w-0">
              {/* Drag handle - always visible for draggable items */}
              <div 
                className={`mr-2 transition-opacity ${
                  isMobile ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'
                } cursor-grab active:cursor-grabbing`}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  if (isMobile) {
                    handleTouchStart(e as any);
                  }
                }}
              >
                <GripVertical className="h-3 w-3 text-gray-400" />
              </div>

              {/* Expand/collapse button - only for items with children */}
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(item.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`mr-2 p-1.5 hover:bg-gray-200 rounded transition-colors ${
                    isTopLevelFolder ? 'hover:bg-blue-200' : ''
                  }`}
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  {item.isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              )}

              {/* Spacer for items without expand button */}
              {!hasChildren && <div className="w-6 mr-2" />}

              {/* Icon with different styling based on type and level */}
              <div className="mr-3 flex-shrink-0">
                {item.is_folder ? (
                  <Folder className={`${isTopLevelFolder ? 'h-5 w-5 text-blue-600' : 'h-4 w-4 text-blue-500'}`} />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-gray-500" />
                )}
              </div>

              {/* Name with appropriate styling */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={handleKeyDown}
                    className={`w-full border-0 outline-none bg-transparent ${
                      isTopLevelFolder ? 'text-lg font-semibold' : 'text-sm'
                    }`}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCard) handleCardClick();
                      else handleFolderClick();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`truncate text-left w-full transition-colors ${
                      isTopLevelFolder 
                        ? 'text-lg font-semibold text-gray-900 hover:text-blue-700' 
                        : isSubfolder
                        ? 'text-sm font-medium text-gray-800 hover:text-blue-600'
                        : 'text-sm text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </button>
                )}
              </div>
            </div>

            {/* Actions dropdown menu - always visible on mobile */}
            <div className="ml-2 flex-shrink-0">
              <DropdownMenu
                items={getDropdownItems()}
                className="opacity-100"
              />
            </div>
          </div>

          {/* Bottom row: Item count and add buttons */}
          <div className="flex items-center justify-between">
            {/* Stats section - Mobile */}
            {item.is_folder && itemCount > 0 && (
              <div className="stats flex items-center space-x-4">
                {/* Count individual items by type */}
                {(() => {
                  const folderCount = item.children?.filter(child => child.is_folder).length || 0;
                  const cardCount = item.children?.filter(child => !child.is_folder).length || 0;
                  
                  return (
                    <>
                      {folderCount > 0 && (
                        <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                          <Folder className="h-3 w-3 text-blue-600 mr-1" />
                          <span className="text-xs font-medium text-blue-700">{folderCount}</span>
                        </div>
                      )}
                      {cardCount > 0 && (
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                          <FileText className="h-3 w-3 text-gray-600 mr-1" />
                          <span className="text-xs font-medium text-gray-700">{cardCount}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Add buttons - only for folders */}
            {item.is_folder && (
              <div className="flex items-center space-x-2">
                {item.parent_id === null && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFolder();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    title="Add subfolder"
                    style={{ minHeight: '44px' }}
                  >
                    <Folder className="h-3 w-3 inline mr-1" />
                    Add Folder
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddCard();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title="Add card"
                  style={{ minHeight: '44px' }}
                >
                  <Plus className="h-3 w-3 inline mr-1" />
                  Add Card
                </button>
              </div>
            )}

            {/* Spacer if no add buttons */}
            {!item.is_folder && <div />}
          </div>
        </div>
      </div>

      {/* Add item input */}
      {showAddInput && (
        <div 
          className="mt-2"
          style={{ marginLeft: `${indentPx + 24}px` }}
        >
          <AddItemInput
            parentId={item.id}
            type={addType}
            onSubmit={handleAddChild}
            onCancel={() => setShowAddInput(false)}
            placeholder={`Add ${addType}...`}
          />
        </div>
      )}

      {/* Children */}
      {item.isExpanded && item.children && item.children.length > 0 && (
        <div className="mt-1">
          {item.children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onMove={onMove}
              level={level + 1}
              categoryId={categoryId}
              categories={categories}
            />
          ))}
        </div>
      )}

      {/* Card Detail Modal */}
      {showDetail && (
        <CardDetail
          cardId={item.id}
          onClose={handleDetailClose}
          onSave={handleDetailSave}
        />
      )}

      {/* Update Card AI Modal */}
      {showUpdateAI && (
        <UpdateCardAIWrapper
          item={item}
          onClose={() => setShowUpdateAI(false)}
          onSuccess={handleAIUpdateSuccess}
        />
      )}

      {/* AI Card Form Modal */}
      {showAICardForm && item.is_folder && (
        <AICardForm
          parentId={item.id}
          parentName={item.name}
          onClose={() => setShowAICardForm(false)}
          onSuccess={handleAICardSuccess}
        />
      )}

      {/* Card Detail Modal for newly created AI card */}
      {newCardId !== null && (
        <CardDetail
          cardId={newCardId}
          onClose={handleNewCardDetailClose}
          onSave={handleNewCardDetailSave}
        />
      )}

      {/* Practice Card Modal */}
      {showPracticeCard && !item.is_folder && (
        <PracticeCard
          cardId={item.id}
          onClose={() => setShowPracticeCard(false)}
        />
      )}

      {/* Folder View Modal */}
      {showFolderView && item.is_folder && (
        <FolderView
          folder={item}
          onClose={() => setShowFolderView(false)}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
          categories={categories}
        />
      )}

      {/* Move To Modal */}
      {showMoveToModal && categories.length > 0 && (
        <MoveToModal
          item={item}
          categories={categories}
          onClose={() => setShowMoveToModal(false)}
          onMove={onMove}
        />
      )}

      {/* Folder Practice Session */}
      {showPracticeSession && item.is_folder && (
        <FolderPracticeSession
          folderId={item.id}
          folderName={item.name}
          categoryId={item.category_id}
          categoryName={categories.find(cat => cat.id === item.category_id)?.name}
          onClose={() => setShowPracticeSession(false)}
        />
      )}
    </div>
  );
};

// Wrapper component to handle async card conversion
const UpdateCardAIWrapper: React.FC<{
  item: TreeNodeProps['item'];
  onClose: () => void;
  onSuccess: (card: Card) => void;
}> = ({ item, onClose, onSuccess }) => {
  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const loadCard = async () => {
      try {
        const cardData = await apiClient.getCard(item.id);
        setCard(cardData);
      } catch (error) {
        // If fetch fails, create a minimal card object from the item
        const minimalCard: Card = {
          id: item.id,
          name: item.name,
          parent_id: item.parent_id ?? null,
          is_folder: item.is_folder,
          category_id: item.category_id ?? null,
          example_phrases: item.example_phrases ?? null,
          meanings: item.meanings ?? null,
          grammar_roles: item.grammar_roles ?? null,
          collocations: item.collocations ?? null,
          synonyms: item.synonyms ?? null,
          antonyms: item.antonyms ?? null,
          related_words: null,
          word_forms: null,
          videos: null,
          use_count: item.use_count ?? 0,
          notes: item.notes ?? null,
          created_at: item.created_at ?? new Date().toISOString(),
          user_created: 0,
          children: null,
        };
        setCard(minimalCard);
      } finally {
        setIsLoading(false);
      }
    };

    loadCard();
  }, [item]);

  if (isLoading || !card) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="text-gray-600">Loading card...</div>
          </div>
        </div>
      </div>
    );
  }

  return <UpdateCardAI card={card} onClose={onClose} onSuccess={onSuccess} />;
};