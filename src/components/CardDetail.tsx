import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../services/api';
import { Card } from '../types/api';
import { ListInput } from './ListInput';

interface CardDetailProps {
  cardId: number;
  onClose: () => void;
  onSave: () => void;
}

export const CardDetail: React.FC<CardDetailProps> = ({ cardId, onClose, onSave }) => {
  const [card, setCard] = useState<Card | null>(null);
  const [parentFolder, setParentFolder] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Expose refresh method to allow external updates
  const refreshCard = React.useCallback(() => {
    loadCard();
  }, [cardId]);

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
  const [notes, setNotes] = useState('');

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

  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave without saving?'
      );
      if (!confirmed) {
        return;
      }
    }
    onClose();
  };

  const handleSave = async () => {
    if (!card) return;

    try {
      setIsSaving(true);
      setError(null);

      await apiClient.updateCard(cardId, {
        name,
        example_phrases: examplePhrases.length > 0 ? examplePhrases : null,
        meanings: meanings.length > 0 ? meanings : null,
        grammar_roles: grammarRoles.length > 0 ? grammarRoles : null,
        collocations: collocations.length > 0 ? collocations : null,
        synonyms: synonyms.length > 0 ? synonyms : null,
        antonyms: antonyms.length > 0 ? antonyms : null,
        related_words: relatedWords.length > 0 ? relatedWords : null,
        word_forms: wordForms.length > 0 ? wordForms : null,
        videos: videos.length > 0 ? videos : null,
        use_count: useCount,
        notes: notes || null,
      });

      setHasChanges(false);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save card');
      console.error('Error saving card:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const markAsChanged = () => {
    if (!hasChanges) {
      setHasChanges(true);
    }
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Card Details</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                markAsChanged();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Parent Folder */}
          {parentFolder && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folder
              </label>
              <input
                type="text"
                value={parentFolder.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
          )}

          {/* Example Phrases */}
          <ListInput
            label="Example Phrases"
            items={examplePhrases}
            onChange={(items) => {
              setExamplePhrases(items);
              markAsChanged();
            }}
            placeholder="Add example phrase..."
          />

          {/* Meanings */}
          <ListInput
            label="Meanings"
            items={meanings}
            onChange={(items) => {
              setMeanings(items);
              markAsChanged();
            }}
            placeholder="Add meaning..."
          />

          {/* Grammar Roles */}
          <ListInput
            label="Grammar Roles"
            items={grammarRoles}
            onChange={(items) => {
              setGrammarRoles(items);
              markAsChanged();
            }}
            placeholder="Add grammar role..."
          />

          {/* Collocations */}
          <ListInput
            label="Collocations"
            items={collocations}
            onChange={(items) => {
              setCollocations(items);
              markAsChanged();
            }}
            placeholder="Add collocation..."
          />

          {/* Synonyms */}
          <ListInput
            label="Synonyms"
            items={synonyms}
            onChange={(items) => {
              setSynonyms(items);
              markAsChanged();
            }}
            placeholder="Add synonym..."
          />

          {/* Antonyms */}
          <ListInput
            label="Antonyms"
            items={antonyms}
            onChange={(items) => {
              setAntonyms(items);
              markAsChanged();
            }}
            placeholder="Add antonym..."
          />

          {/* Related Words */}
          <ListInput
            label="Related Words"
            items={relatedWords}
            onChange={(items) => {
              setRelatedWords(items);
              markAsChanged();
            }}
            placeholder="Add related word..."
          />

          {/* Word Forms */}
          <ListInput
            label="Word Forms"
            items={wordForms}
            onChange={(items) => {
              setWordForms(items);
              markAsChanged();
            }}
            placeholder="Add word form..."
          />

          {/* Videos */}
          <ListInput
            label="Videos"
            items={videos}
            onChange={(items) => {
              setVideos(items);
              markAsChanged();
            }}
            placeholder="Add video..."
          />

          {/* Times Used (Slider) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Times Used: {useCount}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              value={useCount}
              onChange={(e) => {
                setUseCount(parseInt(e.target.value));
                markAsChanged();
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                markAsChanged();
              }}
              rows={4}
              placeholder="Enter any additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};


