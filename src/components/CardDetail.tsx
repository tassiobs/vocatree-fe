import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, AlertTriangle, Edit2, Sparkles, BookOpen, Move, MoreVertical } from 'lucide-react';
import { apiClient } from '../services/api';
import { Card, CardUpdate } from '../types/api';
import { DropdownMenu, DropdownMenuItem, createEditAction, createDeleteAction, createPracticeCardAction } from './DropdownMenu';
import { PracticeCard } from './PracticeCard';
import { UpdateCardAI } from './UpdateCardAI';
import { MoveToModal } from './MoveToModal';
import { handleConditionalDelete } from '../utils/deleteUtils';
import { TreeItem } from '../types';

interface CardDetailProps {
  cardId: number;
  onClose: () => void;
  onSave: () => void;
  isEditMode?: boolean;
  isInstanceOwner?: boolean;
  onDelete?: (id: number) => void;
  onMove?: (itemId: number, data: { parent_id?: number | null; category_id?: number | null }) => Promise<void>;
  categories?: Array<{ id: number; name: string }>;
  onEdit?: () => void;
}

export const CardDetail: React.FC<CardDetailProps> = ({ 
  cardId, 
  onClose, 
  onSave, 
  isEditMode: initialEditMode = false,
  isInstanceOwner = false,
  onDelete,
  onMove,
  categories = [],
  onEdit
}) => {
  const [card, setCard] = useState<Card | null>(null);
  const [parentFolder, setParentFolder] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);
  const [showPracticeCard, setShowPracticeCard] = useState(false);
  const [showUpdateAI, setShowUpdateAI] = useState(false);
  const [showMoveToModal, setShowMoveToModal] = useState(false);
  const [internalEditMode, setInternalEditMode] = useState(initialEditMode);
  const savedStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use internal edit mode if set, otherwise use prop
  const isEditMode = internalEditMode || initialEditMode;

  // Reset internal edit mode when cardId changes
  useEffect(() => {
    setInternalEditMode(initialEditMode);
  }, [cardId, initialEditMode]);

  // Form state
  const [name, setName] = useState('');
  const [examplePhrases, setExamplePhrases] = useState<string[]>([]);
  const [meanings, setMeanings] = useState<string[]>([]);
  const [grammarRoles, setGrammarRoles] = useState<string[]>([]);
  const [collocations, setCollocations] = useState<string[]>([]);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [antonyms, setAntonyms] = useState<string[]>([]);
  const [relatedWords, setRelatedWords] = useState<string[]>([]);
  const [wordForms, setWordForms] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [useCount, setUseCount] = useState(0);
  const [ipa, setIpa] = useState('');
  const [register, setRegister] = useState('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [etymology, setEtymology] = useState('');
  const [masteryLevel, setMasteryLevel] = useState<string>('');
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Input states for adding new list items
  const [newExamplePhrase, setNewExamplePhrase] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newGrammarRole, setNewGrammarRole] = useState('');
  const [newCollocation, setNewCollocation] = useState('');
  const [newSynonym, setNewSynonym] = useState('');
  const [newAntonym, setNewAntonym] = useState('');
  const [newRelatedWord, setNewRelatedWord] = useState('');
  const [newWordForm, setNewWordForm] = useState('');
  const [newVideo, setNewVideo] = useState('');

  useEffect(() => {
    loadCard();
  }, [cardId]);

  const loadCard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cardData = await apiClient.getCard(cardId);
      setCard(cardData);
      
      // Set form values
      setName(cardData.name);
      setExamplePhrases(cardData.example_phrases || []);
      setMeanings(cardData.meanings || []);
      setGrammarRoles(cardData.grammar_roles || []);
      setCollocations(cardData.collocations || []);
      setSynonyms(cardData.synonyms || []);
      setAntonyms(cardData.antonyms || []);
      setRelatedWords(cardData.related_words || []);
      setWordForms(cardData.word_forms || []);
      setVideos(cardData.videos || []);
      setUseCount(cardData.use_count || 0);
      setIpa(cardData.ipa || '');
      setRegister(cardData.register || '');
      setDifficulty(cardData.difficulty || '');
      setEtymology(cardData.etymology || '');
      setMasteryLevel(cardData.mastery_level || '');
      setLastReviewedAt(cardData.last_reviewed_at || null);
      setNotes(cardData.notes || '');

      // Load parent folder if exists
      if (cardData.parent_id) {
        const parentData = await apiClient.getCard(cardData.parent_id);
        setParentFolder(parentData);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load card');
      console.error('Error loading card:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = (): boolean => {
    if (!card) return false;

    // Compare arrays
    const arraysEqual = (a: string[] | null, b: string[] | null): boolean => {
      const arrA = a || [];
      const arrB = b || [];
      if (arrA.length !== arrB.length) return false;
      return arrA.every((val, idx) => val === arrB[idx]);
    };

    return (
      name !== card.name ||
      !arraysEqual(examplePhrases, card.example_phrases) ||
      !arraysEqual(meanings, card.meanings) ||
      !arraysEqual(grammarRoles, card.grammar_roles) ||
      !arraysEqual(collocations, card.collocations) ||
      !arraysEqual(synonyms, card.synonyms) ||
      !arraysEqual(antonyms, card.antonyms) ||
      !arraysEqual(relatedWords, card.related_words) ||
      !arraysEqual(wordForms, card.word_forms) ||
      !arraysEqual(videos, card.videos) ||
      (ipa || '') !== (card.ipa || '') ||
      (register || '') !== (card.register || '') ||
      (difficulty || '') !== (card.difficulty || '') ||
      (etymology || '') !== (card.etymology || '') ||
      (masteryLevel || '') !== (card.mastery_level || '') ||
      (notes || '') !== (card.notes || '') ||
      useCount !== card.use_count
    );
  };

  const handleClose = () => {
    if (isEditMode && hasUnsavedChanges()) {
      setShowCloseConfirm(true);
    } else {
      setInternalEditMode(false);
      onClose();
    }
  };

  const handleSave = async () => {
    if (!card) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData: CardUpdate = {
        name: name !== card.name ? name : undefined,
        example_phrases: examplePhrases.length > 0 ? examplePhrases : null,
        meanings: meanings.length > 0 ? meanings : null,
        grammar_roles: grammarRoles.length > 0 ? grammarRoles : null,
        collocations: collocations.length > 0 ? collocations : null,
        synonyms: synonyms.length > 0 ? synonyms : null,
        antonyms: antonyms.length > 0 ? antonyms : null,
        related_words: relatedWords.length > 0 ? relatedWords : null,
        word_forms: wordForms.length > 0 ? wordForms : null,
        videos: videos.length > 0 ? videos : null,
        ipa: ipa || null,
        register: register || null,
        difficulty: difficulty || null,
        etymology: etymology || null,
        mastery_level: masteryLevel || null,
        notes: notes || null,
        use_count: useCount !== card.use_count ? useCount : undefined,
      };

      // Remove undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof CardUpdate] === undefined) {
          delete updateData[key as keyof CardUpdate];
        }
      });

      if (Object.keys(updateData).length > 0) {
        await apiClient.updateCard(cardId, updateData);
        // Reload card to get updated data
        await loadCard();
      }

      // Show saved state
      setShowSavedState(true);
      if (savedStateTimeoutRef.current) {
        clearTimeout(savedStateTimeoutRef.current);
      }
      savedStateTimeoutRef.current = setTimeout(() => {
        setShowSavedState(false);
      }, 3000);

      // Switch back to read-only mode after saving
      setInternalEditMode(false);
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save card');
      console.error('Error saving card:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    // Small delay to show saved state before closing
    setTimeout(() => {
      setInternalEditMode(false);
      onClose();
    }, 500);
  };

  const handleDiscard = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const handleEdit = () => {
    // Switch to edit mode
    setInternalEditMode(true);
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = async () => {
    if (!card || !onDelete) return;
    
    const cardAsTreeItem: TreeItem = {
      id: card.id,
      name: card.name,
      type: 'card',
      parent_id: card.parent_id,
      is_folder: false,
      children: [],
      category_id: card.category_id ?? undefined,
    };

    await handleConditionalDelete(
      cardAsTreeItem,
      () => {
        onDelete(card.id);
        onClose();
      },
      (error) => {
        console.error('Error deleting card:', error);
        setError('Failed to delete card');
      }
    );
  };

  const handleMove = async (itemId: number, data: { parent_id?: number | null; category_id?: number | null }) => {
    if (!onMove) return;
    try {
      await onMove(itemId, data);
      setShowMoveToModal(false);
      onClose();
      onSave(); // Refresh the view
    } catch (error) {
      console.error('Error moving card:', error);
      setError('Failed to move card');
    }
  };

  // Get dropdown menu items for read-only view
  const getReadOnlyMenuItems = (): DropdownMenuItem[] => {
    const items: DropdownMenuItem[] = [];
    
    if (isInstanceOwner) {
      // Owner: Edit, Update AI, Practice Card, Divider, Move, Delete
      items.push(
        createEditAction(handleEdit),
        {
          id: 'update-ai',
          label: 'Update card using AI',
          icon: <Sparkles className="h-4 w-4" />,
          onClick: () => setShowUpdateAI(true),
        },
        createPracticeCardAction(() => setShowPracticeCard(true)),
        {
          id: 'divider',
          label: '',
          icon: <div />,
          onClick: () => {},
          disabled: true,
        },
        {
          id: 'move',
          label: 'Move To...',
          icon: <Move className="h-4 w-4" />,
          onClick: () => setShowMoveToModal(true),
        },
        createDeleteAction(handleDelete)
      );
    } else {
      // Viewer: Practice Card only
      items.push(
        createPracticeCardAction(() => setShowPracticeCard(true))
      );
    }
    
    return items;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (savedStateTimeoutRef.current) {
        clearTimeout(savedStateTimeoutRef.current);
      }
    };
  }, []);

  // Helper functions to add/remove items from lists
  const addToList = (list: string[], setList: (items: string[]) => void, value: string, setValue: (val: string) => void) => {
    if (value.trim()) {
      setList([...list, value.trim()]);
      setValue('');
    }
  };

  const removeFromList = (list: string[], setList: (items: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  // Render editable list field
  const renderEditableList = (
    label: string,
    items: string[],
    setItems: (items: string[]) => void,
    newValue: string,
    setNewValue: (val: string) => void,
    bgColor: string = 'bg-blue-50',
    borderColor: string = 'border-blue-500'
  ) => (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{label}</h2>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className={`${bgColor} border-l-4 ${borderColor} p-3 rounded-r-md flex items-center justify-between`}>
            <p className="text-gray-900 leading-relaxed flex-1">{item}</p>
            <button
              onClick={() => removeFromList(items, setItems, index)}
              className="ml-2 p-1 hover:bg-red-200 rounded transition-colors"
              title="Remove"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToList(items, setItems, newValue, setNewValue);
              }
            }}
            placeholder={`Add new ${label.toLowerCase()}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => addToList(items, setItems, newValue, setNewValue)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {items.length === 0 && newValue === '' && (
          <p className="text-sm text-gray-400 italic">No {label.toLowerCase()} added yet</p>
        )}
      </div>
    </div>
  );

  // Render view-only list field
  const renderViewList = (
    label: string,
    items: string[],
    bgColor: string = 'bg-blue-50',
    borderColor: string = 'border-blue-500'
  ) => (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{label}</h2>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className={`${bgColor} border-l-4 ${borderColor} p-4 rounded-r-md`}>
              <p className="text-gray-900 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No {label.toLowerCase()} added yet</p>
      )}
    </div>
  );

  // Render editable chip list
  const renderEditableChipList = (
    label: string,
    items: string[],
    setItems: (items: string[]) => void,
    newValue: string,
    setNewValue: (val: string) => void,
    chipColor: string = 'bg-green-100 text-green-800'
  ) => (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">{label}</h3>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, index) => (
          <span key={index} className={`px-3 py-1 ${chipColor} rounded-full text-sm flex items-center gap-1`}>
            {item}
            {isEditMode && (
              <button
                onClick={() => removeFromList(items, setItems, index)}
                className="ml-1 hover:text-red-600"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      {isEditMode && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToList(items, setItems, newValue, setNewValue);
              }
            }}
            placeholder={`Add ${label.toLowerCase()}...`}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => addToList(items, setItems, newValue, setNewValue)}
            className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
      {items.length === 0 && !isEditMode && (
        <p className="text-xs text-gray-400 italic">None</p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="text-gray-600">Loading card details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !card) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8 flex flex-col max-h-[90vh]">
          {/* Sticky Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between px-6 py-4">
            <div className="flex-1 min-w-0">
              {isEditMode ? (
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-bold text-gray-900 w-full border-0 border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-1 transition-colors"
                    placeholder="Card name"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    {parentFolder && (
                      <p className="text-sm text-gray-500">in {parentFolder.name}</p>
                    )}
                    {showSavedState && (
                      <span className="text-xs text-green-600 font-medium">All changes saved</span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
                  {parentFolder && (
                    <p className="text-sm text-gray-500 mt-1">in {parentFolder.name}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {isEditMode && (
                <>
                  <button
                    onClick={handleClose}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !hasUnsavedChanges()}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </>
                    )}
                  </button>
                </>
              )}
              {!isEditMode && card && !card.is_folder && (
                <>
                  {/* Three-dot menu - always visible for cards */}
                  <DropdownMenu
                    items={getReadOnlyMenuItems()}
                    className="opacity-100"
                  />
                  
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
                    title="Close"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </>
              )}
              {!isEditMode && (!card || card.is_folder) && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  title="Close"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Meanings */}
          {isEditMode ? (
            renderEditableList('Meanings', meanings, setMeanings, newMeaning, setNewMeaning, 'bg-blue-50', 'border-blue-500')
          ) : (
            renderViewList('Meanings', meanings, 'bg-blue-50', 'border-blue-500')
          )}

          {/* Example Phrases */}
          {isEditMode ? (
            renderEditableList('Example Phrases', examplePhrases, setExamplePhrases, newExamplePhrase, setNewExamplePhrase, 'bg-purple-50', 'border-purple-200')
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Example Phrases</h2>
              {examplePhrases.length > 0 ? (
                <div className="space-y-2">
                  {examplePhrases.map((phrase, index) => (
                    <div key={index} className="bg-purple-50 border border-purple-200 p-3 rounded-md">
                      <p className="text-gray-800 italic leading-relaxed">"{phrase}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No example phrases added yet</p>
              )}
            </div>
          )}

          {/* Secondary Reference Data */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            {/* Synonyms, Antonyms, Collocations, Related Words */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderEditableChipList('Synonyms', synonyms, setSynonyms, newSynonym, setNewSynonym, 'bg-green-100 text-green-800')}
              {renderEditableChipList('Antonyms', antonyms, setAntonyms, newAntonym, setNewAntonym, 'bg-red-100 text-red-800')}
              {renderEditableChipList('Collocations', collocations, setCollocations, newCollocation, setNewCollocation, 'bg-indigo-100 text-indigo-800')}
              {renderEditableChipList('Related Words', relatedWords, setRelatedWords, newRelatedWord, setNewRelatedWord, 'bg-yellow-100 text-yellow-800')}
            </div>

            {/* Grammar Roles */}
            {renderEditableChipList('Grammar Roles', grammarRoles, setGrammarRoles, newGrammarRole, setNewGrammarRole, 'bg-gray-100 text-gray-700')}

            {/* Word Forms */}
            {renderEditableChipList('Word Forms', wordForms, setWordForms, newWordForm, setNewWordForm, 'bg-gray-100 text-gray-700')}

            {/* Videos */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Videos</h3>
              <div className="space-y-2 mb-2">
                {videos.map((video, index) => (
                  <div key={index} className="flex items-center justify-between">
                    {isEditMode ? (
                      <>
                        <input
                          type="text"
                          value={video}
                          onChange={(e) => {
                            const updated = [...videos];
                            updated[index] = e.target.value;
                            setVideos(updated);
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeFromList(videos, setVideos, index)}
                          className="ml-2 p-1 hover:bg-red-200 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </>
                    ) : (
                      <a
                        href={video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        {video}
                      </a>
                    )}
                  </div>
                ))}
              </div>
              {isEditMode && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVideo}
                    onChange={(e) => setNewVideo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToList(videos, setVideos, newVideo, setNewVideo);
                      }
                    }}
                    placeholder="Add video URL..."
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => addToList(videos, setVideos, newVideo, setNewVideo)}
                    className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
              {videos.length === 0 && !isEditMode && (
                <p className="text-xs text-gray-400 italic">None</p>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 mb-1">IPA</p>
                {isEditMode ? (
                  <input
                    type="text"
                    value={ipa}
                    onChange={(e) => setIpa(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="IPA"
                  />
                ) : (
                  ipa && <p className="text-sm text-gray-700 font-mono">{ipa}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Register</p>
                {isEditMode ? (
                  <input
                    type="text"
                    value={register}
                    onChange={(e) => setRegister(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Register"
                  />
                ) : (
                  register && <p className="text-sm text-gray-700">{register}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Difficulty</p>
                {isEditMode ? (
                  <input
                    type="text"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Difficulty"
                  />
                ) : (
                  difficulty && <p className="text-sm text-gray-700">{difficulty}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Mastery</p>
                {isEditMode ? (
                  <input
                    type="text"
                    value={masteryLevel}
                    onChange={(e) => setMasteryLevel(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Mastery Level"
                  />
                ) : (
                  masteryLevel && <p className="text-sm text-gray-700">{masteryLevel}</p>
                )}
              </div>
              {useCount > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Times Used</p>
                  <p className="text-sm text-gray-700">{useCount}</p>
                </div>
              )}
              {lastReviewedAt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Last Reviewed</p>
                  <p className="text-sm text-gray-700">
                    {new Date(lastReviewedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Etymology */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Etymology</h3>
              {isEditMode ? (
                <textarea
                  value={etymology}
                  onChange={(e) => setEtymology(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Etymology"
                />
              ) : (
                etymology ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{etymology}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">None</p>
                )
              )}
            </div>

            {/* Notes */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              {isEditMode ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Notes"
                />
              ) : (
                notes ? (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notes}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">None</p>
                )
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Discard changes?</h2>
                  <p className="text-sm text-gray-600">
                    You have unsaved changes. If you close now, they will be lost.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Keep editing
                </button>
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveAndClose}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save and close'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Practice Card Modal */}
      {showPracticeCard && card && (
        <PracticeCard
          cardId={card.id}
          onClose={() => setShowPracticeCard(false)}
        />
      )}

      {/* Update Card AI Modal */}
      {showUpdateAI && card && (
        <UpdateCardAI
          card={card}
          onClose={() => setShowUpdateAI(false)}
          onSuccess={async (updatedCard) => {
            setShowUpdateAI(false);
            await loadCard(); // Reload to show updated data
            onSave();
          }}
        />
      )}

      {/* Move To Modal */}
      {showMoveToModal && card && categories.length > 0 && (
        <MoveToModal
          item={{
            id: card.id,
            name: card.name,
            type: 'card',
            parent_id: card.parent_id,
            is_folder: false,
            children: [],
            category_id: card.category_id ?? undefined,
          }}
          categories={categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            isExpanded: false,
            children: [],
          }))}
          onClose={() => setShowMoveToModal(false)}
          onMove={handleMove}
        />
      )}
    </>
  );
};
