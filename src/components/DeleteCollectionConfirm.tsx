import React, { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { apiClient } from '../services/api';
import { Instance } from '../types/api';

interface DeleteCollectionConfirmProps {
  collection: Instance;
  onClose: () => void;
  onSuccess: (deletedId: number) => void;
}

export const DeleteCollectionConfirm: React.FC<DeleteCollectionConfirmProps> = ({ collection, onClose, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      await apiClient.deleteCollection(collection.id);
      onSuccess(collection.id);
    } catch (err: any) {
      console.error('Error deleting collection:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to delete collection');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Delete Collection</h2>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to delete <strong>{collection.name}</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All cards and categories in this collection will be permanently deleted.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 mb-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete Collection
          </button>
        </div>
      </div>
    </div>
  );
};
