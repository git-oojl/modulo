# Project Bible — Modulo

**Version:** 1.2 compact  
**Baseline date:** October 2, 2026  
**Status:** core concept and architecture frozen

---

## 1. Purpose and definition

**Modulo** is a modular, API-first real estate operations platform that brings the following into a system the company controls:

- contacts and prospects;
- agents and users;
- properties and photos;
- appointments, activity, and follow-up;
- operational oversight;
- a basic public property catalog;
- responsive web access, installable as a PWA.

Its purpose is to give a real estate company control over its data and operations without making the business structurally dependent on a franchise, property portal, or external vendor.

Modulo **is not intended to become a massive sales CRM, ERP, marketplace, or all-in-one marketing suite**. It should be useful enough for a real-world real estate operation while remaining small enough to finish, maintain, and extend properly.

This Bible defines the product, its architecture, its boundaries, and its technical criteria. It is not a project schedule, task assignment, or guide to academic deliverables.

---

## 2. Official elevator pitch

Modulo is a real estate company’s own operations platform: it brings clients, agents, properties, appointments, and follow-up into a system the company controls. Agents manage their work, while management gains visibility into day-to-day operations. The same property inventory can power a public catalog and future integrations without handing the source of truth over to third parties.

## 3. Non-negotiable principles

1. **Data and business logic are the durable assets.** The interface is replaceable.
2. **PostgreSQL is the source of truth** for Modulo’s core data.
3. **Angular is a client of the platform**, not where critical business rules live.
4. **Integrations surround the core; they do not own it.** No portal, calendar, messaging service, or external vendor may become a requirement for accessing or retaining core data.
5. **Branding is configuration, not architecture.** Modulo can run under one brand today and another tomorrow without rebuilding the domain model.
6. **Prefer the simplest maintainable solution** that preserves sound architecture.
7. **Optional features must be removable or toggleable without breaking the core.**
8. **Useful history is preserved.** Important business records should be archived rather than deleted whenever reasonable.
9. **Portability matters:** core data must be exportable and vendors must be replaceable.
10. **New ideas are not in scope by default.** If an idea significantly expands the product or introduces unnecessary dependency, it is treated as a future extension.

Priority when tradeoffs arise:

1. data integrity;
2. backend architecture;
3. security and permissions;
4. real operational workflow;
5. API;
6. usability;
7. visual presentation;
8. PWA;
9. integrations;
10. experimental features.

---

## 4. Architecture

Modulo will be a **modular monolith with a REST API**.

```text
Angular / PWA / future clients
              ↓
          REST API v1
              ↓
        Django + DRF
        ↙     ↓      ↘
PostgreSQL  Storage  Integrations
```

There will be a single deployable Django backend, internally divided by domain. Microservices and separate databases per module will not be introduced without a real need.

### Preferred monorepo structure

```text
/
├── frontend/      Angular
├── backend/       Django
├── infra/         Docker and deployment
└── docs/          architecture and decisions
```

The frontend and backend remain independently separable applications even if they share a repository.

### Backend domains

```text
backend/
├── core/
├── organizations/
├── accounts/
├── contacts/
├── properties/
├── appointments/
└── integrations/
```

- `core`: shared utilities and infrastructure.
- `organizations`: identity, time zone, language, currency, and module configuration.
- `accounts`: users, profiles, authentication, and permissions.
- `contacts`: prospects and clients.
- `properties`: inventory and media.
- `appointments`: appointments, activity, and follow-up.
- `integrations`: external adapters.

Initially, there will be a single organization. The organization concept is retained to decouple system identity, **not to build a full multi-tenant SaaS product**.

---

## 5. Technology stack

### Frontend

- Angular **21.x LTS**, kept on its latest patched minor release. It receives
  critical and security fixes through June 2027.
- TypeScript **>=5.9.0 <6.0.0**, and RxJS **^6.5.3 or ^7.4.0**, matching the
  Angular 21 compatibility matrix.
