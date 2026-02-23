/**
 * Backend pipeline constants — mirrors src/constants/pipeline.ts
 * Used in models + routes to keep stage values in sync.
 */

export const PIPELINE_STAGES = [
    'New Lead',
    'Working',
    'Connected',
    'Qualified',
    'Meeting Booked',
    'Meeting Completed',
    'Proposal Sent',
    'Negotiation',
    'Closed Won',
    'Closed Lost',
    'Nurture',
] as const;

export type PipelineStageKey = typeof PIPELINE_STAGES[number];

/** Stages that trigger auto-recording flag on calls */
export const RECORDING_FLAG_STAGES: PipelineStageKey[] = ['Meeting Completed', 'Negotiation', 'Closed Won'];

/** Terminal stages (lead is done) */
export const TERMINAL_STAGES: PipelineStageKey[] = ['Closed Won', 'Closed Lost', 'Nurture'];
