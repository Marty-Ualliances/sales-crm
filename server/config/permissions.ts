import type { UserRole } from '../models/User.js';

/**
 * RBAC permission map.
 * Maps resource.action to an array of roles that are allowed.
 */
export const PERMISSIONS: Record<string, UserRole[]> = {
    // Leads
    'leads.upload': ['admin', 'lead_gen', 'manager'],
    'leads.assign': ['admin', 'lead_gen', 'manager'],
    'leads.viewOwn': ['admin', 'lead_gen', 'sdr', 'closer', 'manager', 'hr'],
    'leads.viewAll': ['admin', 'manager', 'hr'],
    'leads.edit': ['admin', 'sdr', 'closer', 'manager'],
    'leads.delete': ['admin'],
    'leads.moveStage': ['admin', 'sdr', 'closer', 'manager'],

    // Activities
    'activities.create': ['admin', 'lead_gen', 'sdr', 'closer', 'manager'],
    'activities.viewAll': ['admin', 'manager', 'hr'],

    // Analytics
    'analytics.viewTeam': ['admin', 'manager', 'hr'],
    'analytics.view_all': ['admin', 'manager', 'hr'],

    // Users
    'users.manage': ['admin', 'hr'],

    // Teams
    'teams.manage': ['admin', 'manager'],

    // Pipeline
    'pipeline.manageStages': ['admin'],
};
