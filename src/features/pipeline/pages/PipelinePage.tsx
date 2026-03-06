'use client';

import { useState } from 'react';
import { usePipelineBoard, useUpdateLeadStage } from '../hooks/usePipeline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download, DollarSign, GripVertical } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable, useDraggable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { format } from 'date-fns';

function KanbanCard({ lead }: { lead: any }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead._id,
    data: { lead },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group min-h-[100px] touch-none"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <h4 className="font-semibold text-sm line-clamp-1 pr-6">{lead.firstName} {lead.lastName}</h4>
      <p className="text-xs text-muted-foreground mt-0.5">{lead.companyName || lead.phone || lead.email}</p>

      <div className="mt-3 flex items-center justify-between">
        {lead.assignedTo ? (
          <div className="flex items-center gap-1.5" title={lead.assignedTo.name}>
            {lead.assignedTo.avatar ? (
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                {lead.assignedTo.avatar}
              </div>
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                {lead.assignedTo.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{lead.assignedTo.name}</span>
          </div>
        ) : (
          <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal">Unassigned</Badge>
        )}

        <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
          <DollarSign className="h-3 w-3 mr-0.5" />
          {lead.dealValue?.toLocaleString() || 0}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ col }: { col: any }) {
  const { setNodeRef, isOver } = useDroppable({
    id: col._id,
    data: { stageId: col._id, stageName: col.name },
  });

  return (
    <div className="min-w-[280px] max-w-[280px] flex-shrink-0 flex flex-col pt-1">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color || '#3B82F6' }} />
          <h3 className="font-semibold text-sm">{col.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">${(col.totalValue || 0).toLocaleString()}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium">{col.count}</Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2.5 space-y-2.5 transition-colors duration-200 ${isOver ? 'bg-secondary/50 border-2 border-dashed border-primary/50' : 'bg-muted/30 border-2 border-transparent'
          }`}
      >
        {col.leads.map((lead: any) => (
          <KanbanCard key={lead._id} lead={lead} />
        ))}
        {col.leads.length === 0 && (
          <div className="h-full min-h-[100px] flex items-center justify-center p-4 border border-dashed border-border/50 rounded-lg text-center opacity-50">
            <span className="text-xs text-muted-foreground">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { data: board = [], isLoading } = usePipelineBoard();
  const updateStageMutation = useUpdateLeadStage();
  const [activeLead, setActiveLead] = useState<any>(null);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleExport = () => {
    const exportData = board.flatMap(col =>
      col.leads.map(lead => ({
        Name: `${lead.firstName} ${lead.lastName}`,
        Company: lead.companyName || '',
        Phone: lead.phone || '',
        Email: lead.email || '',
        Stage: col.name,
        AssignedTo: lead.assignedTo?.name || 'Unassigned',
        DealValue: (lead as any).dealValue || 0,
        Created: format(new Date(lead.createdAt || Date.now()), 'yyyy-MM-dd')
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pipeline');

    const date = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(workbook, `Pipeline_Export_${date}.xlsx`);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveLead(active.data.current?.lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;

    if (!over) return;

    const leadId = active.id as string;
    const currentLead = active.data.current?.lead;
    if (!currentLead) return;
    const newStageId = over.id as string;
    const newStageName = over.data.current?.stageName;

    const currentStageId = typeof currentLead.pipelineStage === 'object' ? currentLead.pipelineStage?._id : currentLead.pipelineStage;
    if (currentStageId !== newStageId) {
      // In a real app, if moving to Won/Lost, we might want to pop up a modal.
      // For now, we perform the mutation. If it fails validation (e.g. lostReason missing),
      // the API will reject it. Since this is an MVP kanban board, we could prompt for details
      // using a dialog when dropping into the final column. For simplicity, we just mutate.
      let extra = {};
      if (newStageName === 'Lost') extra = { lostReason: 'Moved to lost from Kanban' };

      updateStageMutation.mutate({ leadId, stageId: newStageId, ...extra });
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Interactive kanban view of your lead funnel</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 -mx-1 px-1">
        {!isLoading && board.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No pipeline stages found. Run `npm run seed:stages` or refresh after server auto-seeding.
          </div>
        )}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-h-[500px]">
            {board.map((col) => (
              <KanbanColumn key={col._id} col={col} />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="w-[280px] opacity-90 scale-105 shadow-xl rotate-2">
                <KanbanCard lead={activeLead} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
