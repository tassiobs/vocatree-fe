import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiClient } from '../services/api';
import { Instance } from '../types/api';

interface CreateCollectionModalProps {
  onClose: () => void;
  onSuccess: (collection: Instance) => void;
}

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workplaceId, setWorkplaceId] = useState<number | null>(null);
  const [isLoadingWorkplace, setIsLoadingWorkplace] = useState(true);

  useEffect(() => {
    loadWorkplace();
  }, []);

  const loadWorkplace = async () => {
    try {
      setIsLoadingWorkplace(true);
      // Try to get workplace_id from existing collections first
      const collections = await apiClient.getInstances();
      if (collections.items.length > 0) {
        setWorkplaceId(collections.items[0].instance.workplace_id);
      } else {
        // No collections yet - get from workplaces endpoint
        const workplaces = await apiClient.getWorkplaces();
        if (workplaces.items.length > 0) {
          setWorkplaceId(workplaces.items[0].workplace.id);
        } else {
          setError('No workplace found. Please contact support.');
        }
      }
    } catch (err: any) {
      console.error('Error loading workplace:', err);
      setError('Failed to load workplace information');
    } finally {
      setIsLoadingWorkplace(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    if (!workplaceId) {
      setError('Workplace not found');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const newCollection = await apiClient.createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        workplace_id: workplaceId,
      });

      onSuccess(newCollection);
    } catch (err: any) {
      console.error('Error creating collection:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingWorkplace) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create Collection</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter collection name"
              maxLength={100}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter collection description (optional)"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
