/**
 * Backend pipeline constants — mirrors the default seed pipeline stages.
 * Used in models + routes to keep stage values in sync.
 */

export const PIPELINE_STAGES = [
    'New',
    'Contacted',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Won',
    'Lost'
] as const;

export type PipelineStageKey = typeof PIPELINE_STAGES[number];

/** Stages that trigger auto-recording flag on calls */
export const RECORDING_FLAG_STAGES: PipelineStageKey[] = ['Won'];

/** Terminal stages (lead is done) */
export const TERMINAL_STAGES: PipelineStageKey[] = ['Won', 'Lost'];
