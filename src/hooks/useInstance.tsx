import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '../services/api';
import { Instance, InstanceListResponse } from '../types/api';

interface InstanceContextType {
  instances: Instance[];
  selectedInstanceId: number | null;
  isLoading: boolean;
  selectInstance: (instanceId: number | null) => void;
  refreshInstances: () => Promise<void>;
}

const InstanceContext = createContext<InstanceContextType | undefined>(undefined);

export const useInstance = (): InstanceContextType => {
  const context = useContext(InstanceContext);
  if (!context) {
    throw new Error('useInstance must be used within an InstanceProvider');
  }
  return context;
};

interface InstanceProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'vocatree_selected_instance_id';

export const InstanceProvider = ({ children }: InstanceProviderProps) => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadInstances = useCallback(async () => {
    try {
      setIsLoading(true);
      const response: InstanceListResponse = await apiClient.getInstances();
      console.log('Instances response:', response);
      const instanceList = response.items.map(item => item.instance);
      console.log('Parsed instance list:', instanceList);
      setInstances(instanceList);

      // Handle default behavior based on instance count
      const savedInstanceId = localStorage.getItem(STORAGE_KEY);
      const savedId = savedInstanceId ? parseInt(savedInstanceId, 10) : null;

      if (instanceList.length === 0) {
        // No instances available
        console.log('No instances found');
        setSelectedInstanceId(null);
        localStorage.removeItem(STORAGE_KEY);
      } else if (instanceList.length === 1) {
        // Auto-select the only instance
        console.log('Auto-selecting single instance:', instanceList[0].id);
        setSelectedInstanceId(instanceList[0].id);
        localStorage.setItem(STORAGE_KEY, instanceList[0].id.toString());
      } else {
        // Multiple instances - use saved selection or first one
        const validSavedId = savedId && instanceList.some(inst => inst.id === savedId);
        if (validSavedId) {
          console.log('Using saved instance:', savedId);
          setSelectedInstanceId(savedId);
        } else {
          // Default to first instance if no valid saved selection
          console.log('Defaulting to first instance:', instanceList[0].id);
          setSelectedInstanceId(instanceList[0].id);
          localStorage.setItem(STORAGE_KEY, instanceList[0].id.toString());
        }
      }
    } catch (error: any) {
      console.error('Error loading instances:', error);
      console.error('Error details:', error.response?.data || error.message);
      setInstances([]);
      setSelectedInstanceId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectInstance = useCallback((instanceId: number | null) => {
    setSelectedInstanceId(instanceId);
    if (instanceId !== null) {
      localStorage.setItem(STORAGE_KEY, instanceId.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshInstances = useCallback(async () => {
    await loadInstances();
  }, [loadInstances]);

  // Load instances on mount
  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  const value: InstanceContextType = {
    instances,
    selectedInstanceId,
    isLoading,
    selectInstance,
    refreshInstances,
  };

  return (
    <InstanceContext.Provider value={value}>
      {children}
    </InstanceContext.Provider>
  );
};
