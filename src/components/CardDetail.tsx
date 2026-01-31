import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { apiClient } from '../services/api';
import { Card } from '../types/api';

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

  // Form state (read-only display values)
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
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{name}</h1>
            {parentFolder && (
              <p className="text-sm text-gray-500">in {parentFolder.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-4"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Meanings - Primary Content */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Meanings</h2>
            {meanings.length > 0 ? (
              <div className="space-y-3">
                {meanings.map((meaning, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md"
                  >
                    <p className="text-gray-900 leading-relaxed">{meaning}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No meanings added yet</p>
            )}
          </div>

          {/* Example Phrases - Primary Learning Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Example Phrases</h2>
            {examplePhrases.length > 0 ? (
              <div className="space-y-2">
                {examplePhrases.map((phrase, index) => (
                  <div
                    key={index}
                    className="bg-purple-50 border border-purple-200 p-3 rounded-md"
                  >
                    <p className="text-gray-800 italic leading-relaxed">"{phrase}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No example phrases added yet</p>
            )}
          </div>

          {/* Secondary Reference Data - Visually Lighter */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            {/* Synonyms, Antonyms, Collocations, Related Words - Chips */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Synonyms</h3>
                {synonyms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {synonyms.map((synonym, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {synonym}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">None</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Antonyms</h3>
                {antonyms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {antonyms.map((antonym, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {antonym}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">None</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Collocations</h3>
                {collocations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {collocations.map((collocation, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                      >
                        {collocation}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">None</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Related Words</h3>
                {relatedWords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {relatedWords.map((word, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">None</p>
                )}
              </div>
            </div>

            {/* Grammar Roles - Chips */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Grammar Roles</h3>
              {grammarRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {grammarRoles.map((role, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">None</p>
              )}
            </div>

            {/* Word Forms - Chips */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Word Forms</h3>
              {wordForms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {wordForms.map((form, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {form}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">None</p>
              )}
            </div>

            {/* Videos - Links */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Videos</h3>
              {videos.length > 0 ? (
                <div className="space-y-2">
                  {videos.map((video, index) => (
                    <a
                      key={index}
                      href={video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                    >
                      {video}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">None</p>
              )}
            </div>

            {/* Metadata - Compact Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              {ipa && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">IPA</p>
                  <p className="text-sm text-gray-700 font-mono">{ipa}</p>
                </div>
              )}
              {register && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Register</p>
                  <p className="text-sm text-gray-700">{register}</p>
                </div>
              )}
              {difficulty && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Difficulty</p>
                  <p className="text-sm text-gray-700">{difficulty}</p>
                </div>
              )}
              {masteryLevel && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mastery</p>
                  <p className="text-sm text-gray-700">{masteryLevel}</p>
                </div>
              )}
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
              {etymology ? (
                <p className="text-sm text-gray-700 leading-relaxed">{etymology}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">None</p>
              )}
            </div>

            {/* Notes */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
              {notes ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notes}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">None</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


