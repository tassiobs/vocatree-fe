import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { apiClient } from '../services/api';
import { Card } from '../types/api';

interface UpdateCardAIProps {
  card: Card;
  onClose: () => void;
  onSuccess: (updatedCard: Card) => void;
}

export const UpdateCardAI: React.FC<UpdateCardAIProps> = ({ card, onClose, onSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const updatedCard = await apiClient.aiEnrichCard(card.id, {
        language: 'English',
        prompt: prompt.trim() || '',
      });
      
      // On success, call onSuccess with updated card and close modal
      onSuccess(updatedCard);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update card with AI. Please try again.');
      console.error('Error updating card with AI:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Update Card using AI</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card Name (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Name
              </label>
              <input
                type="text"
                value={card.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                readOnly
              />
            </div>

            {/* Prompt (Optional) */}
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Prompt <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
                rows={4}
                placeholder="Describe how you want the card to be updated (e.g., 'Add more example phrases', 'Expand meanings with more details')..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Helper Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> When you submit, the AI-generated result will overwrite the existing card content.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Update Card
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

