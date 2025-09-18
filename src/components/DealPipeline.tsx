import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Deal, DealStage, DEAL_STAGES, getDealStageConfig, calculateExpectedRevenue } from '@/types/deals';
import { useDeals } from '@/contexts/DealContext';
import {
  MoreVertical,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  Plus,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealPipelineProps {
  onEditDeal?: (deal: Deal) => void;
  onViewDeal?: (deal: Deal) => void;
  onCreateDeal?: (stage?: DealStage) => void;
}

export const DealPipeline: React.FC<DealPipelineProps> = ({
  onEditDeal,
  onViewDeal,
  onCreateDeal
}) => {
  const { pipeline, moveDealToStage, deleteDeal, loading } = useDeals();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const dealId = parseInt(draggableId);
    const newStage = destination.droppableId as DealStage;

    try {
      await moveDealToStage(dealId, newStage);
    } catch (error) {
      console.error('Error moving deal:', error);
    }
  };

  const handleDeleteDeal = (deal: Deal) => {
    setDealToDelete(deal);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDeal = async () => {
    if (dealToDelete) {
      try {
        await deleteDeal(dealToDelete.id);
        setDeleteDialogOpen(false);
        setDealToDelete(null);
      } catch (error) {
        console.error('Error deleting deal:', error);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {DEAL_STAGES.map((stage) => {
            const stagePipeline = pipeline.find(p => p.stage === stage.id);
            const deals = stagePipeline?.deals || [];
            const stageConfig = getDealStageConfig(stage.id);

            return (
              <div key={stage.id} className="flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{stage.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCreateDeal?.(stage.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Deals:</span>
                      <span className="font-medium">{deals.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Value:</span>
                      <span className="font-medium">
                        {formatCurrency(stagePipeline?.totalValue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected:</span>
                      <span className="font-medium">
                        {formatCurrency(stagePipeline?.totalExpectedRevenue || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 space-y-3 p-2 rounded-lg border-2 border-dashed transition-colors min-h-[200px]",
                        snapshot.isDraggingOver
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      )}
                    >
                      {deals.map((deal, index) => (
                        <Draggable
                          key={deal.id}
                          draggableId={deal.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "cursor-move transition-shadow",
                                snapshot.isDragging && "shadow-lg"
                              )}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm font-medium truncate">
                                      {deal.title}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {deal.company}
                                    </p>
                                  </div>
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onViewDeal?.(deal);
                                        }}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditDeal?.(deal);
                                        }}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Deal
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteDeal(deal);
                                        }}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Deal
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="pt-0 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1 text-xs">
                                    <DollarSign className="h-3 w-3" />
                                    <span className="font-medium">
                                      {formatCurrency(deal.value)}
                                    </span>
                                  </div>
                                  
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      stageConfig?.color
                                    )}
                                  >
                                    {deal.probability}%
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Probability</span>
                                    <span>{deal.probability}%</span>
                                  </div>
                                  <Progress value={deal.probability} className="h-1" />
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-1 text-muted-foreground">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>
                                      {formatCurrency(deal.expectedRevenue || 0)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1 text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(deal.closeDate)}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src="" alt={deal.owner} />
                                      <AvatarFallback className="text-xs">
                                        {getInitials(deal.owner)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">
                                      {deal.owner}
                                    </span>
                                  </div>
                                  
                                  {deal.priority && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {deal.priority?.name || deal.priority || 'medium'}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {deals.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <div className="text-sm">No deals in this stage</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCreateDeal?.(stage.id)}
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Deal
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the deal "{dealToDelete?.title}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteDeal}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DealPipeline;