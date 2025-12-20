import React, { useState, useEffect } from 'react';
import { X, SkipForward, BookOpen, Loader2, Folder, Tag } from 'lucide-react';
import { apiClient } from '../services/api';
import { Card } from '../types/api';
import { FolderPracticeForm } from './FolderPracticeForm';

interface FolderPracticeSessionProps {
  folderId: number;
  folderName: string;
  categoryId?: number | null;
  categoryName?: string;
  onClose: () => void;
}

// Fisher-Yates shuffle algorithm
const shuffle = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const FolderPracticeSession: React.FC<FolderPracticeSessionProps> = ({
  folderId,
  folderName,
  categoryId,
  categoryName,
  onClose,
}) => {
  const [folderCardIds, setFolderCardIds] = useState<number[]>([]);
  const [cycleQueue, setCycleQueue] = useState<number[]>([]);
  const [currentCardId, setCurrentCardId] = useState<number | null>(null);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCard, setIsLoadingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPracticeForm, setShowPracticeForm] = useState(false);

  // Load folder cards on mount
  useEffect(() => {
    loadFolderCards();
  }, [folderId]);

  // Load current card when currentCardId changes
  useEffect(() => {
    if (currentCardId !== null) {
      loadCurrentCard();
    }
  }, [currentCardId]);

  const loadFolderCards = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all cards in the folder (only cards, not folders)
      const response = await apiClient.getCards({ parent_id: folderId });
      const cards = response.items.filter((card: Card) => !card.is_folder);
      const cardIds = cards.map((card: Card) => card.id);

      if (cardIds.length === 0) {
        setError('empty');
        setIsLoading(false);
        return;
      }

      setFolderCardIds(cardIds);
      setTotalCards(cardIds.length);

      // Initialize first cycle
      const shuffled = shuffle(cardIds);
      setCycleQueue(shuffled.slice(1)); // Remove first item, it will be currentCardId
      setCurrentCardId(shuffled[0]);
    } catch (err: any) {
      console.error('Error loading folder cards:', err);
      setError(err.response?.data?.detail || 'Failed to load folder cards');
      setIsLoading(false);
    }
  };

  const loadCurrentCard = async () => {
    if (currentCardId === null) return;

    try {
      setIsLoadingCard(true);
      const cardData = await apiClient.getCard(currentCardId);
      setCurrentCard(cardData);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading card:', err);
      setError(err.response?.data?.detail || 'Failed to load card');
      setIsLoadingCard(false);
    } finally {
      setIsLoadingCard(false);
    }
  };

  const goToNextCard = () => {
    setCycleQueue((prevQueue) => {
      const lastCardId = currentCardId;
      
      if (prevQueue.length > 0) {
        // Pop next card from queue
        const nextCardId = prevQueue[0];
        setCurrentCardId(nextCardId);
        return prevQueue.slice(1);
      } else {
        // Cycle complete, start new cycle
        setCycleNumber((prev) => prev + 1);
        
        // Create new shuffled queue
        let shuffled = shuffle(folderCardIds);
        
        // Avoid immediate repeat if possible
        if (folderCardIds.length > 1 && lastCardId !== null) {
          // If the first card in new cycle is the same as last shown, swap it
          if (shuffled[0] === lastCardId) {
            const swapIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1;
            [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
          }
        }
        
        const nextCardId = shuffled[0];
        setCurrentCardId(nextCardId);
        return shuffled.slice(1);
      }
    });
  };

  const handleSkip = () => {
    goToNextCard();
  };

  const handlePractice = () => {
    setShowPracticeForm(true);
  };

  const handlePracticeFormClose = () => {
    setShowPracticeForm(false);
  };

  const handlePracticeFormNext = (shouldSave: boolean) => {
    setShowPracticeForm(false);
    if (shouldSave) {
      // Reload current card to get updated data
      if (currentCardId !== null) {
        loadCurrentCard();
      }
    }
    goToNextCard();
  };

  const seenCount = totalCards - cycleQueue.length;

  // Empty state
  if (error === 'empty') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Folder className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No cards in this folder yet</p>
              <p className="text-sm text-center mb-6">
                Add cards to this folder to start practicing
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || isLoadingCard || !currentCard) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Loading practice session...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && error !== 'empty') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Practice Folder</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {categoryName && (
                  <div className="flex items-center space-x-1">
                    <Tag className="h-4 w-4" />
                    <span>{categoryName}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Folder className="h-4 w-4" />
                  <span>{folderName}</span>
                </div>
              </div>
              <div className="mt-2 text-sm font-medium text-purple-600">
                Seen {seenCount} / {totalCards} · Cycle {cycleNumber}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-4"
              title="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Card Display */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-8 text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{currentCard.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {categoryName && (
                    <div className="flex items-center justify-center space-x-1">
                      <Tag className="h-3 w-3" />
                      <span>{categoryName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center space-x-1">
                    <Folder className="h-3 w-3" />
                    <span>{folderName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleSkip}
                disabled={isLoadingCard}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <SkipForward className="h-5 w-5" />
                <span>Skip</span>
              </button>
              <button
                onClick={handlePractice}
                disabled={isLoadingCard}
                className="px-6 py-3 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <BookOpen className="h-5 w-5" />
                <span>Practice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Practice Form Modal */}
      {showPracticeForm && currentCardId !== null && (
        <FolderPracticeForm
          cardId={currentCardId}
          cardName={currentCard.name}
          categoryId={categoryId}
          categoryName={categoryName}
          folderName={folderName}
          onClose={handlePracticeFormClose}
          onNext={handlePracticeFormNext}
        />
      )}
    </>
  );
};

