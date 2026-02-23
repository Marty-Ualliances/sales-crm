module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
}),
"[project]/src/components/ui/tooltip.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Tooltip",
    ()=>Tooltip,
    "TooltipContent",
    ()=>TooltipContent,
    "TooltipProvider",
    ()=>TooltipProvider,
    "TooltipTrigger",
    ()=>TooltipTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-tooltip/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
const TooltipProvider = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Provider"];
const Tooltip = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"];
const TooltipTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Trigger"];
const TooltipContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, sideOffset = 4, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"], {
        ref: ref,
        sideOffset: sideOffset,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/tooltip.tsx",
        lineNumber: 16,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
TooltipContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$tooltip$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Content"].displayName;
;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/services/api/client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getToken",
    ()=>getToken,
    "request",
    ()=>request
]);
const API_BASE = '/api';
const REQUEST_TIMEOUT = 30_000; // 30 seconds
function getToken() {
    return localStorage.getItem('insurelead_token');
}
async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), REQUEST_TIMEOUT);
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal
        });
        if (res.status === 401) {
            localStorage.removeItem('insurelead_token');
            localStorage.removeItem('insurelead_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            throw new Error('Unauthorized');
        }
        if (!res.ok) {
            const body = await res.json().catch(()=>({}));
            throw new Error(body.error || `Request failed: ${res.status}`);
        }
        return res.json();
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw err;
    } finally{
        clearTimeout(timeoutId);
    }
}
}),
"[project]/src/features/auth/api/auth.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authApi",
    ()=>authApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const authApi = {
    login: (email, password)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password
            })
        }),
    me: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/auth/me'),
    impersonate: (userId)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/auth/impersonate', {
            method: 'POST',
            body: JSON.stringify({
                userId
            })
        }),
    forgotPassword: (email)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({
                email
            })
        }),
    resetPassword: (token, password)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                token,
                password
            })
        }),
    changePassword: (currentPassword, newPassword)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        })
};
}),
"[project]/src/features/leads/api/leads.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "leadsApi",
    ()=>leadsApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const leadsApi = {
    list: (params)=>{
        const q = new URLSearchParams();
        if (params?.status) q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        if (params?.agent) q.set('agent', params.agent);
        const qs = q.toString();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/leads${qs ? `?${qs}` : ''}`);
    },
    kpis: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/leads/kpis'),
    get: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/leads/${id}`),
    create: (data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/leads', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id, data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/leads/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/leads/${id}`, {
            method: 'DELETE'
        }),
    importCSV: async (file)=>{
        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getToken"])();
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/leads/import', {
            method: 'POST',
            headers: {
                ...token ? {
                    Authorization: `Bearer ${token}`
                } : {}
            },
            body: formData
        });
        if (!res.ok) {
            const body = await res.json().catch(()=>({}));
            throw new Error(body.error || 'Import failed');
        }
        return res.json();
    },
    completeFollowUp: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/leads/${id}/complete-followup`, {
            method: 'POST'
        }),
    scheduleFollowUp: (id, date)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/leads/${id}/schedule-followup`, {
            method: 'POST',
            body: JSON.stringify({
                date
            })
        }),
    bulkAssign: (leadIds, agentName)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/leads/bulk-assign', {
            method: 'POST',
            body: JSON.stringify({
                leadIds,
                agentName
            })
        }),
    bulkDelete: (leadIds)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/leads/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({
                leadIds
            })
        }),
    funnel: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/leads/funnel')
};
}),
"[project]/src/features/calls/api/calls.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "callsApi",
    ()=>callsApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const callsApi = {
    list: (params)=>{
        const q = new URLSearchParams();
        if (params?.status) q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        const qs = q.toString();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/calls${qs ? `?${qs}` : ''}`);
    },
    get: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/calls/${id}`),
    create: (data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/calls', {
            method: 'POST',
            body: JSON.stringify(data)
        })
};
}),
"[project]/src/features/agents/api/agents.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "agentsApi",
    ()=>agentsApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const agentsApi = {
    list: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/agents'),
    get: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/agents/${id}`),
    create: (data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/agents', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id, data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/agents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/agents/${id}`, {
            method: 'DELETE'
        })
};
}),
"[project]/src/features/meetings/api/meetings.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "meetingsApi",
    ()=>meetingsApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const meetingsApi = {
    list: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/meetings'),
    create: (data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/meetings', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id, data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/meetings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/meetings/${id}`, {
            method: 'DELETE'
        })
};
}),
"[project]/src/features/notifications/api/notifications.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "notificationsApi",
    ()=>notificationsApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const notificationsApi = {
    list: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/notifications'),
    markRead: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/notifications/${id}/read`, {
            method: 'PUT'
        }),
    markAllRead: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/notifications/read-all', {
            method: 'PUT'
        })
};
}),
"[project]/src/features/notes/api/notes.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "notesApi",
    ()=>notesApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const notesApi = {
    list: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/notes'),
    create: (content)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/notes', {
            method: 'POST',
            body: JSON.stringify({
                content
            })
        }),
    update: (id, content)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                content
            })
        }),
    delete: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/notes/${id}`, {
            method: 'DELETE'
        })
};
}),
"[project]/src/features/hr/api/hr.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hrApi",
    ()=>hrApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const hrApi = {
    dashboard: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/hr/dashboard'),
    leads: (params)=>{
        const q = new URLSearchParams();
        if (params?.status) q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        if (params?.agent) q.set('agent', params.agent);
        const qs = q.toString();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/hr/leads${qs ? `?${qs}` : ''}`);
    },
    closedLeads: (params)=>{
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.agent) q.set('agent', params.agent);
        const qs = q.toString();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/hr/closed-leads${qs ? `?${qs}` : ''}`);
    }
};
}),
"[project]/src/features/calendar/api/tasks.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "tasksApi",
    ()=>tasksApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const tasksApi = {
    list: (params)=>{
        const q = new URLSearchParams();
        if (params?.assignedTo) q.set('assignedTo', params.assignedTo);
        if (params?.status) q.set('status', params.status);
        if (params?.from) q.set('from', params.from);
        if (params?.to) q.set('to', params.to);
        if (params?.priority) q.set('priority', params.priority);
        const qs = q.toString();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/tasks${qs ? `?${qs}` : ''}`);
    },
    get: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/tasks/${id}`),
    create: (data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/tasks', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id, data)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])(`/tasks/${id}`, {
            method: 'DELETE'
        })
};
}),
"[project]/src/services/api/health.api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "healthApi",
    ()=>healthApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/client.ts [app-ssr] (ecmascript)");
