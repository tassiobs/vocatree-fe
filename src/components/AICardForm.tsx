import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface AICardFormProps {
  // For category mode
  categoryId?: number;
  categoryName?: string;
  // For folder mode
  parentId?: number;
  parentName?: string;
  onClose: () => void;
  onSuccess: (cardId: number) => void;
}

export const AICardForm: React.FC<AICardFormProps> = ({
  categoryId,
  categoryName,
  parentId,
  parentName,
  onClose,
  onSuccess,
}) => {
  const [cardName, setCardName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if we're in category or folder mode
  const isCategoryMode = categoryId !== undefined;
  const contextName = isCategoryMode ? categoryName : parentName;
  const contextType = isCategoryMode ? 'Category' : 'Folder';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardName.trim()) {
      setError('Card name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const { apiClient } = await import('../services/api');
      
      // Build request data based on mode
      const requestData: {
        name: string;
        language: string;
        prompt?: string;
        category_id?: number;
        parent_id?: number;
      } = {
        name: cardName.trim(),
        language: 'English',
        prompt: prompt.trim() || undefined,
      };

      if (isCategoryMode) {
        requestData.category_id = categoryId;
      } else {
        requestData.parent_id = parentId;
      }

      const card = await apiClient.createAICard(requestData);

      onSuccess(card.id);
    } catch (err: any) {
      console.error('Error creating AI card:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create AI card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Card with AI</h2>
              <p className="text-sm text-gray-500">{contextType}: {contextName}</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Info box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-purple-900 mb-1">
                  AI-Powered Card Creation
                </h3>
                <p className="text-sm text-purple-700">
                  Our AI will generate a comprehensive vocabulary card with meanings, examples, grammar roles, and more based on your input.
                </p>
              </div>
            </div>
          </div>

          {/* Card Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="e.g., Serendipity, Ephemeral, Resilience..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the word or phrase you want to create a card for
            </p>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Focus on business context, Include common collocations, Emphasize formal usage..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-medium">Tip:</span> You can use a prompt to help define the card. For example, specify the context (business, academic, casual), focus areas (collocations, idioms, phrasal verbs), or any particular aspects you want emphasized.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !cardName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Create Card</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