- Node.js **22.23.3 LTS** (the existing Volta default), with future updates
  limited to the 22.x line. It is compatible with Angular 21 and receives
  security updates through April 2027; no Node 24 installation is required.
- npm supplied by the selected Node LTS release + committed `package-lock.json`.
- Angular Router
- Reactive Forms
- HttpClient
- Angular Material
- SCSS/CSS + CSS variables for theming
- Transloco
- `@angular/pwa`
- Capacitor, only as a later mobile extension

### Backend

- Python **3.12.x**, kept on the latest available security patch. Python 3.12
  receives security fixes through October 2028; do not advance the project to a
  newer Python minor without a deliberate compatibility migration.
- Django **5.2 LTS**, kept on the latest 5.2 security/bug-fix release (LTS
  security support through at least April 2028).
- Django REST Framework **3.18.x**, kept on its latest patch release; it supports
  Django 5.2 and is the current maintained DRF series.
- PostgreSQL **17.x**, kept on the latest minor release. This mature, supported
  release line receives fixes through November 2029.
- `psycopg` **3.x**, on a current supported patch release.
- `django-filter`, `drf-spectacular`, and Pillow: current maintained stable
  releases compatible with Python 3.12 and Django 5.2, each pinned in the lock
  file.
- reproducible, exactly pinned Python dependencies and a committed lock file.

### Infrastructure

- Git
- Docker Engine and Docker Compose: current supported stable releases; use
  maintained base images and apply their security patches regularly.
- Docker Compose for local development and supporting services
- configuration through environment variables
- S3-compatible file storage in production
- HTTPS required in production
- infrastructure that can be moved between providers

### Dependency and image maintenance

- Use only maintained, non-prerelease dependencies in production.
- Pin application dependencies exactly in lock files. Pin production container
  images to a maintained patch tag and immutable digest; do not use floating
  `latest` tags.
- Review dependency, Node/Python runtime, PostgreSQL, and container-image
  security updates at least monthly; test and apply security updates promptly.
- Before a major-version upgrade, review the vendor migration notes and run the
  relevant automated tests. A major upgrade is intentional work, not an
  unattended dependency update.

### Asynchronous processing

A queue will not be added “just in case.” When there is a real need for scheduled or asynchronous tasks, the preferred option will be **Celery 5.6.x + Valkey 8.1.x**. These are mature, currently supported lines; Celery 5.6 supports Python 3.12. Both components must be kept on current patch releases and run in Linux containers or production Linux hosts.

### Not part of the base architecture

Firebase/Firestore as the primary database, Supabase as a replacement for Django, GraphQL, microservices, Kubernetes, NoSQL as the primary datastore, critical logic living only in Angular, proprietary services as the system of record, AI, or AI agents.

---

## 6. Domain model

The models may evolve, but the following entities and relationships are required.

### Organization

Real estate company configuration: name, branding, logo, time zone, default language, currency, and enabled modules.

### User and agent profile

Django manages authentication and passwords. The agent profile adds professional information to a user when applicable. No custom cryptography will be implemented.

### Contact

A single entity represents a person’s progression through the commercial relationship, avoiding duplicate models for “lead,” “prospect,” and “client.”

Minimum fields: UUID, name, phone, optional email, assigned agent, source, status, notes, and timestamps.

Initial statuses: prospect, active client, closed client, lost, inactive.

### Source

Lead and appointment sources are configurable: office duty, personal contact, website, referral, social media, property portals, or others.

### Property

The master property record. At minimum it must include: UUID, title, description, type, transaction type, price, currency, status, location, features, assigned agent, public visibility, media, and timestamps.

Suggested initial statuses: draft, active, reserved, closed, archived.

A property exists independently of whether it is published externally or publicly.

### Property media

Represents photos or other files. PostgreSQL stores metadata and references; the physical file lives in external or local storage, never as the primary blob inside the database.

### Appointment

Includes: agent, date/time, contact, property when applicable, purpose, source, status, outcome, and follow-up.