;
const healthApi = {
    check: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["request"])('/health')
};
}),
"[project]/src/services/api/index.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "api",
    ()=>api
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$api$2f$auth$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auth/api/auth.api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$leads$2f$api$2f$leads$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/leads/api/leads.api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$calls$2f$api$2f$calls$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/calls/api/calls.api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$agents$2f$api$2f$agents$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/agents/api/agents.api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$meetings$2f$api$2f$meetings$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/meetings/api/meetings.api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$notifications$2f$api$2f$notifications$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/notifications/api/notifications.api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$notes$2f$api$2f$notes$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/notes/api/notes.api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$hr$2f$api$2f$hr$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/hr/api/hr.api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$calendar$2f$api$2f$tasks$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/calendar/api/tasks.api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$health$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/health.api.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
const api = {
    auth: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$api$2f$auth$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authApi"],
    leads: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$leads$2f$api$2f$leads$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["leadsApi"],
    calls: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$calls$2f$api$2f$calls$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["callsApi"],
    agents: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$agents$2f$api$2f$agents$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["agentsApi"],
    notifications: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$notifications$2f$api$2f$notifications$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationsApi"],
    notes: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$notes$2f$api$2f$notes$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notesApi"],
    hr: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$hr$2f$api$2f$hr$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hrApi"],
    tasks: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$calendar$2f$api$2f$tasks$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["tasksApi"],
    meetings: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$meetings$2f$api$2f$meetings$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["meetingsApi"],
    health: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$health$2e$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["healthApi"].check
};
}),
"[project]/src/features/auth/context/AuthContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/api/index.ts [app-ssr] (ecmascript)");
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        const stored = localStorage.getItem('insurelead_user');
        return stored ? JSON.parse(stored) : null;
    });
    // Verify token on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const token = localStorage.getItem('insurelead_token');
        if (token && !user) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.me().then((u)=>{
                setUser(u);
                localStorage.setItem('insurelead_user', JSON.stringify(u));
            }).catch(()=>{
                localStorage.removeItem('insurelead_token');
                localStorage.removeItem('insurelead_user');
                document.cookie = 'insurelead_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                setUser(null);
            });
        }
    }, []);
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (email, password)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"].auth.login(email, password);
            setUser(result.user);
            localStorage.setItem('insurelead_token', result.token);
            localStorage.setItem('insurelead_user', JSON.stringify(result.user));
            document.cookie = `insurelead_token=${result.token}; path=/; max-age=604800; samesite=lax`;
            return {
                success: true,
                role: result.user.role
            };
        } catch (err) {
            return {
                success: false,
                error: err.message || 'Invalid email or password'
            };
        }
    }, []);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setUser(null);
        localStorage.removeItem('insurelead_token');
        localStorage.removeItem('insurelead_user');
        document.cookie = 'insurelead_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
    }, [
        router
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            isAuthenticated: !!user,
            login,
            logout
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/features/auth/context/AuthContext.tsx",
        lineNumber: 62,
        columnNumber: 5
    }, this);
}
function useAuth() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
}),
"[project]/src/app/providers.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/tooltip.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/auth/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function Providers({ children }) {
    const [queryClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QueryClient"]({
            defaultOptions: {
                queries: {
                    staleTime: 60 * 1000,
                    refetchOnWindowFocus: false
                }
            }
        }));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QueryClientProvider"], {
        client: queryClient,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$tooltip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TooltipProvider"], {
            delayDuration: 300,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$auth$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AuthProvider"], {
                children: children
            }, void 0, false, {
                fileName: "[project]/src/app/providers.tsx",
                lineNumber: 21,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/providers.tsx",
            lineNumber: 20,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/providers.tsx",
        lineNumber: 19,
        columnNumber: 9
    }, this);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__bdf5c2ec._.js.map