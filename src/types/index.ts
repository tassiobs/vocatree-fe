// Application types
export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Tree structure types
export interface TreeItem {
  id: number;
  name: string;
  type: 'folder' | 'card';
  parent_id: number | null;
  is_folder: boolean;
  children: TreeItem[];
  isExpanded?: boolean;
  // Card-specific properties
  example_phrases?: string[] | null;
  meanings?: string[] | null;
  grammar_roles?: string[] | null;
  collocations?: string[] | null;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  use_count?: number;
  notes?: string | null;
  created_at?: string;
  user_created?: number;
}

export interface DragItem {
  id: number;
  type: 'folder' | 'card';
  parent_id: number | null;
}

// Component props
export interface TreeNodeProps {
  item: TreeItem;
  onToggle: (id: number) => void;
  onRename: (id: number, newName: string) => void;
  onDelete: (id: number) => void;
  onAddChild: (parentId: number, type: 'folder' | 'card', name: string) => void;
  onMove: (itemId: number, newParentId: number | null) => void;
  level: number;
}

export interface AddItemInputProps {
  parentId: number | null;
  type: 'folder' | 'card';
  onSubmit: (name: string) => void;
  onCancel: () => void;
  placeholder: string;
}

