import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useInstance } from '../hooks/useInstance';
import { Instance } from '../types/api';
import { CreateCollectionModal } from './CreateCollectionModal';
import { EditCollectionModal } from './EditCollectionModal';
import { DeleteCollectionConfirm } from './DeleteCollectionConfirm';
import { Loader2, Plus, Edit, Trash2, Check, Building2 } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const { instances, selectedInstanceId, isLoading: instancesLoading, selectInstance, refreshInstances } = useInstance();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Instance | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Instance | null>(null);

  useEffect(() => {
    if (!instancesLoading) {
      refreshInstances();
    }
  }, []);

  const handleCreateSuccess = async (newCollection: Instance) => {
    await refreshInstances();
    selectInstance(newCollection.id);
    setShowCreateModal(false);
  };

  const handleEditSuccess = async () => {
    await refreshInstances();
    setEditingCollection(null);
  };

  const handleDeleteSuccess = async (deletedId: number) => {
    await refreshInstances();
    
    // Handle selection fallback if deleted collection was selected
    if (deletedId === selectedInstanceId) {
      const updatedInstances = await apiClient.getInstances();
      const instanceList = updatedInstances.items.map(item => item.instance);
      
      if (instanceList.length === 0) {
        selectInstance(null);
      } else {
        // Select first available collection (or default id=1 if exists)
        const defaultCollection = instanceList.find(inst => inst.id === 1);
        selectInstance(defaultCollection ? defaultCollection.id : instanceList[0].id);
      }
    }
    
    setDeletingCollection(null);
  };

  const handleSelectCollection = (collectionId: number) => {
    selectInstance(collectionId);
  };

  if (instancesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading collections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage your vocabulary collections</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create Collection</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Collections List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm sm:text-base text-gray-600">Loading collections...</span>
            </div>
          ) : instances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-500">
              <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mb-4 opacity-50" />
              <p className="text-base sm:text-lg font-medium mb-2">No collections</p>
              <p className="text-xs sm:text-sm text-center mb-4 px-4">
                Create your first collection to organize your vocabulary
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Create Collection
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((collection) => {
                const isSelected = collection.id === selectedInstanceId;
                const isDefault = collection.id === 1;

                return (
                  <div
                    key={collection.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {collection.name}
                          </h3>
                          {isDefault && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                              Default
                            </span>
                          )}
                          {isSelected && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Selected
                            </span>
                          )}
                        </div>
                        {collection.description && (
                          <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Created: {new Date(collection.created_at).toLocaleDateString()}</span>
                          {!collection.is_active && (
                            <span className="text-red-600">Inactive</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!isSelected && (
                          <button
                            onClick={() => handleSelectCollection(collection.id)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            Select
                          </button>
                        )}
                        <button
                          onClick={() => setEditingCollection(collection)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit collection"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCollection(collection)}
                          disabled={isDefault}
                          className={`p-2 rounded-md transition-colors ${
                            isDefault
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={isDefault ? 'Cannot delete default collection' : 'Delete collection'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {editingCollection && (
        <EditCollectionModal
          collection={editingCollection}
          onClose={() => setEditingCollection(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingCollection && (
        <DeleteCollectionConfirm
          collection={deletingCollection}
          onClose={() => setDeletingCollection(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};
