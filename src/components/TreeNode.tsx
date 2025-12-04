import React, { useState, useRef, useEffect } from 'react';
import { TreeNodeProps, TreeItem, CategoryItem } from '../types';
import { AddItemInput } from './AddItemInput';
import { CardDetail } from './CardDetail';
import { UpdateCardAI } from './UpdateCardAI';
import { AICardForm } from './AICardForm';
import { PracticeCard } from './PracticeCard';
import { FolderView } from './FolderView';
import { MoveToModal } from './MoveToModal';
import { DropdownMenu, DropdownMenuItem, createEditAction, createDeleteAction, createAICardAction, createPracticeCardAction } from './DropdownMenu';
import { handleConditionalDelete } from '../utils/deleteUtils';
import { apiClient } from '../services/api';
import { Card } from '../types/api';
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
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isDragTarget, setIsDragTarget] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const draggedItemRef = useRef<TreeItem | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    draggedItemRef.current = item;
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setDragOver(false);
    draggedItemRef.current = null;
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if this is a valid drop target
    if (item.is_folder && draggedItemRef.current) {
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
    } else if (!item.is_folder) {
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
    setDragOver(false);
    setIsDragTarget(false);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Use the stored item from ref if available, otherwise construct minimal item
      if (!draggedItemRef.current) {
        console.error('Dragged item ref is null');
        return;
      }
      
      const draggedItem: TreeItem = draggedItemRef.current;
      
      if (draggedItem.id === item.id || !item.is_folder) return;
      
      // Validate move
      if (!canMoveToTarget(draggedItem, item)) {
        alert('Cannot move here. Subfolders cannot contain other folders.');
        return;
      }

      // Move to this folder
      await onMove(draggedItem.id, { parent_id: item.id });
    } catch (err: any) {
      console.error('Error handling drop:', err);
      alert(err.response?.data?.detail || 'Failed to move item');
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
    const items: DropdownMenuItem[] = [
      createEditAction(() => setIsEditing(true)),
      {
        id: 'move',
        label: 'Move To...',
        icon: <Move className="h-4 w-4" />,
        onClick: () => setShowMoveToModal(true),
      },
      createDeleteAction(() => handleConditionalDelete(item, () => onDelete(item.id))),
    ];

    // Add "Update Card using AI" and "Practice card" actions only for cards (not folders)
    if (!item.is_folder) {
      items.push({
        id: 'update-ai',
        label: 'Update Card using AI',
        icon: <Sparkles className="h-4 w-4" />,
        onClick: () => setShowUpdateAI(true),
      });
      items.push(createPracticeCardAction(() => setShowPracticeCard(true)));
    }

    // Add "Add a card using AI" action for folders
    if (item.is_folder) {
      items.push(createAICardAction(() => setShowAICardForm(true)));
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
        <div className="hidden lg:flex items-center flex-1 min-w-0">
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
              onClick={() => onToggle(item.id)}
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
                onClick={isCard ? handleCardClick : handleFolderClick}
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
                  onClick={handleAddFolder}
                  className="p-1 hover:bg-blue-100 rounded bg-blue-50"
                  title="Add subfolder"
                >
                  <Folder className="h-3 w-3 text-blue-600" />
                </button>
              )}
              <button
                onClick={handleAddCard}
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
        <div className="lg:hidden">
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
                  onClick={() => onToggle(item.id)}
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
                    onClick={isCard ? handleCardClick : handleFolderClick}
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
                    onClick={handleAddFolder}
                    className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    title="Add subfolder"
                    style={{ minHeight: '44px' }}
                  >
                    <Folder className="h-3 w-3 inline mr-1" />
                    Add Folder
                  </button>
                )}
                <button
                  onClick={handleAddCard}
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