Initial statuses: scheduled, confirmed, completed, canceled, no-show.

**Property transaction type** (sale/rent) and **appointment purpose** (showing/listing intake/closing/other) are separate concepts and must not be mixed.

### Activity / follow-up

A contact’s history is represented as a sequence of activities—notes, calls, follow-ups, outcomes, or meaningful changes—instead of repeatedly overwriting a single field.

### Cross-cutting data rules

- UUIDs as public identifiers for primary records.
- `created_at` and `updated_at` on important records.
- responsible user where applicable.
- explicit statuses, with archiving preferred over destructive deletion.
- dates stored consistently in UTC and displayed in the organization’s time zone.
- configurable currency; MXN may be the initial default.
- schema changes exclusively through Django migrations.

---

## 7. Roles, authentication, and permissions

### Agent

Can manage their contacts, appointments, and follow-ups; view permitted inventory; and create or modify properties based on permissions and ownership/responsibility.

### Management

Can view organization-wide activity, agents, contacts, appointments, properties, and basic reports, and can modify operational data where appropriate.

### Administrator

Includes management capabilities and additionally manages users, permissions, configuration, and system settings.

### Security rules

Authorization is always enforced on the backend. Hiding UI elements in Angular is not security.

For web/PWA use, Django sessions with secure, HttpOnly cookies, CSRF protection, and HTTPS are preferred. Sensitive credentials or tokens will not be stored in `localStorage` for convenience. A future mobile client may use a different authentication mechanism without replacing the underlying user and permission model.

---

## 8. API and business logic

The API is a formal part of Modulo:

```text
/api/v1/
```

It will be REST, JSON-based, versioned, documented with OpenAPI, and independent of Angular.

```text
Angular Component
      ↓
Frontend Service
      ↓
REST API
      ↓
Service / Domain Logic
      ↓
Database
```

The API is responsible for validation, permissions, pagination, filtering, and consistent error handling.

Important business rules must not be scattered across views, serializers, or frontend components. When an operation has meaningful behavior, it should have a clear service/domain layer. Multi-record operations will use transactions where appropriate.

---

## 9. Core functionality

### Contact CRM

The system must support creating, assigning, searching, and filtering contacts; storing their source and status; viewing their details, appointments, and history; and clearly answering who owns the contact, where they came from, what happened, and what happens next.

Minimum filters: name, agent, status, and source.

### Property inventory

The system must support creating, viewing, updating, archiving, searching, filtering, and assigning properties; managing photos; setting status; and controlling public visibility.

Minimum filters: status, agent, transaction type, property type, and visibility.

### Appointments and follow-up

The system must support creating and updating appointments; associating them with a contact and property; assigning an agent, date/time, source, purpose, status, outcome, and subsequent follow-up.

Minimum filters: date range, agent, status, source, and purpose.

An agenda/calendar view may exist, but the underlying model must not depend on a visual calendar representation.

### Dashboard

The dashboard should provide simple operational oversight, for example: upcoming appointments, appointments by agent/date range/status/source, pending follow-ups, properties by status, and recent activity.

This is not a BI platform and does not include AI-based predictions, scoring, or forecasting.

### Public property catalog

The public catalog is part of the final scope, but it must remain **decoupled and disableable**. It consumes the same property inventory and must never create a parallel inventory.

A property is published only when it meets explicit rules, for example:

```text
active + marked public = visible
```

It must include listings, basic filters, property detail pages, photos, public-facing information, and a basic contact mechanism.

The public endpoint will use a dedicated representation and must never accidentally expose internal notes, owner or client data, history, administrative fields, integration data, or private agent information. The exact address may be hidden.

It does not include a general-purpose CMS, blog, page builder, advanced SEO, multi-agency marketplace, mortgage tools, or ad management.

---

## 10. Operational questions Modulo must answer

