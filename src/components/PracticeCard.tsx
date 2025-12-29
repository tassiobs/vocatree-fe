import React, { useState, useEffect } from 'react';
import { X, Eye, Plus, Loader2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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

type WizardStep = 1 | 2 | 3 | 4;

export const PracticeCard: React.FC<PracticeCardProps> = ({ cardId, onClose }) => {
  const [card, setCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
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

  // Input states for new entries
  const [newMeaningInput, setNewMeaningInput] = useState('');
  const [newExamplePhraseInput, setNewExamplePhraseInput] = useState('');
  const [newCollocationInput, setNewCollocationInput] = useState('');
  const [newSynonymInput, setNewSynonymInput] = useState('');
  const [newAntonymInput, setNewAntonymInput] = useState('');
  const [newRelatedWordInput, setNewRelatedWordInput] = useState('');
  const [newWordFormInput, setNewWordFormInput] = useState('');

  // AI feedback state for meaning step
  const [isLoadingAIFeedback, setIsLoadingAIFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<EvaluateMeaningResponse | null>(null);

  // AI feedback state for example phrase step
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
        // Reload card to get updated review_count
        await loadCard();
      } catch (err: any) {
        console.error('Error updating last_reviewed_at and review_count:', err);
        // Don't show error to user, just log it
      }
    }
  };

  const handleReveal = async (
    setter: React.Dispatch<React.SetStateAction<FieldState>>,
    currentState: FieldState
  ) => {
    if (!currentState.isRevealed) {
      setter({ ...currentState, isRevealed: true });
      await updateLastReviewed();
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
    if (!card || !newMeaningInput.trim()) {
      return;
    }

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
    if (!card || !newExamplePhraseInput.trim()) {
      return;
    }

    try {
      setIsLoadingAIExampleFeedback(true);
      setAiExampleFeedback(null);
      setError(null);

      const response = await apiClient.evaluateExamplePhrase({
        word: card.name,
        example_phrase: newExamplePhraseInput.trim(),
        language: 'English',
      });

      console.log('AI Example Feedback Response:', response);
      setAiExampleFeedback(response);
    } catch (err: any) {
      console.error('Error getting AI example feedback:', err);
      setError(err.response?.data?.detail || 'Failed to get AI feedback. Please try again.');
    } finally {
      setIsLoadingAIExampleFeedback(false);
    }
  };

  const getStepNewEntries = (step: WizardStep): boolean => {
    switch (step) {
      case 1:
        return meanings.newValues.length > 0;
      case 2:
        return examplePhrases.newValues.length > 0;
      case 3:
        return collocations.newValues.length > 0 || synonyms.newValues.length > 0;
      case 4:
        return antonyms.newValues.length > 0 || relatedWords.newValues.length > 0 || wordForms.newValues.length > 0;
      default:
        return false;
    }
  };

  const saveStepEntries = async (step: WizardStep) => {
    const updateData: any = {};

    switch (step) {
      case 1:
        if (meanings.newValues.length > 0) {
          updateData.meanings = [...meanings.existingValues, ...meanings.newValues];
        }
        break;
      case 2:
        if (examplePhrases.newValues.length > 0) {
          updateData.example_phrases = [...examplePhrases.existingValues, ...examplePhrases.newValues];
        }
        break;
      case 3:
        if (collocations.newValues.length > 0) {
          updateData.collocations = [...collocations.existingValues, ...collocations.newValues];
        }
        if (synonyms.newValues.length > 0) {
          updateData.synonyms = [...synonyms.existingValues, ...synonyms.newValues];
        }
        break;
      case 4:
        if (antonyms.newValues.length > 0) {
          updateData.antonyms = [...antonyms.existingValues, ...antonyms.newValues];
        }
        if (relatedWords.newValues.length > 0) {
          updateData.related_words = [...relatedWords.existingValues, ...relatedWords.newValues];
        }
        if (wordForms.newValues.length > 0) {
          updateData.word_forms = [...wordForms.existingValues, ...wordForms.newValues];
        }
        break;
    }

    if (Object.keys(updateData).length > 0) {
      try {
        setIsSaving(true);
        setError(null);
        await apiClient.updateCard(cardId, updateData);
      } catch (err: any) {
        console.error('Error saving step entries:', err);
        setError(err.response?.data?.detail || 'Failed to save entries. Please try again.');
        throw err;
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
      // Clear AI feedback when moving to next step
      setAiFeedback(null);
      setAiExampleFeedback(null);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
      // Clear AI feedback when moving to previous step
      setAiFeedback(null);
      setAiExampleFeedback(null);
    }
  };

  const handleNextAndSave = async () => {
    try {
      await saveStepEntries(currentStep);
      if (currentStep < 4) {
        setCurrentStep((prev) => (prev + 1) as WizardStep);
      } else {
        // Last step, close the wizard
        onClose();
      }
    } catch (err) {
      // Error already handled in saveStepEntries
    }
  };

  const renderField = (
    label: string,
    fieldState: FieldState,
    setter: React.Dispatch<React.SetStateAction<FieldState>>,
    inputValue: string,
    setInput: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string
  ) => {
    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
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

        <div className="space-y-2">
          {/* Existing values - only shown when revealed */}
          {fieldState.isRevealed && fieldState.existingValues.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Existing entries:</p>
              <div className="space-y-1">
                {fieldState.existingValues.map((value, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-2 rounded border border-gray-200 text-sm text-gray-700"
                  >
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New values added during practice - always shown if any exist */}
          {fieldState.newValues.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Your new entries:</p>
              <div className="space-y-1">
                {fieldState.newValues.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 bg-blue-50 p-2 rounded border border-blue-200"
                  >
                    <span className="flex-1 text-sm text-gray-900">{value}</span>
                    <button
                      onClick={() => handleRemoveNewValue(setter, fieldState, index)}
                      className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input for new entry - always visible */}
          <div className="flex space-x-2">
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
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              disabled={isSaving}
            />
            <button
              onClick={() => handleAddNewValue(setter, fieldState, inputValue, setInput)}
              disabled={!inputValue.trim() || isSaving}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              title="Add entry"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            {/* Meaning Field with AI Feedback */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Meaning</label>
                {!meanings.isRevealed && (
                  <button
                    onClick={() => handleReveal(setMeanings, meanings)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Reveal</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {/* Existing values - only shown when revealed */}
                {meanings.isRevealed && meanings.existingValues.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Existing entries:</p>
                    <div className="space-y-1">
                      {meanings.existingValues.map((value, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-2 rounded border border-gray-200 text-sm text-gray-700"
                        >
                          {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New values added during practice - always shown if any exist */}
                {meanings.newValues.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Your new entries:</p>
                    <div className="space-y-1">
                      {meanings.newValues.map((value, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 bg-blue-50 p-2 rounded border border-blue-200"
                        >
                          <span className="flex-1 text-sm text-gray-900">{value}</span>
                          <button
                            onClick={() => handleRemoveNewValue(setMeanings, meanings, index)}
                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input for new entry - always visible */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newMeaningInput}
                      onChange={(e) => setNewMeaningInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewValue(setMeanings, meanings, newMeaningInput, setNewMeaningInput);
                        }
                      }}
                      placeholder="Add a meaning..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm min-w-0"
                      disabled={isSaving}
                    />
                    <button
                      onClick={() => handleAddNewValue(setMeanings, meanings, newMeaningInput, setNewMeaningInput)}
                      disabled={!newMeaningInput.trim() || isSaving}
                      className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:flex-shrink-0"
                      title="Add entry"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add</span>
                    </button>
                  </div>

                  {/* AI Feedback Button */}
                  {newMeaningInput.trim() && (
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

                  {/* AI Feedback Display */}
                  {aiFeedback && (
                    <div className="mt-3 space-y-3 p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                      <div>
                        <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center space-x-1">
                          <Sparkles className="h-4 w-4 flex-shrink-0" />
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
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            {/* Example Phrase Field with AI Feedback */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Example Phrases</label>
                {!examplePhrases.isRevealed && (
                  <button
                    onClick={() => handleReveal(setExamplePhrases, examplePhrases)}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Reveal</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {/* Existing values - only shown when revealed */}
                {examplePhrases.isRevealed && examplePhrases.existingValues.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Existing entries:</p>
                    <div className="space-y-1">
                      {examplePhrases.existingValues.map((value, index) => (
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

                {/* New values added during practice - always shown if any exist */}
                {examplePhrases.newValues.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Your new entries:</p>
                    <div className="space-y-1">
                      {examplePhrases.newValues.map((value, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 bg-blue-50 p-2 rounded border border-blue-200"
                        >
                          <span className="flex-1 text-sm text-gray-900 break-words">{value}</span>
                          <button
                            onClick={() => handleRemoveNewValue(setExamplePhrases, examplePhrases, index)}
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

                {/* Input for new entry - always visible */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newExamplePhraseInput}
                      onChange={(e) => setNewExamplePhraseInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewValue(setExamplePhrases, examplePhrases, newExamplePhraseInput, setNewExamplePhraseInput);
                        }
                      }}
                      placeholder="Add an example phrase..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm min-w-0"
                      disabled={isSaving}
                    />
                    <button
                      onClick={() => handleAddNewValue(setExamplePhrases, examplePhrases, newExamplePhraseInput, setNewExamplePhraseInput)}
                      disabled={!newExamplePhraseInput.trim() || isSaving}
                      className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 sm:flex-shrink-0"
                      title="Add entry"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add</span>
                    </button>
                  </div>

                  {/* AI Feedback Button */}
                  {newExamplePhraseInput.trim() && (
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

                  {/* AI Feedback Display */}
                  {aiExampleFeedback && (
                    <div className="mt-3 space-y-3 p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                      <div>
                        <h4 className="text-sm font-semibold text-purple-900 mb-2 flex items-center space-x-1">
                          <Sparkles className="h-4 w-4 flex-shrink-0" />
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
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            {renderField(
              'Collocations',
              collocations,
              setCollocations,
              newCollocationInput,
              setNewCollocationInput,
              'Add a collocation...'
            )}
            {renderField(
              'Synonyms',
              synonyms,
              setSynonyms,
              newSynonymInput,
              setNewSynonymInput,
              'Add a synonym...'
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            {renderField(
              'Antonyms',
              antonyms,
              setAntonyms,
              newAntonymInput,
              setNewAntonymInput,
              'Add an antonym...'
            )}
            {renderField(
              'Related Words',
              relatedWords,
              setRelatedWords,
              newRelatedWordInput,
              setNewRelatedWordInput,
              'Add a related word...'
            )}
            {renderField(
              'Word Forms',
              wordForms,
              setWordForms,
              newWordFormInput,
              setNewWordFormInput,
              'Add a word form...'
            )}
          </div>
        );
    }
  };

  const getStepTitle = (step: WizardStep): string => {
    switch (step) {
      case 1:
        return 'Meaning';
      case 2:
        return 'Example Phrases';
      case 3:
        return 'Collocations & Synonyms';
      case 4:
        return 'Antonyms, Related Words & Word Forms';
      default:
        return '';
    }
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

  const hasStepEntries = getStepNewEntries(currentStep);
  const isLastStep = currentStep === 4;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8 max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 bg-white z-10">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              Practice Card <span className="font-semibold text-gray-700">·</span> <span className="font-semibold text-gray-800">{card?.name}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 font-normal opacity-75">{getStepTitle(currentStep)}</p>
            
            {/* Step Indicator Dots */}
            <div className="flex items-center space-x-1.5 mt-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    step === currentStep
                      ? 'bg-purple-600 w-4'
                      : step < currentStep
                      ? 'bg-purple-300'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {/* Progress Bar - Smaller and less prominent */}
            <div className="mt-2 w-32 bg-gray-200 rounded-full h-1">
              <div
                className="bg-purple-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
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

        {/* Content - Scrollable */}
        <div className="flex-1 p-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between space-x-3 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
            )}

            {!isLastStep && (
              <>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-purple-600 bg-white border border-purple-300 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextAndSave}
                  disabled={!hasStepEntries || isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Next and Save</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </>
            )}

            {isLastStep && (
              <button
                type="button"
                onClick={handleNextAndSave}
                disabled={!hasStepEntries || isSaving}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
