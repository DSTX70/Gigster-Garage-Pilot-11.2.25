# Gigster Garage Audit Export

**Export Date:** January 2, 2026  
**Environment:** Development  
**Version:** 1.0.0

---

## 1. Runtime + Deployment State

### Health Endpoints
- **GET /api/health** - Service health check
- **GET /api/version** - Version information
- **GET /api/system/status** - Integration status

**Current Status:**
```json
{
  "ok": true,
  "service": "GigsterGarage",
  "version": "1.0.0",
  "uptimeSeconds": 3686
}
```

### Integration Status:
| Integration | Status |
|-------------|--------|
| Database | Enabled (PostgreSQL/Neon) |
| AI | Enabled (OpenAI GPT-4o) |
| Object Storage | Enabled (Replit) |
| DTH Connector | Enabled |
| Email (SendGrid) | Not Configured |
| SMS (Twilio) | Not Configured |
| Stripe | Not Configured |
| Slack | Not Configured |

### Logs
- `runtime/server_logs.log` - Server application logs with structured JSON logging
- `runtime/browser_console.log` - Browser console output

### Known Issues (Browser Console)
- WebSocket fallback error: `wss://localhost:undefined` - Vite HMR fallback issue (dev-only, non-blocking)

---

## 2. Database Reality

### Storage Mode
Currently using **in-memory storage (MemStorage)** for development. PostgreSQL database is provisioned but may not be actively populated.

### Schema Tables (38 total)
See `database/schema_tables.json` for full list.

Key tables:
- `users` - User accounts with auth, profile, subscription data
- `tasks` - Task management with priority, due dates, assignments
- `projects` - Project containers
- `clients` - Client/customer management
- `invoices` - Invoice management
- `proposals` - Business proposals with AI generation
- `timeLogs` - Time tracking entries
- `socialQueue` - Social media post queue
- `gigsterCoachInteractions` - AI coach conversations
- `platformCredentials` - Social media platform credentials

### Demo Data
- Demo user: `demo` / `demo123`
- Demo sessions expire after configured period
- Demo data isolated via `isDemo` and `demoSessionId` fields

---

## 3. Integrations

### Configured Secrets (Names Only)
See `integrations/configured_secrets.json`

**Present:**
- SESSION_SECRET
- DATABASE_URL (+ PG connection params)
- OPENAI_API_KEY
- PRIVATE_OBJECT_DIR
- DTH_READONLY_TOKEN
- I3_REPO_OPS_TOKEN
- DRIVE_STEWARD_TOKEN/URL

**Missing for Full Features:**
- INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_ACCOUNT_ID
- LINKEDIN_ACCESS_TOKEN
- X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET

---

## 4. UX Evidence Pack

### Screenshots Captured:
1. **Landing Page** (`/`) - Hero section with "Get Started Free", "View Pricing", "Sign In"
2. **Login Page** (`/login`) - Username/password form with demo credentials
3. **Pricing Page** (`/pricing`) - Three-tier pricing: Core ($0-$9), Plus ($19), Pro ($39)
4. **Register Page** (`/register`) - Redirects to landing (registration via Get Started)

### Key UI Observations:
- Lume + Nova branding: Navy (#0B1D3A) header, Mint (#2EC5C2) primary actions, Amber (#FFB52E) for warnings
- Floating Action Button (FAB) in bottom-right corner
- Clean pricing comparison matrix with feature toggles
- Demo account credentials displayed on login page

### Authenticated Routes (require login):
- `/home` - Dashboard home
- `/tasks` - Task management
- `/invoices` - Invoice builder
- `/proposals` - Proposal creation
- `/settings` - User settings
- `/settings/connections` - Platform connections
- `/filing-cabinet` - Document storage
- `/monitoring` - Production monitoring dashboard
- `/admin/*` - Admin routes (role-gated)

---

## 5. Deployment Configuration

```json
{
  "deployment_target": "autoscale",
  "build": ["npm", "run", "build"],
  "run": ["npm", "run", "start"]
}
```

---

## Files in This Export:
```
audit_export/
├── manifest.json
├── README_export.md
├── runtime/
│   ├── server_logs.log
│   ├── browser_console.log
│   └── health_endpoints.json
├── database/
│   └── schema_tables.json
├── integrations/
│   └── configured_secrets.json
└── ux/
    └── (screenshots inline - not exported as files)
```
