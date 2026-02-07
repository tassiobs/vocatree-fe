import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { apiClient } from '../services/api';

interface AITreeGeneratorProps {
  onClose: () => void;
  onSuccess: () => void;
  instanceId: number | null;
}

export const AITreeGenerator: React.FC<AITreeGeneratorProps> = ({ onClose, onSuccess, instanceId }) => {
  const [categoryName, setCategoryName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    if (!instanceId) {
      setError('Instance ID is required');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const requestBody = {
        language: 'English',
        category_name: categoryName.trim(),
        prompt: prompt.trim() || undefined,
        instance_id: instanceId,
      };
      
      const response = await apiClient.generateAITree(requestBody);
      
      // Show success message briefly before closing
      setIsGenerating(false);
      setShowSuccess(true);
      onSuccess();
      
      // Close modal after showing success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate tree structure');
      console.error('Error generating AI tree:', err);
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (isGenerating && !showSuccess) {
      const confirmed = window.confirm(
        'AI generation is in progress. Are you sure you want to cancel?'
      );
      if (!confirmed) return;
    }
    setShowSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Generate Tree with AI</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              AI is generating your category tree...
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              This may take a few seconds. Our AI is creating a complete category structure with folders and vocabulary cards based on your input.
            </p>
            <div className="mt-6 flex space-x-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-10 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Category tree created successfully!
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Your new category "{categoryName}" has been generated and added to your vocabulary tree.
            </p>
            <div className="mt-6 flex space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-purple-900 mb-1">
                  How it works
                </h3>
                <p className="text-sm text-purple-700">
                  Our AI will create a complete folder structure with vocabulary cards organized by topics and categories. 
                  You can provide additional instructions to customize the structure to your needs.
                </p>
              </div>
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Gym, Food, Travel, Business..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be the main category name for your generated tree
            </p>
          </div>

          {/* Optional Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Instructions (Optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Focus on business vocabulary, include example phrases for each word, organize by difficulty level, add common idioms..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide specific details about how you want the structure organized, what topics to include, or any special requirements
            </p>
          </div>

          {/* Examples */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Example prompts for inspiration:</h4>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Gym:</span> "Create folders for Workouts and Useful Expressions, with subfolders for Legs, Arms, and Chest."
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Food:</span> "Create folders for Food and Drinks with subfolders for Fruits, Vegetables, and Desserts."
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Travel:</span> "Organize by transportation, accommodation, and activities with common phrases for each."
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Business:</span> "Focus on meetings, presentations, and email communication with professional vocabulary."
              </div>
            </div>
          </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isGenerating}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !categoryName.trim()}
            className="px-5 py-2.5 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isGenerating ? 'Generating...' : 'Generate Tree'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

