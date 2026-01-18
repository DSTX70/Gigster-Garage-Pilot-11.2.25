# Gigster Garage - Simplified Workflow Hub

## Overview

Gigster Garage is a comprehensive time tracker and workflow management system built with a full-stack TypeScript architecture. Its purpose is to provide a clean, intuitive interface for creating, managing, and tracking tasks with advanced features. Key capabilities include Custom Fields, Workflow Automation, Team Collaboration, AI-powered content generation, and an integrated Garage Assistant UI. The application features an enhanced invoice builder with auto-fill functionality and streamlined workflow automation, adhering to a monorepo structure with a React frontend, Express.js backend, and PostgreSQL database. The system follows a consistent Garage Navy branding. The business vision is to deliver a robust, intuitive, and efficient workflow hub, with market potential in professional services, small to medium-sized businesses, and individual freelancers seeking advanced productivity tools. The project ambitions include becoming a leading platform for integrated workflow management and intelligent task automation.

**Production Status**: All Phase 2 features are complete and production-ready, including Platform Connections UI, Advanced Monitoring Dashboard, and deployment configuration for autoscale publishing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The application incorporates the Lume + Nova branding system with a carefully structured accent hierarchy:
- **Mint (#2EC5C2)**: Primary actions, progress bars, completed states
- **Navy (#0B1D3A)**: Selected/active states in filter pills, toggles, and navigation
- **Amber (#FFB52E)**: Reserved exclusively for Due Soon warnings
- **Red**: Overdue items only (thick 4px left borders + red text/icons)
- **Neutral grays**: Medium priority, on-hold status, non-urgent controls

Card emphasis follows Nova principles: only Overdue items use thick borders; all other cards use subtle 1px gray borders. Controls are quieter with shrunk segmented controls (h-9/h-7 with text-xs), neutral backgrounds, and tighter spacing.

The application features an enhanced invoice builder with auto-fill, a redesigned Workflow Automation page, and integrated Garage Assistant UI. Project dashboards include Kanban boards and Gantt chart timeline views, adapting to screen sizes. Recent enhancements include a global Command Palette (Cmd+K/Ctrl+K) for quick search and actions, a centralized Settings/Preferences page, a keyboard shortcuts guide (?), a floating Quick Action Button (FAB), an Offline Mode Indicator, and a reusable Empty States Component.

**Phase 2 Production Features**:
- **Platform Connections Page** (`/settings/connections`): User-friendly interface for managing social media API credentials (X/Twitter, Instagram, LinkedIn) with save/delete/test functionality, secure credential input, and platform-specific setup instructions.
- **Advanced Monitoring Dashboard** (`/monitoring`): Real-time production monitoring with SLO metrics (error rate, queue age, rate limit saturation), queue statistics with visual charts, system health indicators, and configurable auto-refresh intervals (10s/30s/60s).
- **Deployment Configuration**: Autoscale deployment mode configured with build and run commands, ready for one-click publishing to production.

### Technical Implementations

The project is a full-stack TypeScript monorepo.
The frontend is built with React, using TailwindCSS with shadcn/ui for styling, TanStack Query for state management, Wouter for routing, and React Hook Form with Zod for form handling. Vite is used for building.
The backend uses Express.js with TypeScript in an ESM module setup, employing Drizzle ORM for database integration and Zod for shared validation schemas. It follows a RESTful API design.
Security features include a two-tier resource permission model (OWNED/SHARED), admin override capabilities, server-side recalculation of financial data to prevent tampering, and a three-tier plan enforcement model (Free, Pro, Enterprise) with feature gating via `requirePlan` middleware.

### Feature Specifications

-   **Time Tracking**: Comprehensive time tracking with project allocation and productivity reporting.
-   **Workflow Automation**: Custom rules and automation engine with a visual builder.
-   **AI Content Generation**: Proposal and content creation using stable AI models (GPT-4o).
-   **Invoice Builder**: Auto-fill functionality for company and client information. Browser-free PDF generation via pdfkit (`server/pdfkitService.ts`) for autoscale-compatible production deployments.
-   **Task Management**: Advanced features including priority, due dates, assignments, notes, attachments, intelligent reminders, subtask hierarchies, and circular dependency prevention.
-   **Agent KPI Tracking**: Monitoring system with automated graduation tracking and real-time Hub API integration.
-   **Agent Exposure Policy**: Policy-based agent governance system with autonomy levels (L0/L1), exposure rules, and promotion criteria defined in `policy/agent_exposure_policy.json`.
-   **Pricing & Feature Flags**: Environment-aware feature flags and a three-tier pricing comparison matrix.
-   **Notifications**: Email (SendGrid) and SMS (Twilio) notifications.
-   **User Management**: Multi-user authentication, role-based access, guided onboarding system (under 10 minutes setup), and an admin dashboard.
-   **Guided Onboarding System**: Streamlined 3-minute quick-start flow (`/quick-start`) collecting business essentials, dedicated brand development wizard (`/settings/brand`) with asset management, brand identity builder, and AI-powered brand wizard. Enforces completion before app access with intelligent redirect logic preventing race conditions.
-   **Business Profile Onboarding Wizard** (`/onboarding-wizard`): Comprehensive 6-step wizard for AI Coach personalization collecting role, goals, business basics, stage, offerings, workflow, and pain points. Features 650ms debounced autosave, resume support, and chip-based multi-select inputs. Profile data is used by GigsterCoach for personalized suggestions. Data stored in `user_profiles`, `business_profiles`, and `onboarding_progress` database tables. Post-wizard editing available at `/settings/profile`.
-   **Social Queue System**: End-to-end social media posting pipeline with webhook integration, database-backed queue, rate limiting, media pre-flight validation and caching, audit logging, and admin operations for managing posts and monitoring rate limits.
-   **Platform Connections Management**: Secure credential storage and management for social media platforms (X/Twitter, Instagram, LinkedIn) with encrypted storage, connection testing, and user-friendly setup interface.
-   **Production Monitoring**: Advanced monitoring dashboard with real-time SLO metrics, queue statistics, visual charts, system health indicators, and auto-refresh capabilities for production operations.
-   **Health/Version Endpoint**: Public `GET /api/health` and `GET /api/version` endpoints returning service status, version, build metadata (sha, time), storageMode, uptime, and timestamp. Version displayed in Settings page footer.
-   **Tier 0 Stability Audit (Jan 2026)**: Implemented 5 stability fixes: (1) Vite HMR config for Replit with clientPort/protocol settings, (2) Build metadata injection with BUILD_SHA/BUILD_TIME env vars, (3) Route-level error tracking in Admin Diagnostics with topFailingRoutes/errorsByStatusCode, (4) Cache metrics exposed in diagnostics, (5) StorageModeBanner component showing in-memory mode warnings.
-   **Tier 1 Navigation Audit (Jan 2026)**: (1) Created NavigationMap (`client/src/navigation/navigation-map.ts`) as single source of truth for routes, labels, icons, permissions, and plan gates with 7 navigation groups. (2) Fixed Help menu Keyboard Shortcuts to trigger dialog overlay via `openKeyboardShortcuts()` instead of broken route.
-   **Tier 2 UX Polish Audit (Jan 2026)**: (1) Removed hard-coded Messages badge (was showing misleading "0"). (2) Created reusable `EmptyState` and `EmptyStateCard` components (`client/src/components/ui/empty-state.tsx`). (3) Created shared `PageHeader` component (`client/src/components/ui/page-header.tsx`) with responsive layout and action slots. (4) Enhanced `QuickActionButton` with keyboard shortcut support (press N key to open menu from anywhere).
-   **Tier 3 Feature Integrity Audit (Jan 2026)**: (1) Extended `/api/system/status` to return detailed integration info with `enables[]` and `missingSecrets[]` arrays. (2) Added test-email and test-sms endpoints with UI integration in IntegrationDashboard. (3) Invoice send graceful degradation: disabled button with tooltip when email not configured, suggests PDF download as fallback. (4) Social posting gating: SocialQueuePage shows warning alert when platforms unconfigured, links to connections settings. (5) Created `useIntegrationStatus` hook (`client/src/hooks/useIntegrationStatus.ts`) for centralized integration status management.
-   **Tier 4 Security and Permissions Hardening (Jan 2026)**: (1) Environment-aware secure session cookies with `secure=true` in production (detected via `NODE_ENV`, `REPLIT_DEPLOYMENT`, or `REPLIT_DEV_DOMAIN`), `httpOnly=true`, and `sameSite='lax'`. (2) Trust proxy enabled in production for correct client IP detection. (3) Removed mobile route authentication bypass; unauthenticated mobile users now redirect to `/login?next=<encoded_path>` with safe query validation. (4) Belt-and-suspenders admin protection using `requireAdmin` middleware consistently on all admin endpoints including diagnostics. (5) NavigationMap marks admin-only routes with `rolesAllowed: ['admin']`.
-   **DTH Read-only Connector**: Token-protected `POST /api/dth/files` endpoint allowing DreamTeamHub to fetch files (read-only) from whitelisted paths (`client/`, `server/`, `shared/`, `docs/`). Requires `DTH_READONLY_TOKEN` environment variable. See `docs/DTH_READONLY_CONNECTOR_INSTALL.md`.
-   **GigsterCoach**: AI business coach module (`/gigster-coach`) with three modes: Ask (general Q&A), Draft (content generation for invoices/proposals/contracts), and Review (completeness checklists). Features plan-gated access (Pro+ for proactive suggestions), policy-governed autonomy (L0/L1), conversation history persistence, and embedded coach capabilities for builders. Contracts defined in `shared/contracts/gigsterCoach.ts`.
    -   **v1.1 Suggestions Inbox** (`/gigster-coach/suggestions`): Persistent inbox for coach suggestions with apply/dismiss actions. Database-backed (`gigster_coach_suggestions` table) with user ownership enforcement.
    -   **v1.2 Apply Engine**: Typed, whitelisted action system for safe field modifications. Client executes, server validates. Contracts in `shared/contracts/applyEngine.ts`. Supports `append_text`, `insert_text`, `replace_text`, and `add_line_item` actions on whitelisted targets (invoice.terms, proposal.scope, etc.).
    -   **CoachSidebar Component**: Embeddable sidebar (`client/src/components/gigsterCoach/CoachSidebar.tsx`) for invoice/proposal/message editors with ask/draft/review modes and inline suggestion handling.

### System Design Choices

The application uses PostgreSQL with Drizzle ORM for its database, providing type safety and managed migrations. Authentication is session-based with bcrypt password hashing. The project uses npm for package management, Vite for development with hot module replacement, and ESLint/Prettier for code quality. A professional TypeScript client package (`@gigster-garage/api-client`) is available for API integration. Comprehensive demo materials, including an interactive HTML tutorial and an automated video demo, are provided for onboarding and training.

**Production Deployment**: Configured for autoscale deployment with build command `npm run build` and run command `npm run start`. All production monitoring, credential management, and social posting features are production-ready and tested. Comprehensive production guide available at `docs/PRODUCTION_READY_GUIDE.md`.

**User Documentation**: A user-friendly guide is available at `docs/USER_GUIDE.md` covering getting started, navigation, core features, keyboard shortcuts, and troubleshooting. A comprehensive technical manual is also available at `docs/USER_MANUAL.md`.

## External Dependencies

-   **@neondatabase/serverless**: PostgreSQL database connection.
-   **drizzle-orm** & **drizzle-kit**: ORM and migration tools.
-   **express**: Node.js web framework.
-   **react** & **react-dom**: Core React libraries.
-   **@tanstack/react-query**: Server state management.
-   **@radix-ui/***: Accessible UI primitives.
-   **tailwindcss**: CSS framework.
-   **lucide-react**: Icon library.
-   **vite**: Build tool.
-   **typescript**: Static type checking.
-   **zod**: Schema validation.
-   **react-hook-form**: Forms library.
-   **date-fns**: Date manipulation library.
-   **wouter**: Routing library.
-   **openai**: OpenAI API integration (using GPT-4o).
-   **SendGrid**: Email notifications.
-   **Twilio**: SMS notifications.
-   **pdfkit**: Browser-free PDF generation for invoices, proposals, contracts, and presentations.