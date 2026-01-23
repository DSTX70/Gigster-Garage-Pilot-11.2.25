# Gigster Garage - Simplified Workflow Hub

## Overview

Gigster Garage is a comprehensive time tracker and workflow management system built with a full-stack TypeScript architecture. Its purpose is to provide a clean, intuitive interface for creating, managing, and tracking tasks with advanced features. Key capabilities include Custom Fields, Workflow Automation, Team Collaboration, AI-powered content generation, and an integrated Garage Assistant UI. The application features an enhanced invoice builder with auto-fill functionality and streamlined workflow automation, adhering to a monorepo structure with a React frontend, Express.js backend, and PostgreSQL database. The business vision is to deliver a robust, intuitive, and efficient workflow hub, with market potential in professional services, small to medium-sized businesses, and individual freelancers seeking advanced productivity tools, aiming to become a leading platform for integrated workflow management and intelligent task automation. All Phase 2 features are complete and production-ready.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The application incorporates the Lume + Nova branding system with a structured accent hierarchy: Mint for primary actions, Navy for selected states, Amber for Due Soon warnings, and Red exclusively for overdue items. Neutral grays are used for medium priority and non-urgent controls. Card emphasis follows Nova principles, using subtle 1px gray borders except for Overdue items. Controls are quieter with shrunk segmented controls, neutral backgrounds, and tighter spacing.

The application features an enhanced invoice builder with auto-fill, a redesigned Workflow Automation page, and integrated Garage Assistant UI. Project dashboards include Kanban boards and Gantt chart timeline views, adapting to screen sizes. Recent enhancements include a global Command Palette (Cmd+K/Ctrl+K), a centralized Settings/Preferences page, a keyboard shortcuts guide (?), a floating Quick Action Button (FAB), an Offline Mode Indicator, and a reusable Empty States Component. Phase 2 features include a Platform Connections Page for managing social media API credentials and an Advanced Monitoring Dashboard for real-time production monitoring.

### Technical Implementations

The project is a full-stack TypeScript monorepo. The frontend is built with React, TailwindCSS with shadcn/ui, TanStack Query, Wouter, and React Hook Form with Zod, using Vite for building. The backend uses Express.js with TypeScript in an ESM module setup, employing Drizzle ORM for database integration and Zod for shared validation schemas, following a RESTful API design. Security features include a two-tier resource permission model, admin override capabilities, server-side recalculation of financial data, and a three-tier plan enforcement model (Free, Pro, Enterprise) with feature gating. Production deployment is configured for autoscale.

### Feature Specifications

-   **Time Tracking**: Comprehensive time tracking with project allocation and productivity reporting.
-   **Workflow Automation**: Custom rules and automation engine with a visual builder.
-   **AI Content Generation**: Proposal and content creation using stable AI models (GPT-4o).
-   **Invoice Builder**: Auto-fill functionality and browser-free PDF generation via pdfkit.
-   **Task Management**: Advanced features including priority, due dates, assignments, notes, attachments, intelligent reminders, subtask hierarchies, and circular dependency prevention.
-   **Agent KPI Tracking**: Monitoring system with automated graduation tracking and real-time Hub API integration.
-   **Agent Exposure Policy**: Policy-based agent governance system with autonomy levels (L0/L1), exposure rules, and promotion criteria.
-   **Pricing & Feature Flags**: Environment-aware feature flags and a three-tier pricing comparison matrix.
-   **Notifications**: Email (SendGrid) and SMS (Twilio) notifications.
-   **User Management**: Multi-user authentication, role-based access (admin/user/tester), guided onboarding, and an admin dashboard. Includes a special Tester Login mode for QA.
-   **Guided Onboarding System**: Streamlined quick-start flow, brand development wizard, and AI-powered brand wizard. Business Profile Onboarding Wizard for AI Coach personalization with autosave, resume support, and enhanced session handling.
-   **Social Queue System**: End-to-end social media posting pipeline with webhook integration, database-backed queue, rate limiting, media pre-flight validation, and audit logging.
-   **Platform Connections Management**: Secure credential storage and management for social media platforms.
-   **Production Monitoring**: Advanced monitoring dashboard with real-time SLO metrics, queue statistics, visual charts, system health indicators, and auto-refresh capabilities.
-   **Health/Version Endpoint**: Public `GET /api/health` and `GET /api/version` endpoints returning service status and build metadata.
-   **System Audits**: Stability, Navigation, UX Polish, and Feature Integrity audits implemented, including error tracking, cache metrics, integration status hooks, and graceful degradation for unconfigured services.
-   **Security and Permissions Hardening**: Environment-aware secure session cookies, trust proxy for correct IP detection, consistent admin protection middleware, and role-based navigation.
-   **DTH Read-only Connector**: Token-protected endpoint for DreamTeamHub to fetch read-only files from whitelisted paths.
-   **DTH Registry System**: Database-backed admin interface for managing DreamTeamHub connections with CRUD operations, health monitoring, sync logging, access logging, and dashboard statistics.
-   **GigsterCoach**: AI business coach module with Ask, Draft, and Review modes. Features plan-gated access, policy-governed autonomy, conversation history, suggestions inbox with apply/dismiss actions, and an apply engine for safe field modifications. Includes an embeddable CoachSidebar component.

### System Design Choices

The application uses PostgreSQL with Drizzle ORM for its database, providing type safety and managed migrations. Authentication is session-based with bcrypt password hashing. The project uses npm for package management, Vite for development, and ESLint/Prettier for code quality. A professional TypeScript client package (`@gigster-garage/api-client`) is available for API integration. Comprehensive demo materials are provided for onboarding and training.

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
-   **openai**: OpenAI API integration.
-   **SendGrid**: Email notifications.
-   **Twilio**: SMS notifications.
-   **pdfkit**: Browser-free PDF generation.