# Proffyn Rapid Solution Delivery (RSD) Process

## Document Purpose

This document defines the **Proffyn Rapid Solution Delivery (RSD)
process**.\
It explains how RSD projects are structured, governed, executed, and
documented.

This document is designed to be used by: - Other ChatGPT projects -
Cursor-based development environments - Engineering teams - Product
teams - AI agents participating in structured delivery

The RSD process enforces discipline, clarity, traceability, and
incremental execution.

------------------------------------------------------------------------

# 1. Core Philosophy

Proffyn RSD is built on five non-negotiable stages:

1.  **Understand**
2.  **Summarise**
3.  **Plan**
4.  **Execute / Test**
5.  **Document**

No development begins without progressing through these stages in order.

RSD prioritises: - Structured thinking - Explicit documentation - Atomic
execution - Test-first discipline - Continuous documentation updates -
Clear auditability

------------------------------------------------------------------------

# 2. Stage 1 --- Understand

## 2.1 High-Level Understanding

Before any implementation work begins, the agent or engineer must review
the foundational documents for the project.

These typically include:

-   System Architecture Document
-   UX / Design Framework
-   Product Requirements Document (PRD)
-   Testing Strategy
-   Data Modelling Guide
-   Admin Portal Guide (if relevant)
-   Development Approach Document

These documents define: - Architectural constraints - Technical stack -
Data structures - Access control patterns - UX principles -
Non-functional requirements - Governance rules

No assumptions may override these documents.

## 2.2 Low-Level Understanding

Once high-level understanding is confirmed, the feature-specific domain
document must be reviewed.

Naming convention:

    <FEATURE>_DOMAIN.md

This document defines: - Detailed functionality - Business rules -
Validation logic - Data relationships - Edge cases - Permissions -
Mode/tenant constraints

Understanding must include both: - Functional behaviour - Technical
implications

No planning begins until understanding is complete.

------------------------------------------------------------------------

# 3. Stage 2 --- Summarise

The purpose of this stage is to confirm understanding and create
traceable artefacts.

## 3.1 High-Level Summary

Create:

    PROJECT_STATUS_TRACKER.md

This document must:

-   Break the platform into numbered stages
-   Include major capabilities (e.g., Authentication, Posts, Groups,
    Events)
-   Use checkboxes \[ \] for each stage
-   Include nested sub-tasks where detail is known
-   Act as the authoritative progress ledger

Example structure:

    1. Authentication
       [ ] 1.1 Login
       [ ] 1.2 Registration
       [ ] 1.3 Password Reset

    2. Groups
       [ ] 2.1 Database Schema
       [ ] 2.2 Data Layer
       [ ] 2.3 UI Screens

This file must always reflect current delivery state.

## 3.2 Low-Level Summary

Create:

    <FEATURE>_DOMAIN_SUMMARY.md

This document must:

-   Break the feature into explicit functional components
-   Describe validation rules
-   Describe mode-based behaviour
-   Describe permissions
-   Describe UI expectations
-   Describe database implications

This document must be detailed enough to allow planning at sub-task
level.

------------------------------------------------------------------------

# 4. Stage 3 --- Plan

Create:

    <FEATURE>_IMPLEMENTATION_TASKS.md

This document must:

-   Break work into logical, numbered tasks
-   Use checkboxes \[ \] for each task
-   Include sub-tasks where appropriate
-   Include database tasks
-   Include data-layer tasks
-   Include UI tasks
-   Include access control tasks
-   Include migration steps
-   Include test plan
-   Include documentation update steps

## 4.1 Planning Rules

-   Tasks must be atomic
-   Tasks must be sequential
-   No speculative optimisation
-   No bundling of unrelated work
-   Each task must be executable independently

## 4.2 Mandatory Test Plan Section

Each feature plan must include:

-   Happy path scenarios
-   Edge cases
-   Mode-based behaviour tests
-   Permission validation tests
-   Error condition tests
-   Database verification steps

Testing is not optional.

------------------------------------------------------------------------

# 5. Stage 4 --- Execute / Test

Execution must follow strict rules.

## 5.1 Execution Discipline

-   Execute ONE task at a time
-   If complex, execute ONE sub-task at a time
-   Write code
-   Run unit tests
-   Validate behaviour manually where required
-   Mark checkbox as complete
-   Update task file

No bulk implementation.

No skipping steps.

## 5.2 Testing Requirements

Every capability must:

-   Include Jest test packs (for data layer and core logic)
-   Run successfully in CI
-   Validate mode-based logic
-   Validate tenant scoping
-   Validate access control rules
-   Validate RLS implications (if database changes)

A task is not complete unless tests pass.

## 5.3 Database Changes

Before:

-   Modifying schema
-   Creating migrations
-   Changing RLS policies

Explicit confirmation must be obtained (if operating in controlled
execution mode).

------------------------------------------------------------------------

# 6. Stage 5 --- Document

Documentation is not optional and not deferred.

After feature completion:

1.  Update `PROJECT_STATUS_TRACKER.md`
2.  Update domain summary if behaviour changed
3.  Update architecture document if required
4.  Update testing document
5.  Update any related domain cross-references

All documentation must reflect the actual implemented behaviour.

Documentation is treated as part of the deliverable.

------------------------------------------------------------------------

# 7. Core Governance Rules

## 7.1 Source of Truth Hierarchy

If conflicts arise, precedence is:

1.  .cursorrules
2.  Product Requirements Document
3.  System Architecture
4.  UX / Design Document
5.  Implementation Task Document
6.  PROJECT_STATUS_TRACKER.md

## 7.2 Architectural Invariants

-   Supabase is authoritative backend
-   RLS is primary access enforcement
-   No service-role keys client-side
-   Tenant scoping enforced at database level
-   Mode-based behaviour must be explicit
-   All core tables include tenant_id where required

## 7.3 Non-Negotiables

-   No undocumented changes
-   No hidden features
-   No bypassing access control
-   No skipping testing
-   No direct UI → database coupling

------------------------------------------------------------------------

# 8. Artefact Naming Conventions

  Artefact              Naming Pattern
  --------------------- -------------------------------------
  Feature Domain        `<FEATURE>_DOMAIN.md`
  Feature Summary       `<FEATURE>_DOMAIN_SUMMARY.md`
  Implementation Plan   `<FEATURE>_IMPLEMENTATION_TASKS.md`
  Status Tracker        `PROJECT_STATUS_TRACKER.md`
  Testing Flow          `TESTING_FLOW.md`
  Architecture          `SYSTEM_ARCHITECTURE.md`

Consistency is critical.

------------------------------------------------------------------------

# 9. AI-Agent Operating Model

When used in AI-assisted development (e.g., ChatGPT + Cursor):

1.  AI must first confirm understanding.
2.  AI must reference governing documents.
3.  AI must not hallucinate architecture.
4.  AI must not invent schema.
5.  AI must operate incrementally.
6.  AI must update documentation after each phase.

The RSD process converts AI from an improvisational tool into a
structured delivery engine.

------------------------------------------------------------------------

# 10. RSD Outcome

When correctly followed, the RSD process produces:

-   Clean, scalable architecture
-   Fully documented features
-   Test-backed delivery
-   Clear audit trail
-   Controlled iteration
-   Reduced regression risk
-   AI-compatible execution discipline

RSD transforms rapid development into structured, reliable,
production-grade solution delivery.

------------------------------------------------------------------------

# End of Document
