import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Deal, DealFormData, DealFilters, DealSort, DealStatistics, DealPipeline, DealNote, DealContextType, DealStage } from '@/types/deals';
import { dealService } from '@/services/dealService';
import { useToast } from '@/hooks/use-toast';

// Action types for the reducer
type DealAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DEALS'; payload: Deal[] }
  | { type: 'ADD_DEAL'; payload: Deal }
  | { type: 'UPDATE_DEAL'; payload: Deal }
  | { type: 'DELETE_DEAL'; payload: number }
  | { type: 'SET_FILTERS'; payload: DealFilters }
  | { type: 'SET_SORT'; payload: DealSort }
  | { type: 'SET_STATISTICS'; payload: DealStatistics }
  | { type: 'SET_PIPELINE'; payload: DealPipeline[] }
  | { type: 'CLEAR_FILTERS' };

// Initial state
interface DealState {
  deals: Deal[];
  loading: boolean;
  error: string | null;
  filters: DealFilters;
  sort: DealSort;
  statistics: DealStatistics | null;
  pipeline: DealPipeline[];
}

const initialState: DealState = {
  deals: [],
  loading: false,
  error: null,
  filters: {},
  sort: { field: 'updatedAt', direction: 'desc' },
  statistics: null,
  pipeline: []
};

// Reducer function
function dealReducer(state: DealState, action: DealAction): DealState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_DEALS':
      return { ...state, deals: action.payload, loading: false, error: null };
    
    case 'ADD_DEAL':
      return { ...state, deals: [...state.deals, action.payload] };
    
    case 'UPDATE_DEAL':
      return {
        ...state,
        deals: state.deals.map(deal => 
          deal.id === action.payload.id ? action.payload : deal
        )
      };
    
    case 'DELETE_DEAL':
      return {
        ...state,
        deals: state.deals.filter(deal => deal.id !== action.payload)
      };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    
    case 'SET_STATISTICS':
      return { ...state, statistics: action.payload };
    
    case 'SET_PIPELINE':
      return { ...state, pipeline: action.payload };
    
    case 'CLEAR_FILTERS':
      return { ...state, filters: {} };
    
    default:
      return state;
  }
}

// Create context
const DealContext = createContext<DealContextType | undefined>(undefined);

// Provider component
export const DealProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dealReducer, initialState);
  const { toast } = useToast();

  // Get filtered and sorted deals
  const getFilteredAndSortedDeals = useCallback(() => {
    const filteredDeals = dealService.filterDeals(state.deals, state.filters);
    return dealService.sortDeals(filteredDeals, state.sort);
  }, [state.deals, state.filters, state.sort]);

  // Load deals from API
  const refreshDeals = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const deals = await dealService.getDeals();
      dispatch({ type: 'SET_DEALS', payload: deals });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load deals';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Load statistics
  const loadDealStatistics = useCallback(async () => {
    try {
      const statistics = dealService.calculateStatistics(state.deals);
      dispatch({ type: 'SET_STATISTICS', payload: statistics });
      
      const pipeline = dealService.generatePipeline(state.deals);
      dispatch({ type: 'SET_PIPELINE', payload: pipeline });
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  }, [state.deals]);

  // Create deal
  const createDeal = useCallback(async (dealData: DealFormData): Promise<Deal> => {
    try {
      const newDeal = await dealService.createDeal(dealData);
      dispatch({ type: 'ADD_DEAL', payload: newDeal });
      
      toast({
        title: 'Success',
        description: `Deal "${newDeal.title}" created successfully`
      });
      
      return newDeal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create deal';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Update deal
  const updateDeal = useCallback(async (id: number, dealData: Partial<DealFormData>): Promise<Deal> => {
    try {
      const updatedDeal = await dealService.updateDeal(id, dealData);
      dispatch({ type: 'UPDATE_DEAL', payload: updatedDeal });
      
      toast({
        title: 'Success',
        description: `Deal "${updatedDeal.title}" updated successfully`
      });
      
      return updatedDeal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update deal';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Delete deal
  const deleteDeal = useCallback(async (id: number): Promise<void> => {
    try {
      await dealService.deleteDeal(id);
      dispatch({ type: 'DELETE_DEAL', payload: id });
      
      toast({
        title: 'Success',
        description: 'Deal deleted successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete deal';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Move deal to stage
  const moveDealToStage = useCallback(async (id: number, stage: DealStage): Promise<Deal> => {
    try {
      const updatedDeal = await dealService.moveDealToStage(id, stage);
      dispatch({ type: 'UPDATE_DEAL', payload: updatedDeal });
      
      toast({
        title: 'Success',
        description: `Deal moved to "${stage}" stage`
      });
      
      return updatedDeal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move deal';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Update deal probability
  const updateDealProbability = useCallback(async (id: number, probability: number): Promise<Deal> => {
    try {
      const updatedDeal = await dealService.updateDealProbability(id, probability);
      dispatch({ type: 'UPDATE_DEAL', payload: updatedDeal });
      
      toast({
        title: 'Success',
        description: `Deal probability updated to ${probability}%`
      });
      
      return updatedDeal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update probability';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  // Add deal note
  const addDealNote = useCallback(async (dealId: number, note: Omit<DealNote, 'id' | 'dealId' | 'createdAt'>): Promise<DealNote> => {
    try {
      const newNote = await dealService.addDealNote(dealId, note);
      
      // Update the deal in state to include the new note
      const deal = state.deals.find(d => d.id === dealId);
      if (deal) {
        const updatedDeal = {
          ...deal,
          notes: [...(deal.notes || []), newNote]
        };
        dispatch({ type: 'UPDATE_DEAL', payload: updatedDeal });
      }
      
      toast({
        title: 'Success',
        description: 'Note added successfully'
      });
      
      return newNote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add note';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  }, [state.deals, toast]);

  // Set filters
  const setFilters = useCallback((filters: Partial<DealFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  // Set sort
  const setSort = useCallback((sort: DealSort) => {
    dispatch({ type: 'SET_SORT', payload: sort });
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  // Load deals on mount
  useEffect(() => {
    refreshDeals();
  }, [refreshDeals]);

  // Update statistics when deals change
  useEffect(() => {
    if (state.deals.length > 0) {
      loadDealStatistics();
    }
  }, [state.deals, loadDealStatistics]);

  // Context value
  const contextValue: DealContextType = {
    deals: getFilteredAndSortedDeals(),
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    sort: state.sort,
    statistics: state.statistics,
    pipeline: state.pipeline,
    
    // Actions
    createDeal,
    updateDeal,
    deleteDeal,
    moveDealToStage,
    updateDealProbability,
    addDealNote,
    
    // Filters and Sorting
    setFilters,
    setSort,
    clearFilters,
    
    // Data fetching
    refreshDeals,
    loadDealStatistics
  };

  return (
    <DealContext.Provider value={contextValue}>
      {children}
    </DealContext.Provider>
  );
};

// Hook to use the deal context
export const useDeals = (): DealContextType => {
  const context = useContext(DealContext);
  if (context === undefined) {
    throw new Error('useDeals must be used within a DealProvider');
  }
  return context;
};

export default DealContext;