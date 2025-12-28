import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { ReviewedCard } from '../types/api';
import { PracticeCard } from './PracticeCard';
import { Loader2, BookOpen, Folder, Tag, TrendingUp, ArrowRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [reviewedCards, setReviewedCards] = useState<ReviewedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [total, setTotal] = useState<number>(0);
  const [practicingCardId, setPracticingCardId] = useState<number | null>(null);

  useEffect(() => {
    loadReviewedCards();
  }, [selectedDays]);

  const loadReviewedCards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getReviewedCards(selectedDays);
      setReviewedCards(response.items);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Error loading reviewed cards:', err);
      setError(`Failed to load reviewed cards: ${err.message || err.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Track your vocabulary learning progress</p>
        </div>
        <Link
          to="/tree"
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <span>Go to Library</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Last Reviewed Cards Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Last Reviewed Cards</h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  {total} {total === 1 ? 'card' : 'cards'} reviewed
                </p>
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Time range:</span>
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedDays(7)}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    selectedDays === 7
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  7 days
                </button>
                <button
                  onClick={() => setSelectedDays(30)}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    selectedDays === 30
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  30 days
                </button>
                <button
                  onClick={() => setSelectedDays(90)}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    selectedDays === 90
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  90 days
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cards List */}
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm sm:text-base text-gray-600">Loading reviewed cards...</span>
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-xs sm:text-sm text-red-700">{error}</div>
              <button
                onClick={loadReviewedCards}
                className="mt-2 text-xs sm:text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          ) : reviewedCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-500">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mb-4 opacity-50" />
              <p className="text-base sm:text-lg font-medium mb-2">No reviewed cards</p>
              <p className="text-xs sm:text-sm text-center mb-4 px-4">
                You haven't reviewed any cards in the last {selectedDays} days
              </p>
              <Link
                to="/tree"
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Go to Library
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {reviewedCards.map((card) => (
                <div
                  key={card.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setPracticingCardId(card.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left side: Card name and metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words">{card.name}</h3>
                        <span className="text-xs text-blue-600 font-medium">Practice</span>
                      </div>
                      
                      {/* Category and Folder Info - more subtle */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {card.category_name && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Tag className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="break-words">{card.category_name}</span>
                          </div>
                        )}
                        {card.parent_name && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Folder className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="break-words">{card.parent_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side: Review stats */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {card.next_review_at && (
                        <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
                          <TrendingUp className="h-3 w-3 text-gray-400" />
                          <span className="whitespace-nowrap">{formatDate(card.next_review_at)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        <span>{card.review_count}</span>
                        <span className="hidden sm:inline">reviews</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Practice Card Modal */}
      {practicingCardId !== null && (
        <PracticeCard
          cardId={practicingCardId}
          onClose={() => {
            setPracticingCardId(null);
            // Refresh reviewed cards to get updated data
            loadReviewedCards();
          }}
        />
      )}
    </div>
  );
};

