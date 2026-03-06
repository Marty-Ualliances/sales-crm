import { z } from 'zod';

export const leadBodySchema = z.object({
    firstName: z.string().max(100).optional().or(z.literal('')),
    lastName: z.string().max(100).optional().or(z.literal('')),
    email: z.string().email().max(254).optional().or(z.literal('')),
    phone: z.string().max(100).optional().or(z.literal('')),
    company: z.string().max(100).optional().or(z.literal('')),
    jobTitle: z.string().max(100).optional().or(z.literal('')),
    status: z.enum(['New Lead', 'In Progress', 'Contacted', 'Appointment Set', 'Active Account']).optional(),
    source: z.string().max(100).optional(),
    pipelineStage: z.string().length(24, 'Invalid ObjectId').optional().or(z.literal('').transform(() => undefined)).or(z.null()),
    dealValue: z.number().min(0).max(999999999).optional().or(z.string().regex(/^\d+$/).transform(Number)),
    expectedCloseDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), 'Invalid date'),
    website: z.string().max(200).optional(),
    address: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    notes: z.string().max(10000).optional(),
    assignedTo: z.string().length(24, 'Invalid ObjectId').optional().or(z.literal('').transform(() => undefined)).or(z.null()),
    assignedAgent: z.string().max(100).optional(),
}); // Zod's default is .strip() so extraneous fields will be removed

export const createLeadSchema = z.object({
    body: leadBodySchema,
    query: z.any(),
    params: z.any(),
});

export const updateLeadSchema = z.object({
    body: leadBodySchema,
    query: z.any(),
    params: z.object({ id: z.string().length(24).optional() }).passthrough(),
});
