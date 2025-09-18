import { Deal, DealFormData, DealFilters, DealSort, DealStatistics, DealPipeline, DealNote, DealActivity, DealStage, RawDealData, calculateExpectedRevenue, DEAL_STAGES } from '@/types/deals';

class DealService {
  private baseUrl = '/api';

  // CRUD Operations
  async getDeals(): Promise<Deal[]> {
    try {
      const response = await fetch(`${this.baseUrl}/crm-data.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch deals');
      }
      const data = await response.json();
      
      // Transform the existing deal data to match our new interface
      return data.deals.map((deal: RawDealData) => ({
        ...deal,
        createdAt: deal.createdAt || new Date().toISOString(),
        updatedAt: deal.updatedAt || new Date().toISOString(),
        expectedRevenue: calculateExpectedRevenue(deal.value, deal.probability),
        priority: deal.priority || 'Medium',
        status: deal.status || 'Active',
        notes: deal.notes || [],
        activities: deal.activities || []
      }));
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  }

  async getDealById(id: number): Promise<Deal | null> {
    try {
      const deals = await this.getDeals();
      return deals.find(deal => deal.id === id) || null;
    } catch (error) {
      console.error('Error fetching deal by ID:', error);
      throw error;
    }
  }

  async createDeal(dealData: DealFormData): Promise<Deal> {
    try {
      // In a real app, this would make a POST request to the server
      // For now, we'll simulate it by reading current data and adding the new deal
      const deals = await this.getDeals();
      const newId = Math.max(...deals.map(d => d.id), 0) + 1;
      
      const newDeal: Deal = {
        id: newId,
        ...dealData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expectedRevenue: calculateExpectedRevenue(dealData.value, dealData.probability),
        notes: [],
        activities: [{
          id: 1,
          dealId: newId,
          type: 'created',
          description: `Deal "${dealData.title}" created`,
          user: dealData.owner,
          timestamp: new Date().toISOString()
        }]
      };

      // In a real implementation, save to server
      await this.saveDealToServer(newDeal);
      
      return newDeal;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  }

  async updateDeal(id: number, dealData: Partial<DealFormData>): Promise<Deal> {
    try {
      const existingDeal = await this.getDealById(id);
      if (!existingDeal) {
        throw new Error('Deal not found');
      }

      const updatedDeal: Deal = {
        ...existingDeal,
        ...dealData,
        updatedAt: new Date().toISOString(),
        expectedRevenue: calculateExpectedRevenue(
          dealData.value || existingDeal.value,
          dealData.probability || existingDeal.probability
        )
      };

      // Add activity for the update
      const updateActivity: DealActivity = {
        id: (existingDeal.activities?.length || 0) + 1,
        dealId: id,
        type: 'updated',
        description: `Deal "${updatedDeal.title}" updated`,
        user: dealData.owner || existingDeal.owner,
        timestamp: new Date().toISOString(),
        metadata: { changes: dealData }
      };

      updatedDeal.activities = [...(existingDeal.activities || []), updateActivity];

      // In a real implementation, save to server
      await this.saveDealToServer(updatedDeal);
      
      return updatedDeal;
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  }

  async deleteDeal(id: number): Promise<void> {
    try {
      // In a real implementation, make DELETE request to server
      await fetch(`${this.baseUrl}/deals/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  }

  async moveDealToStage(id: number, newStage: DealStage): Promise<Deal> {
    try {
      const existingDeal = await this.getDealById(id);
      if (!existingDeal) {
        throw new Error('Deal not found');
      }

      // Auto-update probability based on stage
      let newProbability = existingDeal.probability;
      if (newStage === 'Closed Won') {
        newProbability = 100;
      } else if (newStage === 'Closed Lost') {
        newProbability = 0;
      }

      const updatedDeal: Deal = {
        ...existingDeal,
        stage: newStage,
        probability: newProbability,
        updatedAt: new Date().toISOString(),
        expectedRevenue: calculateExpectedRevenue(existingDeal.value, newProbability)
      };

      // Add activity for stage change
      const stageActivity: DealActivity = {
        id: (existingDeal.activities?.length || 0) + 1,
        dealId: id,
        type: 'stage_changed',
        description: `Deal moved from "${existingDeal.stage}" to "${newStage}"`,
        user: existingDeal.owner,
        timestamp: new Date().toISOString(),
        metadata: { oldStage: existingDeal.stage, newStage }
      };

      updatedDeal.activities = [...(existingDeal.activities || []), stageActivity];

      await this.saveDealToServer(updatedDeal);
      
      return updatedDeal;
    } catch (error) {
      console.error('Error moving deal to stage:', error);
      throw error;
    }
  }

  async updateDealProbability(id: number, probability: number): Promise<Deal> {
    try {
      const existingDeal = await this.getDealById(id);
      if (!existingDeal) {
        throw new Error('Deal not found');
      }

      // Auto-update stage if probability reaches 100%
      let newStage = existingDeal.stage;
      if (probability === 100 && existingDeal.stage !== 'Closed Won') {
        newStage = 'Closed Won';
      } else if (probability === 0 && existingDeal.stage !== 'Closed Lost') {
        newStage = 'Closed Lost';
      }

      const updatedDeal: Deal = {
        ...existingDeal,
        probability,
        stage: newStage,
        updatedAt: new Date().toISOString(),
        expectedRevenue: calculateExpectedRevenue(existingDeal.value, probability)
      };

      // Add activity for probability update
      const probabilityActivity: DealActivity = {
        id: (existingDeal.activities?.length || 0) + 1,
        dealId: id,
        type: 'probability_updated',
        description: `Deal probability updated from ${existingDeal.probability}% to ${probability}%`,
        user: existingDeal.owner,
        timestamp: new Date().toISOString(),
        metadata: { oldProbability: existingDeal.probability, newProbability: probability }
      };

      updatedDeal.activities = [...(existingDeal.activities || []), probabilityActivity];

      await this.saveDealToServer(updatedDeal);
      
      return updatedDeal;
    } catch (error) {
      console.error('Error updating deal probability:', error);
      throw error;
    }
  }

  // Notes Management
  async addDealNote(dealId: number, noteData: Omit<DealNote, 'id' | 'dealId' | 'createdAt'>): Promise<DealNote> {
    try {
      const deal = await this.getDealById(dealId);
      if (!deal) {
        throw new Error('Deal not found');
      }

      const newNote: DealNote = {
        id: (deal.notes?.length || 0) + 1,
        dealId,
        ...noteData,
        createdAt: new Date().toISOString()
      };

      const updatedDeal = {
        ...deal,
        notes: [...(deal.notes || []), newNote],
        updatedAt: new Date().toISOString()
      };

      // Add activity for note addition
      const noteActivity: DealActivity = {
        id: (deal.activities?.length || 0) + 1,
        dealId,
        type: 'note_added',
        description: `Note added to deal "${deal.title}"`,
        user: noteData.author,
        timestamp: new Date().toISOString()
      };

      updatedDeal.activities = [...(deal.activities || []), noteActivity];

      await this.saveDealToServer(updatedDeal);
      
      return newNote;
    } catch (error) {
      console.error('Error adding deal note:', error);
      throw error;
    }
  }

  // Filtering and Sorting
  filterDeals(deals: Deal[], filters: DealFilters): Deal[] {
    return deals.filter(deal => {
      // Stage filter
      if (filters.stage && filters.stage.length > 0 && !filters.stage.includes(deal.stage)) {
        return false;
      }

      // Owner filter
      if (filters.owner && filters.owner.length > 0 && !filters.owner.includes(deal.owner)) {
        return false;
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(deal.priority || 'Medium')) {
        return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0 && !filters.status.includes(deal.status || 'Active')) {
        return false;
      }

      // Value range filter
      if (filters.minValue !== undefined && deal.value < filters.minValue) {
        return false;
      }
      if (filters.maxValue !== undefined && deal.value > filters.maxValue) {
        return false;
      }

      // Probability range filter
      if (filters.minProbability !== undefined && deal.probability < filters.minProbability) {
        return false;
      }
      if (filters.maxProbability !== undefined && deal.probability > filters.maxProbability) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const closeDate = new Date(deal.closeDate);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (closeDate < startDate || closeDate > endDate) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const dealTags = deal.tags || [];
        if (!filters.tags.some(tag => dealTags.includes(tag))) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = `${deal.title} ${deal.company} ${deal.owner} ${deal.contactPerson || ''} ${deal.description || ''}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  sortDeals(deals: Deal[], sort: DealSort): Deal[] {
    return [...deals].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sort.field) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'company':
          aValue = a.company.toLowerCase();
          bValue = b.company.toLowerCase();
          break;
        case 'value':
          aValue = a.value;
          bValue = b.value;
          break;
        case 'probability':
          aValue = a.probability;
          bValue = b.probability;
          break;
        case 'closeDate':
          aValue = new Date(a.closeDate);
          bValue = new Date(b.closeDate);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'expectedRevenue':
          aValue = a.expectedRevenue || 0;
          bValue = b.expectedRevenue || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Statistics and Analytics
  calculateStatistics(deals: Deal[]): DealStatistics {
    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const totalExpectedRevenue = deals.reduce((sum, deal) => sum + (deal.expectedRevenue || 0), 0);
    const averageDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;
    const averageProbability = totalDeals > 0 ? deals.reduce((sum, deal) => sum + deal.probability, 0) / totalDeals : 0;

    const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
      acc[stage.id] = deals.filter(deal => deal.stage === stage.id).length;
      return acc;
    }, {} as Record<DealStage, number>);

    const dealsByOwner = deals.reduce((acc, deal) => {
      acc[deal.owner] = (acc[deal.owner] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const wonDealsThisMonth = deals.filter(deal => {
      const closeDate = new Date(deal.closeDate);
      return deal.stage === 'Closed Won' && 
             closeDate.getMonth() === currentMonth && 
             closeDate.getFullYear() === currentYear;
    }).length;

    const lostDealsThisMonth = deals.filter(deal => {
      const closeDate = new Date(deal.closeDate);
      return deal.stage === 'Closed Lost' && 
             closeDate.getMonth() === currentMonth && 
             closeDate.getFullYear() === currentYear;
    }).length;

    const totalClosedDeals = wonDealsThisMonth + lostDealsThisMonth;
    const conversionRate = totalClosedDeals > 0 ? (wonDealsThisMonth / totalClosedDeals) * 100 : 0;

    const pipelineValue = deals
      .filter(deal => deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost')
      .reduce((sum, deal) => sum + deal.value, 0);

    return {
      totalDeals,
      totalValue,
      totalExpectedRevenue,
      averageDealValue,
      averageProbability,
      dealsByStage,
      dealsByOwner,
      conversionRate,
      wonDealsThisMonth,
      lostDealsThisMonth,
      pipelineValue
    };
  }

  generatePipeline(deals: Deal[]): DealPipeline[] {
    return DEAL_STAGES.map(stage => {
      const stageDeals = deals.filter(deal => deal.stage === stage.id);
      const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
      const totalExpectedRevenue = stageDeals.reduce((sum, deal) => sum + (deal.expectedRevenue || 0), 0);
      const averageProbability = stageDeals.length > 0 
        ? stageDeals.reduce((sum, deal) => sum + deal.probability, 0) / stageDeals.length 
        : 0;

      return {
        stage: stage.id,
        deals: stageDeals,
        totalValue,
        totalExpectedRevenue,
        averageProbability,
        dealCount: stageDeals.length
      };
    });
  }

  // Helper method to simulate saving to server
  private async saveDealToServer(deal: Deal): Promise<void> {
    // In a real implementation, this would make an API call
    // For now, we'll just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real app, you might want to update the local cache or trigger a refetch
    console.log('Deal saved to server:', deal);
  }

  // Export/Import functionality
  async exportDeals(deals: Deal[], format: 'json' | 'csv' = 'json'): Promise<string> {
    const exportData = {
      deals,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Current User', // In a real app, get from auth context
      format
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // CSV export logic would go here
      const headers = ['ID', 'Title', 'Company', 'Value', 'Stage', 'Probability', 'Close Date', 'Owner'];
      const rows = deals.map(deal => [
        deal.id,
        deal.title,
        deal.company,
        deal.value,
        deal.stage,
        deal.probability,
        deal.closeDate,
        deal.owner
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}

export const dealService = new DealService();
export default dealService;