import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';

// We map common path prefixes to their respective Mongoose models for fetching old values.
const entityModelMap: Record<string, string> = {
    'leads': 'Lead',
    'calls': 'Call',
    'meetings': 'Meeting',
    'outreach': 'Outreach',
    'users': 'User',
    'agents': 'User',
    'auth': 'User'
};

export const auditLogMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Only log modifying actions
    if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
        return next();
    }

    // Determine entity based on baseUrl or path (e.g. /api/leads -> leads)
    const pathParts = req.baseUrl ? req.baseUrl.split('/') : req.path.split('/');
    const baseEntity = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];

    let entityType = entityModelMap[baseEntity] || 'Unknown';
    let entityId = req.params.id || req.params.leadId || req.body.id || req.body.leadId;

    // Track the original send method to capture the new value (the response body)
    // Limit capture to 64KB to prevent memory bloat from large responses
    const MAX_CAPTURE_SIZE = 64 * 1024;
    const originalSend = res.send;
    let responseBody: any;
    res.send = function (body) {
        if (typeof body === 'string' && body.length <= MAX_CAPTURE_SIZE) {
            responseBody = body;
        } else if (Buffer.isBuffer(body) && body.length <= MAX_CAPTURE_SIZE) {
            responseBody = body.toString('utf-8');
        }
        // Skip capture for oversized responses
        return originalSend.apply(this, arguments as any);
    };

    try {
        let oldValue = undefined;
        let action = req.method; // POST, PUT, DELETE, etc.

        // If it's a specific action like bulk-assign or impersonate, override
        if (req.path.includes('impersonate')) action = 'IMPERSONATE';
        else if (req.path.includes('bulk')) action = 'BULK_UPDATE';

        if (entityId && mongoose.models[entityType] && req.method !== 'POST') {
            try {
                const doc = await mongoose.models[entityType].findById(entityId).lean();
                if (doc) oldValue = doc;
            } catch (err) {
                // ID might not be a valid objectId or model not found, ignore reliably
            }
        }

        res.on('finish', () => {
            // Only log successful modifications
            if (res.statusCode >= 200 && res.statusCode < 300) {
                let newValue = undefined;
                try {
                    if (responseBody) {
                        const parsed = JSON.parse(responseBody);
                        // Sometimes the entity is nested, we just store what we can
                        newValue = parsed;
                    }
                } catch (e) {
                    // If response isn't JSON, leave it undefined
                }

                const userId = (req as any).user?.id || (req as any).user?._id || 'anonymous';
                const userEmail = (req as any).user?.email || 'anonymous';

                // Fire-and-forget with explicit error handling to prevent unhandled rejections
                AuditLog.create({
                    action,
                    userId,
                    adminId: userId, // Backwards compat
                    adminEmail: userEmail,
                    entityType,
                    entityId,
                    timestamp: new Date(),
                    oldValue,
                    newValue,
                    ip: req.ip,
                    targetId: entityId
                }).catch((err) => {
                    console.error('Audit log write failed:', err.message);
                });
            }
        });

        next();
    } catch (error) {
        next(error);
    }
};
