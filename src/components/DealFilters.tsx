import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  DealFilters as DealFiltersType,
  DealSort,
  DealStage,
  DealPriority,
  DEAL_STAGES,
  DEAL_PRIORITIES
} from '@/types/deals';
import { useDeals } from '@/contexts/DealContext';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DealFiltersProps {
  onFiltersChange?: (filters: DealFiltersType) => void;
  onSortChange?: (sort: DealSort) => void;
  className?: string;
}

export const DealFilters: React.FC<DealFiltersProps> = ({
  onFiltersChange,
  onSortChange,
  className
}) => {
  const { filters, sort, clearFilters, statistics } = useDeals();
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [ownerSearchOpen, setOwnerSearchOpen] = useState(false);
  const [companySearchOpen, setCompanySearchOpen] = useState(false);

  // Get unique owners and companies from statistics
  const uniqueOwners = statistics?.ownerStats?.map(stat => stat.owner) || [];
  const uniqueCompanies = statistics?.companyStats?.map(stat => stat.company) || [];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const newFilters = { ...filters, search: value || undefined };
    onFiltersChange?.(newFilters);
  };

  const handleStageFilter = (stage: DealStage, checked: boolean) => {
    const currentStages = filters.stage || [];
    const newStages = checked
      ? [...currentStages, stage]
      : currentStages.filter(s => s !== stage);
    
    const newFilters = {
      ...filters,
      stage: newStages.length > 0 ? newStages : undefined
    };
    onFiltersChange?.(newFilters);
  };

  const handlePriorityFilter = (priority: DealPriority, checked: boolean) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority);
    
    const newFilters = {
      ...filters,
      priority: newPriorities.length > 0 ? newPriorities : undefined
    };
    onFiltersChange?.(newFilters);
  };

  const handleOwnerFilter = (owner: string) => {
    const currentOwners = filters.owner || [];
    const isSelected = currentOwners.includes(owner);
    const newOwners = isSelected
      ? currentOwners.filter(o => o !== owner)
      : [...currentOwners, owner];
    
    const newFilters = {
      ...filters,
      owner: newOwners.length > 0 ? newOwners : undefined
    };
    onFiltersChange?.(newFilters);
  };

  const handleCompanyFilter = (company: string) => {
    // Note: company filter not defined in DealFilters interface
    // This functionality may need to be implemented differently
    console.warn('Company filter not supported in current DealFilters interface');
  };

  const handleValueRangeChange = (field: 'minValue' | 'maxValue', value: string) => {
    const numValue = parseFloat(value) || undefined;
    const newFilters = {
      ...filters,
      [field]: numValue
    };
    onFiltersChange?.(newFilters);
  };

  const handleProbabilityRangeChange = (field: 'minProbability' | 'maxProbability', value: string) => {
    const numValue = parseFloat(value) || undefined;
    const newFilters = {
      ...filters,
      [field]: numValue
    };
    onFiltersChange?.(newFilters);
  };

  const handleDateRangeChange = (field: 'start' | 'end', date: Date | undefined) => {
    const dateString = date?.toISOString().split('T')[0];
    const currentDateRange = filters.dateRange || { start: '', end: '' };
    
    const newFilters = {
      ...filters,
      dateRange: dateString ? {
        ...currentDateRange,
        [field]: dateString
      } : undefined
    };
    onFiltersChange?.(newFilters);
  };

  const handleSortChange = (field: string, direction?: 'asc' | 'desc') => {
    const newSort: DealSort = {
      field: field as DealSort['field'],
      direction: direction || (sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc')
    };
    onSortChange?.(newSort);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.stage?.length) count++;
    if (filters.priority?.length) count++;
    if (filters.owner?.length) count++;
    if (filters.minValue || filters.maxValue) count++;
    if (filters.minProbability || filters.maxProbability) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals by title, company, or owner..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Sort by:</span>
        {[
          { field: 'value', label: 'Value' },
          { field: 'probability', label: 'Probability' },
          { field: 'closeDate', label: 'Close Date' },
          { field: 'createdAt', label: 'Created' },
          { field: 'updatedAt', label: 'Updated' }
        ].map(({ field, label }) => (
          <Button
            key={field}
            variant={sort.field === field ? "default" : "outline"}
            size="sm"
            onClick={() => handleSortChange(field)}
            className="h-8"
          >
            {label}
            {sort.field === field && (
              sort.direction === 'asc' ? 
                <SortAsc className="h-3 w-3 ml-1" /> : 
                <SortDesc className="h-3 w-3 ml-1" />
            )}
          </Button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Advanced Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stage Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stages</Label>
              <div className="space-y-2">
                {DEAL_STAGES.map((stage) => (
                  <div key={stage.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stage-${stage.id}`}
                      checked={filters.stage?.includes(stage.id) || false}
                      onCheckedChange={(checked) => 
                        handleStageFilter(stage.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`stage-${stage.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {stage.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priorities</Label>
              <div className="space-y-2">
                {DEAL_PRIORITIES.map((priority) => (
                  <div key={priority.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority.id}`}
                      checked={filters.priority?.includes(priority.id) || false}
                      onCheckedChange={(checked) => 
                        handlePriorityFilter(priority.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`priority-${priority.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {priority.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Owners</Label>
              <Popover open={ownerSearchOpen} onOpenChange={setOwnerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={ownerSearchOpen}
                    className="w-full justify-between"
                  >
                    {filters.owner?.length ? 
                      `${filters.owner.length} selected` : 
                      "Select owners..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search owners..." />
                    <CommandEmpty>No owners found.</CommandEmpty>
                    <CommandGroup>
                      {uniqueOwners.map((owner) => (
                        <CommandItem
                          key={owner}
                          onSelect={() => handleOwnerFilter(owner)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.owner?.includes(owner) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {owner}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Company Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Companies</Label>
              <Popover open={companySearchOpen} onOpenChange={setCompanySearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={companySearchOpen}
                    className="w-full justify-between"
                  >
                    {"Company filter not available"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search companies..." />
                    <CommandEmpty>No companies found.</CommandEmpty>
                    <CommandGroup>
                      {uniqueCompanies.map((company) => (
                        <CommandItem
                          key={company}
                          onSelect={() => handleCompanyFilter(company)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              "opacity-0"
                            )}
                          />
                          {company}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Value Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Deal Value Range</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minValue || ''}
                  onChange={(e) => handleValueRangeChange('minValue', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxValue || ''}
                  onChange={(e) => handleValueRangeChange('maxValue', e.target.value)}
                />
              </div>
            </div>

            {/* Probability Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Probability Range (%)</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min"
                  value={filters.minProbability || ''}
                  onChange={(e) => handleProbabilityRangeChange('minProbability', e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Max"
                  value={filters.maxProbability || ''}
                  onChange={(e) => handleProbabilityRangeChange('maxProbability', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Close Date Range</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.dateRange?.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.start ? format(new Date(filters.dateRange.start), "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined}
                    onSelect={(date) => handleDateRangeChange('start', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !filters.dateRange?.end && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.end ? format(new Date(filters.dateRange.end), "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined}
                    onSelect={(date) => handleDateRangeChange('end', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => handleSearchChange('')}>
              Search: {filters.search} <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          
          {filters.stage?.map(stage => (
            <Badge key={stage} variant="secondary" className="cursor-pointer" onClick={() => handleStageFilter(stage, false)}>
              {DEAL_STAGES.find(s => s.id === stage)?.name} <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          
          {filters.priority?.map(priority => (
            <Badge key={priority} variant="secondary" className="cursor-pointer" onClick={() => handlePriorityFilter(priority, false)}>
              {DEAL_PRIORITIES.find(p => p.id === priority)?.name} <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          
          {filters.owner?.map(owner => (
            <Badge key={owner} variant="secondary" className="cursor-pointer" onClick={() => handleOwnerFilter(owner)}>
              {owner} <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          
          {/* Company filter removed - not supported in DealFilters interface */}
        </div>
      )}
    </div>
  );
};

export default DealFilters;