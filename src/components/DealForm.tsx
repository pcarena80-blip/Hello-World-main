import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Deal, DealFormData, DealStage, DealPriority, DEAL_STAGES, DEAL_PRIORITIES } from '@/types/deals';
import { useDeals } from '@/contexts/DealContext';
import { CalendarIcon, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const dealFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  company: z.string().min(1, 'Company is required').max(100, 'Company must be less than 100 characters'),
  value: z.number().min(0, 'Value must be positive').max(999999999, 'Value is too large'),
  stage: z.enum(['lead', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const),
  probability: z.number().min(0, 'Probability must be at least 0').max(100, 'Probability cannot exceed 100'),
  closeDate: z.date({
    required_error: 'Close date is required',
  }),
  owner: z.string().min(1, 'Owner is required').max(50, 'Owner must be less than 50 characters'),
  priority: z.enum(['low', 'medium', 'high'] as const).optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  tags: z.array(z.string()).optional(),
});

type DealFormValues = z.infer<typeof dealFormSchema>;

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  initialStage?: DealStage;
  onSuccess?: () => void;
}

export const DealForm: React.FC<DealFormProps> = ({
  open,
  onOpenChange,
  deal,
  initialStage,
  onSuccess
}) => {
  const { createDeal, updateDeal, loading } = useDeals();
  const [tagInput, setTagInput] = useState('');
  const [expectedRevenue, setExpectedRevenue] = useState(0);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: '',
      company: '',
      value: 0,
      stage: initialStage || 'lead',
      probability: 0,
      closeDate: new Date(),
      owner: '',
      priority: 'medium',
      description: '',
      tags: [],
    },
  });

  const watchedValue = form.watch('value');
  const watchedProbability = form.watch('probability');
  const watchedTags = form.watch('tags') || [];

  // Calculate expected revenue when value or probability changes
  useEffect(() => {
    const value = watchedValue || 0;
    const probability = watchedProbability || 0;
    setExpectedRevenue((value * probability) / 100);
  }, [watchedValue, watchedProbability]);

  // Auto-update stage based on probability
  useEffect(() => {
    const probability = watchedProbability;
    const currentStage = form.getValues('stage');
    
    if (probability === 100 && currentStage !== 'closed_won') {
      form.setValue('stage', 'closed_won');
    } else if (probability === 0 && currentStage !== 'closed_lost') {
      form.setValue('stage', 'closed_lost');
    } else if (probability > 0 && probability < 100) {
      if (currentStage === 'closed_won' || currentStage === 'closed_lost') {
        if (probability >= 75) {
          form.setValue('stage', 'negotiation');
        } else if (probability >= 50) {
          form.setValue('stage', 'proposal');
        } else {
          form.setValue('stage', 'lead');
        }
      }
    }
  }, [watchedProbability, form]);

  // Reset form when dialog opens/closes or deal changes
  useEffect(() => {
    if (open) {
      if (deal) {
        // Editing existing deal
        form.reset({
          title: deal.title,
          company: deal.company,
          value: deal.value,
          stage: deal.stage,
          probability: deal.probability,
          closeDate: new Date(deal.closeDate),
          owner: deal.owner,
          priority: deal.priority,
          description: deal.description || '',
          tags: deal.tags || [],
        });
      } else {
        // Creating new deal
        form.reset({
          title: '',
          company: '',
          value: 0,
          stage: initialStage || 'lead',
          probability: initialStage === 'lead' ? 10 : initialStage === 'proposal' ? 25 : initialStage === 'negotiation' ? 50 : 0,
          closeDate: new Date(),
          owner: '',
          priority: 'medium',
          description: '',
          tags: [],
        });
      }
    }
  }, [open, deal, initialStage, form]);

  const onSubmit = async (values: DealFormValues) => {
    try {
      const dealData: DealFormData = {
        ...values,
        closeDate: values.closeDate.toISOString().split('T')[0],
        expectedRevenue,
      };

      if (deal) {
        await updateDeal(deal.id, dealData);
      } else {
        await createDeal(dealData);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      const newTags = [...watchedTags, tagInput.trim()];
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter(tag => tag !== tagToRemove);
    form.setValue('tags', newTags);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {deal ? 'Edit Deal' : 'Create New Deal'}
          </DialogTitle>
          <DialogDescription>
            {deal ? 'Update the deal information below.' : 'Fill in the details to create a new deal.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter deal title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0"
                          className="pl-9"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Owner *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter owner name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_STAGES.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability (%) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      <Progress value={watchedProbability} className="mt-1" />
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_PRIORITIES.map((priority) => (
                          <SelectItem key={priority.id} value={priority.id}>
                            {priority.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="closeDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Close Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter deal description or notes"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description or notes about the deal.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchedTags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Expected Revenue Display */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expected Revenue:</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(expectedRevenue)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Calculated as: {formatCurrency(watchedValue || 0)} × {watchedProbability || 0}%
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : deal ? 'Update Deal' : 'Create Deal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DealForm;