The system must make it easy to answer: **Who is this contact, who is handling them, where did they come from, which property are they interested in, what appointments have they had, what happened, and what happens next?** It must also answer: **Which properties are active or published, what appointments are coming up, which follow-ups are pending, and what activity is happening by agent, status, date range, or source?**

## 11. Frontend, languages, and PWA

Angular is responsible for presentation, navigation, forms, interaction, UX validation, API consumption, responsive design, and internationalization—not critical business decisions.

Rules:

- make HTTP calls through typed services, not directly from components;
- avoid complex global state such as NgRx until it is actually needed;
- transform API responses in an appropriate layer when necessary;
- centralize module enablement;
- keep the design clear, consistent, accessible, and responsive.

The interface will use **Spanish by default with English as an alternative**, switchable at runtime through translation keys. User-entered data does not require automatic translation.

The PWA is part of the final deliverable: it must be installable, responsive, usable on mobile and desktop, served over HTTPS, and use appropriate caching. **It will not be offline-first** and will not implement complex synchronization of offline edits.

The mobile progression will be: stable web app → PWA → Capacitor/Android if it adds value. Separate native apps in Kotlin, Java, or Swift will not be developed within the current scope; iOS can initially use the PWA.

---

## 12. Files, environments, and deployment

### Photos

During development, photos may be stored locally. In production, provider-agnostic S3-compatible storage will be used.

### Environments

At minimum: development and production. Staging may be added when needed. Environment differences are handled through environment variables.

Secrets, passwords, private keys, credentials, and real API keys are never committed to version control.

### Deployment

The production architecture will conceptually be:

```text
Internet / HTTPS
      ↓
Angular Frontend + /api/
                  ↓
                Django
              ↙        ↘
       PostgreSQL     Object Storage
```

For real-world use, backups and a reliable PostgreSQL deployment take priority over secondary features.

---

## 13. Integrations and interoperability

All integrations live behind adapters in `integrations/`. Domain models and Angular components will not call external providers directly.

Recommended implementation order:

1. **Export:** CSV for contacts, properties, and appointments.
2. **Local calendar:** `.ics` export for appointments.
3. **Transactional email:** through a provider-agnostic mechanism.
4. **Calendar APIs:** Google/Microsoft through adapters.
5. **Push notifications.**
6. **WhatsApp/SMS**, if the business case justifies the cost and external policy requirements.
7. **Property portals**, only through official APIs/documentation, authorized access, and clear terms.

Scraping will not be used as a substitute for an authorized API.

An external property reference must store the provider, external ID, publication status, last synchronization time, and last error separately. An external ID never replaces the internal UUID.

Independence rules:

- the CRM does not depend on the public catalog.
- inventory does not depend on a property portal.
- appointments do not depend on Google Calendar.
- contacts do not depend on WhatsApp.
- the backend does not depend on Angular for business rules.
- organization identity does not depend on a specific brand or franchise.

---

## 14. Security, privacy, and history

Before real data is used, Modulo must have at least:

- HTTPS;
- passwords managed by Django;
- permissions enforced on the backend;
- CSRF protection and secure cookies where applicable;
- input validation;
- properly restricted CORS;
- secrets provided through environment variables;
- file type and size validation;
- protected private endpoints;
- queries restricted according to permissions;
- backups;
- error handling that does not expose sensitive information.

Development data must be synthetic or anonymized. A real customer database must not be copied indiscriminately into development environments or public demos.

A full enterprise audit platform is not required, but important records should preserve creation and modification information, as well as the responsible user where relevant, to avoid accidental loss of history.

Before operating formally with real data, an additional review of privacy, data-protection requirements, and applicable legal obligations must be completed.

---

## 15. Quality and testing

### Backend

The backend has priority for automated testing. Tests should focus especially on:

- authentication and permissions;
- validation;
- create and update operations;
- filters;
- appointment rules;
- publication rules;
- public endpoints;
- protection of private information.

The project will not chase an artificial coverage percentage; important rules and workflows are what must be protected.

### Frontend

