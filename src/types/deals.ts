// Deal Stage Types
export type DealStage = 'Lead' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

export interface DealStageConfig {
  id: DealStage;
  name: string;
  color: string;
  order: number;
  description: string;
}

// Deal Priority Types
export type DealPriority = 'Low' | 'Medium' | 'High' | 'Critical';

// Deal Status Types
export type DealStatus = 'Active' | 'On Hold' | 'Cancelled' | 'Completed';

// Main Deal Interface
export interface Deal {
  id: number;
  title: string;
  company: string;
  value: number;
  stage: DealStage;
  probability: number; // 0-100
  closeDate: string; // ISO date string
  owner: string;
  priority?: DealPriority;
  status?: DealStatus;
  description?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  expectedRevenue?: number; // Calculated: value * (probability / 100)
  tags?: string[];
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  source?: string;
  notes?: DealNote[];
  activities?: DealActivity[];
}

// Deal Note Interface
export interface DealNote {
  id: number;
  dealId: number;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  type?: 'note' | 'meeting' | 'call' | 'email' | 'task';
}

// Deal Activity Interface
export interface DealActivity {
  id: number;
  dealId: number;
  type: 'created' | 'updated' | 'stage_changed' | 'note_added' | 'meeting_scheduled' | 'call_made' | 'email_sent' | 'probability_updated' | 'value_updated';
  description: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
}

// Raw Deal Data Interface (for API responses)
export interface RawDealData {
  id?: number;
  title?: string;
  company?: string;
  value?: number;
  stage?: string;
  probability?: number;
  closeDate?: string;
  owner?: string;
  priority?: string;
  status?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  expectedRevenue?: number;
  tags?: string[];
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  source?: string;
  notes?: DealNote[];
  activities?: DealActivity[];
}

// Deal Form Data Interface
export interface DealFormData {
  title?: string;
  company?: string;
  value?: number;
  stage?: DealStage;
  probability?: number;
  closeDate: string;
  owner?: string;
  priority?: DealPriority;
  status?: DealStatus;
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  source?: string;
  tags?: string[];
  expectedRevenue?: number;
}

// Deal Filter Interface
export interface DealFilters {
  stage?: DealStage[];
  owner?: string[];
  priority?: DealPriority[];
  status?: DealStatus[];
  minValue?: number;
  maxValue?: number;
  minProbability?: number;
  maxProbability?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  search?: string;
}

// Deal Sort Options
export type DealSortField = 'title' | 'company' | 'value' | 'probability' | 'closeDate' | 'createdAt' | 'updatedAt' | 'expectedRevenue';
export type DealSortDirection = 'asc' | 'desc';

export interface DealSort {
  field: DealSortField;
  direction: DealSortDirection;
}

// Deal Statistics Interface
export interface DealStatistics {
  totalDeals: number;
  totalValue: number;
  totalExpectedRevenue: number;
  averageDealValue: number;
  averageProbability: number;
  dealsByStage: Record<DealStage, number>;
  dealsByOwner: Record<string, number>;
  conversionRate: number;
  wonDealsThisMonth: number;
  lostDealsThisMonth: number;
  pipelineValue: number;
  ownerStats?: Array<{ owner: string; count: number; totalValue: number }>;
  companyStats?: Array<{ company: string; count: number; totalValue: number }>;
}

// Deal Pipeline Interface
export interface DealPipeline {
  stage: DealStage;
  deals: Deal[];
  totalValue: number;
  totalExpectedRevenue: number;
  averageProbability: number;
  dealCount: number;
}

// Deal Context Interface for React Context
export interface DealContextType {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  filters: DealFilters;
  sort: DealSort;
  statistics: DealStatistics | null;
  pipeline: DealPipeline[];
  
  // Actions
  createDeal: (dealData: DealFormData) => Promise<Deal>;
  updateDeal: (id: number, dealData: Partial<DealFormData>) => Promise<Deal>;
  deleteDeal: (id: number) => Promise<void>;
  moveDealToStage: (id: number, stage: DealStage) => Promise<Deal>;
  updateDealProbability: (id: number, probability: number) => Promise<Deal>;
  addDealNote: (dealId: number, note: Omit<DealNote, 'id' | 'dealId' | 'createdAt'>) => Promise<DealNote>;
  
  // Filters and Sorting
  setFilters: (filters: Partial<DealFilters>) => void;
  setSort: (sort: DealSort) => void;
  clearFilters: () => void;
  
  // Data fetching
  refreshDeals: () => Promise<void>;
  loadDealStatistics: () => Promise<void>;
}

// Deal API Response Types
export interface DealApiResponse {
  success: boolean;
  data?: Deal;
  error?: string;
  message?: string;
}

export interface DealsApiResponse {
  success: boolean;
  data?: Deal[];
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Deal Validation Errors
export interface DealValidationErrors {
  title?: string;
  company?: string;
  value?: string;
  stage?: string;
  probability?: string;
  closeDate?: string;
  owner?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Deal Export/Import Types
export interface DealExportData {
  deals: Deal[];
  exportedAt: string;
  exportedBy: string;
  format: 'json' | 'csv' | 'xlsx';
}

export interface DealImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// Deal Stage Configuration
export const DEAL_STAGES: DealStageConfig[] = [
  {
    id: 'Lead',
    name: 'Lead',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    order: 1,
    description: 'Initial contact and qualification'
  },
  {
    id: 'Proposal',
    name: 'Proposal',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    order: 2,
    description: 'Proposal sent and under review'
  },
  {
    id: 'Negotiation',
    name: 'Negotiation',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    order: 3,
    description: 'Active negotiation and discussion'
  },
  {
    id: 'Closed Won',
    name: 'Closed Won',
    color: 'bg-green-100 text-green-800 border-green-200',
    order: 4,
    description: 'Deal successfully closed'
  },
  {
    id: 'Closed Lost',
    name: 'Closed Lost',
    color: 'bg-red-100 text-red-800 border-red-200',
    order: 5,
    description: 'Deal lost or cancelled'
  }
];

// Deal Priority Configuration
export const DEAL_PRIORITIES: Array<{ id: DealPriority; name: string; color: string }> = [
  { id: 'Low', name: 'Low', color: 'bg-gray-100 text-gray-800' },
  { id: 'Medium', name: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'High', name: 'High', color: 'bg-orange-100 text-orange-800' },
  { id: 'Critical', name: 'Critical', color: 'bg-red-100 text-red-800' }
];

// Utility Functions
export const calculateExpectedRevenue = (value: number, probability: number): number => {
  return Math.round(value * (probability / 100));
};

export const getDealStageConfig = (stage: DealStage): DealStageConfig | undefined => {
  return DEAL_STAGES.find(s => s.id === stage);
};

export const getNextStage = (currentStage: DealStage): DealStage | null => {
  const currentConfig = getDealStageConfig(currentStage);
  if (!currentConfig) return null;
  
  const nextConfig = DEAL_STAGES.find(s => s.order === currentConfig.order + 1);
  return nextConfig ? nextConfig.id : null;
};

export const getPreviousStage = (currentStage: DealStage): DealStage | null => {
  const currentConfig = getDealStageConfig(currentStage);
  if (!currentConfig) return null;
  
  const prevConfig = DEAL_STAGES.find(s => s.order === currentConfig.order - 1);
  return prevConfig ? prevConfig.id : null;
};

export const isClosedStage = (stage: DealStage): boolean => {
  return stage === 'Closed Won' || stage === 'Closed Lost';
};

export const isActiveStage = (stage: DealStage): boolean => {
  return !isClosedStage(stage);
};