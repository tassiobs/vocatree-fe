import React, { useState, useEffect } from 'react';
import { X, Eye, Plus, Loader2, Sparkles } from 'lucide-react';
import { apiClient } from '../services/api';
import { Card, EvaluateMeaningResponse, EvaluateExamplePhraseResponse } from '../types/api';

interface PracticeCardProps {
  cardId: number;
  onClose: () => void;
}

interface FieldState {
  isRevealed: boolean;
  existingValues: string[];
  newValues: string[];
}

export const PracticeCard: React.FC<PracticeCardProps> = ({ cardId, onClose }) => {
  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReviewedUpdated, setLastReviewedUpdated] = useState(false);

  // Field states
  const [meanings, setMeanings] = useState<FieldState>({
    isRevealed: false,
    existingValues: [],
    newValues: [],
  });
  const [examplePhrases, setExamplePhrases] = useState<FieldState>({
    isRevealed: false,
    existingValues: [],
    newValues: [],
  });
  const [collocations, setCollocations] = useState<FieldState>({
    isRevealed: false,
    existingValues: [],
    newValues: [],
  });
  const [synonyms, setSynonyms] = useState<FieldState>({
    isRevealed: false,
    existingValues: [],
    newValues: [],
  });
  const [antonyms, setAntonyms] = useState<FieldState>({
    isRevealed: false,
    existingValues: [],
    newValues: [],
  });
  const [relatedWords, setRelatedWords] = useState<FieldState>({
    isRevealed: false,
    existingValues: [],
    newValues: [],
  });
  const [wordForms, setWordForms] = useState<FieldState>({
    isRevealed: false,
    existingValues: [],
    newValues: [],
  });
  const [notes, setNotes] = useState('');

  // Input states for new entries
  const [newMeaningInput, setNewMeaningInput] = useState('');
  const [newExamplePhraseInput, setNewExamplePhraseInput] = useState('');
  const [newCollocationInput, setNewCollocationInput] = useState('');
  const [newSynonymInput, setNewSynonymInput] = useState('');
  const [newAntonymInput, setNewAntonymInput] = useState('');
  const [newRelatedWordInput, setNewRelatedWordInput] = useState('');
  const [newWordFormInput, setNewWordFormInput] = useState('');

  // AI feedback state
  const [isLoadingAIFeedback, setIsLoadingAIFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<EvaluateMeaningResponse | null>(null);
  const [isLoadingAIExampleFeedback, setIsLoadingAIExampleFeedback] = useState(false);
  const [aiExampleFeedback, setAiExampleFeedback] = useState<EvaluateExamplePhraseResponse | null>(null);

  useEffect(() => {
    loadCard();
  }, [cardId]);

  // Increment review_count when practice starts (after card is loaded)
  useEffect(() => {
    if (card && !lastReviewedUpdated) {
      updateLastReviewed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  const loadCard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cardData = await apiClient.getCard(cardId);
      setCard(cardData);

      // Initialize field states with existing values
      setMeanings({
        isRevealed: false,
        existingValues: cardData.meanings || [],
        newValues: [],
      });
      setExamplePhrases({
        isRevealed: false,
        existingValues: cardData.example_phrases || [],
        newValues: [],
      });
      setCollocations({
        isRevealed: false,
        existingValues: cardData.collocations || [],
        newValues: [],
      });
      setSynonyms({
        isRevealed: false,
        existingValues: cardData.synonyms || [],
        newValues: [],
      });
      setAntonyms({
        isRevealed: false,
        existingValues: cardData.antonyms || [],
        newValues: [],
      });
      setRelatedWords({
        isRevealed: false,
        existingValues: cardData.related_words || [],
        newValues: [],
      });
      setWordForms({
        isRevealed: false,
        existingValues: cardData.word_forms || [],
        newValues: [],
      });
      setNotes(cardData.notes || '');
    } catch (err: any) {
      console.error('Error loading card:', err);
      setError(err.response?.data?.detail || 'Failed to load card');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLastReviewed = async () => {
    if (!lastReviewedUpdated && card) {
      try {
        const currentReviewCount = card.review_count || 0;
        await apiClient.updateCard(cardId, {
          last_reviewed_at: new Date().toISOString(),
          review_count: currentReviewCount + 1,
        });
        setLastReviewedUpdated(true);
        // Update local state instead of reloading to avoid double loading
        setCard({
          ...card,
          last_reviewed_at: new Date().toISOString(),
          review_count: currentReviewCount + 1,
        });
      } catch (err: any) {
        console.error('Error updating last_reviewed_at and review_count:', err);
        // Don't show error to user, just log it
      }
    }
  };

  const handleReveal = (setter: React.Dispatch<React.SetStateAction<FieldState>>, currentState: FieldState) => {
    if (!currentState.isRevealed) {
      setter({ ...currentState, isRevealed: true });
    }
  };

  const handleAddNewValue = (
    setter: React.Dispatch<React.SetStateAction<FieldState>>,
    currentState: FieldState,
    inputValue: string,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (inputValue.trim()) {
      setter({
        ...currentState,
        newValues: [...currentState.newValues, inputValue.trim()],
      });
      setInput('');
    }
  };

  const handleRemoveNewValue = (
    setter: React.Dispatch<React.SetStateAction<FieldState>>,
    currentState: FieldState,
    index: number
  ) => {
    setter({
      ...currentState,
      newValues: currentState.newValues.filter((_, i) => i !== index),
    });
  };

  const handleGetAIFeedback = async () => {
    if (!card || !newMeaningInput.trim()) return;

    try {
      setIsLoadingAIFeedback(true);
      setAiFeedback(null);
      setError(null);

      const response = await apiClient.evaluateMeaning({
        word: card.name,
        user_meaning: newMeaningInput.trim(),
        language: 'English',
      });

      setAiFeedback(response);
    } catch (err: any) {
      console.error('Error getting AI feedback:', err);
      setError(err.response?.data?.detail || 'Failed to get AI feedback. Please try again.');
    } finally {
      setIsLoadingAIFeedback(false);
    }
  };

  const handleGetAIExampleFeedback = async () => {
    if (!card || !newExamplePhraseInput.trim()) return;

    try {
      setIsLoadingAIExampleFeedback(true);
      setAiExampleFeedback(null);
      setError(null);

      const response = await apiClient.evaluateExamplePhrase({
        word: card.name,
        example_phrase: newExamplePhraseInput.trim(),
        language: 'English',
      });

      setAiExampleFeedback(response);
    } catch (err: any) {
      console.error('Error getting AI example feedback:', err);
      setError(err.response?.data?.detail || 'Failed to get AI feedback. Please try again.');
    } finally {
      setIsLoadingAIExampleFeedback(false);
    }
  };

  const hasChanges = () => {
    return (
      meanings.newValues.length > 0 ||
      examplePhrases.newValues.length > 0 ||
      collocations.newValues.length > 0 ||
      synonyms.newValues.length > 0 ||
      antonyms.newValues.length > 0 ||
      relatedWords.newValues.length > 0 ||
      wordForms.newValues.length > 0 ||
      notes !== (card?.notes || '')
    );
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const updateData: any = {};

      if (meanings.newValues.length > 0) {
        updateData.meanings = [...meanings.existingValues, ...meanings.newValues];
      }
      if (examplePhrases.newValues.length > 0) {
        updateData.example_phrases = [...examplePhrases.existingValues, ...examplePhrases.newValues];
      }
      if (collocations.newValues.length > 0) {
        updateData.collocations = [...collocations.existingValues, ...collocations.newValues];
      }
      if (synonyms.newValues.length > 0) {
        updateData.synonyms = [...synonyms.existingValues, ...synonyms.newValues];
      }
      if (antonyms.newValues.length > 0) {
        updateData.antonyms = [...antonyms.existingValues, ...antonyms.newValues];
      }
      if (relatedWords.newValues.length > 0) {
        updateData.related_words = [...relatedWords.existingValues, ...relatedWords.newValues];
      }
      if (wordForms.newValues.length > 0) {
        updateData.word_forms = [...wordForms.existingValues, ...wordForms.newValues];
      }
      if (notes !== (card?.notes || '')) {
        updateData.notes = notes;
      }

      if (Object.keys(updateData).length > 0) {
        await apiClient.updateCard(cardId, updateData);
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving card:', err);
      setError(err.response?.data?.detail || 'Failed to save card. Please try again.');
      setIsSaving(false);
    }
  };

  const renderField = (
    label: string,
    fieldState: FieldState,
    setter: React.Dispatch<React.SetStateAction<FieldState>>,
    inputValue: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string,
    showAIFeedback?: boolean
  ) => {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {!fieldState.isRevealed && (
            <button
              onClick={() => handleReveal(setter, fieldState)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>Reveal</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Existing values */}
          {fieldState.isRevealed && fieldState.existingValues.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Existing entries:</p>
              <div className="space-y-1">
                {fieldState.existingValues.map((value, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-2 rounded border border-gray-200 text-sm text-gray-700 break-words"
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New values */}
          {fieldState.newValues.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Your new entries:</p>
              <div className="space-y-1">
                {fieldState.newValues.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-blue-50 p-2 rounded border border-blue-200"
                  >
                    <span className="flex-1 text-sm text-gray-900 break-words">{value}</span>
                    <button
                      onClick={() => handleRemoveNewValue(setter, fieldState, index)}
                      className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors flex-shrink-0"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewValue(setter, fieldState, inputValue, setInput);
                  }
                }}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm min-w-0"
                disabled={isSaving}
              />
              <button
                onClick={() => handleAddNewValue(setter, fieldState, inputValue, setInput)}
                disabled={!inputValue.trim() || isSaving}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add</span>
              </button>
            </div>

            {/* AI Feedback Button for Meaning */}
            {showAIFeedback && inputValue.trim() && label === 'Meaning' && (
              <button
                onClick={handleGetAIFeedback}
                disabled={isLoadingAIFeedback || isSaving}
                className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all text-sm"
              >
                {isLoadingAIFeedback ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Getting AI Feedback...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Get AI Feedback</span>
                  </>
                )}
              </button>
            )}

            {/* AI Feedback Button for Example Phrases */}
            {showAIFeedback && inputValue.trim() && label === 'Example Phrases' && (
              <button
                onClick={handleGetAIExampleFeedback}
                disabled={isLoadingAIExampleFeedback || isSaving}
                className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all text-sm"
              >
                {isLoadingAIExampleFeedback ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Getting AI Feedback...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Get AI Feedback</span>
                  </>
                )}
              </button>
            )}

            {/* AI Feedback Display for Meaning */}
            {label === 'Meaning' && aiFeedback && (
              <div className="mt-3 space-y-3 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center space-x-1">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Feedback</span>
                  </h4>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border border-purple-100 break-words whitespace-pre-wrap">
                    {aiFeedback.evaluation}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 mb-2">Refined Meaning</h4>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border border-indigo-100 break-words">
                    {aiFeedback.refined_meaning}
                  </p>
                </div>
              </div>
            )}

            {/* AI Feedback Display for Example Phrases */}
            {label === 'Example Phrases' && aiExampleFeedback && (
              <div className="mt-3 space-y-3 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center space-x-1">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Feedback</span>
                  </h4>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border border-purple-100 break-words whitespace-pre-wrap">
                    {aiExampleFeedback.feedback || 'No evaluation provided'}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900 mb-2">Refined Phrase</h4>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border border-indigo-100 break-words">
                    {aiExampleFeedback.refined_phrase || 'No refined phrase provided'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading card...</span>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-white z-10">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{card?.name}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4 flex-shrink-0"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {renderField('Meaning', meanings, setMeanings, newMeaningInput, setNewMeaningInput, 'Add a meaning...', true)}
            {renderField('Example Phrases', examplePhrases, setExamplePhrases, newExamplePhraseInput, setNewExamplePhraseInput, 'Add an example phrase...', true)}
            {renderField('Collocations', collocations, setCollocations, newCollocationInput, setNewCollocationInput, 'Add a collocation...')}
            {renderField('Synonyms', synonyms, setSynonyms, newSynonymInput, setNewSynonymInput, 'Add a synonym...')}
            {renderField('Antonyms', antonyms, setAntonyms, newAntonymInput, setNewAntonymInput, 'Add an antonym...')}
            {renderField('Related Words', relatedWords, setRelatedWords, newRelatedWordInput, setNewRelatedWordInput, 'Add a related word...')}
            {renderField('Word Forms', wordForms, setWordForms, newWordFormInput, setNewWordFormInput, 'Add a word form...')}

            {/* Notes field */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between space-x-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges() || isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save and Close</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