At minimum, the frontend should test important services, guards, critical transformations, and behavior that is prone to regressions. End-to-end tests may be added for the main workflows.

### Definition of Done

A feature is considered complete when, as applicable:

- it works and persists data correctly;
- it validates input;
- it enforces permissions;
- it handles reasonable error cases;
- it integrates with navigation and the API;
- it works at expected screen sizes;
- it uses internationalization for fixed UI text;
- it has tests when it contains critical rules;
- it does not introduce secrets or break other modules.

---

## 16. Required cross-cutting capabilities

Core modules must follow consistent standards: useful search and filtering; assignment of responsible users; explicit statuses; timestamps and history; archiving preferred over deletion; backend validation and permissions; pagination where appropriate; strict separation of public and private data; and reasonable export capabilities for contacts, properties, and appointments.

## 17. Required final scope

Modulo is considered functionally complete when the following are in place:

### Backend

- working Django + PostgreSQL stack;
- REST API v1 and OpenAPI;
- users, profiles, and permissions;
- contacts;
- properties and photos;
- appointments, activity, and follow-up;
- filters;
- controlled public endpoints;
- tests for important rules.

### Frontend

- login;
- dashboard;
- contact management;
- property management;
- appointment management;
- basic public property catalog;
- Spanish/English;
- responsive design.

### Distribution and operations

- web application;
- installable PWA;
- environment-variable configuration;
- reproducible migrations;
- reproducible demo data;
- documented run and deployment process;
- basic data export.

### Workflows that must work end to end

1. **Contact:** create → assign agent/source → view → record history.
2. **Property:** create → add details/photos → assign → activate/archive.
3. **Appointment:** associate contact/property/agent → schedule → update outcome → follow up.
4. **Oversight:** sign in → dashboard → filter → open related records.
5. **Publishing:** internal property → mark public → appears publicly → disable → disappears.
6. **Language:** Spanish → switch to English → interface updates.
7. **PWA:** install → open → authenticate → use authorized features.

---

## 18. Extensions and out of scope

### Later goal, non-blocking

- Android via Capacitor;
- transactional email;
- automatic reminders;
- calendar API integration;
- push notifications.

### Possible future work

Official property portal integrations, WhatsApp Business, SMS, two-way calendar synchronization, advanced analytics, bulk imports, automations, advanced lead/deal management, documents, signatures, configurable workflows, multiple offices, or multiple organizations.

### Out of scope for now

- AI, agents, chatbots, or automated recommendations;
- ERP, accounting, payroll, invoicing, payments, or commissions;
- full contract management or electronic signatures;
- unnecessary storage of sensitive personal identification data;
- marketplace, social network, or internal chat;
- full marketing system;
- advanced CMS/blog/SEO or site builder;
- scraping or portal synchronization without authorized APIs;
- standalone native mobile applications;
- offline-first operation;
- microservices;
- full multi-tenant SaaS.

---

## 19. Durability and survival criteria

Modulo must remain useful even if Angular, the brand, the property portal, the storage provider, or the deployment method changes. The following should survive without being rebuilt: the data model and migrations, users and permissions, contact/property/appointment data, history, domain logic, API/OpenAPI, tests, adapters, and import/export capabilities.

## 20. Criteria for new decisions

Before adding a major feature or dependency, answer the following:

1. Does it solve a real, observed problem?
2. Does it belong in the core, or can it live as a module?
3. Does it introduce a vendor without which the core would stop working?
4. Does it duplicate information or create another source of truth?
5. Can it be added later without losing information or blocking the design?
6. Does it displace more important work?
7. Does the base platform already solve the problem well enough?
8. Is the dependency maintained, acceptably licensed, and replaceable?
9. Are we building for a real need, or drifting into *scope creep*?

The general preference is for open technologies, documented standards, and justified dependencies. Vendor free tiers may be useful for development or demonstrations; they are not an architecture.

> **Final rule:** when the choice is between adding another feature and making the existing core functionality professional, secure, and reusable, prioritize the latter.
