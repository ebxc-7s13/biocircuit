# BioCircuit — biomedical engineers, in one community

BioCircuit is an early web-app prototype for a focused community where biomedical engineers can share project work, ask technically specific questions, discuss journal papers, and find collaborators by expertise.

## What's included

- A responsive, editorial-style community feed rather than a generic social-media clone.
- Feed sections for discussions, questions, projects, journal club, and saved posts.
- Search across sample posts and topics.
- Interactive likes, saved posts, post creation, discussion replies, notifications, and toast feedback.
- A demo onboarding flow with degree, institution, result status, marks/CGPA, phone number, and OTP interaction.
- Best-effort local browser persistence for posts and saves.
- Sample content designed to demonstrate biomedical engineering use cases.

## Run locally

You need Node.js 20 or later and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To test the production build:

```bash
npm run build
npm run preview
```

## Prototype limitations — read before using with real users

This is a frontend prototype, not a production community platform.

- The OTP is a **demo interaction**. Use `123456`; no SMS is sent.
- Institutional and degree review is not implemented. A phone OTP proves access to a phone number, not a biomedical engineering qualification.
- Sample users, paper entries, interactions, notifications, scores, and replies are illustrative rather than sourced/live. Do not rely on displayed counts as real community analytics.
- Current state is stored in the browser's local storage. It is not shared across users or devices, and there is no database or server-side authorization.
- No real journal feeds, DOI metadata, uploads, direct messaging, moderation queue, or collaborator-matching backend is connected.
- Do not enter real patient data, personal documents, or private research information into this demo.

## Product principles

1. **Evidence before engagement.** Separate paper discussions from personal opinions, and encourage source links, methods, limitations, and replication details.
2. **Specific professional identity.** Make degree pathway, institution, career stage, and research interests useful, while keeping marks private and minimizing data collection.
3. **Help that closes the loop.** Questions should support accepted/verified answers, follow-up, and reproducible examples—not only comments and likes.
4. **Recognition for contribution.** Reward useful answers, shared protocols, reusable code/hardware, and collaboration rather than raw posting frequency.
5. **Trust with clear limits.** Phone verification and academic eligibility verification must be separate states. Any verified badge must reflect a defined review process.
6. **Fast by default.** Keep the main feed text-first, lazy-load media, and avoid forced animations, autoplay, and heavyweight feeds.

## Suggested next build phase

- API and database: profiles, memberships, posts, replies, reactions, bookmarks, projects, papers, and reputation events.
- Authentication: email/mobile sign-in, real OTP vendor, rate limiting, secure sessions, account recovery, and device/session management.
- Eligibility: institution/degree checks, optional evidence review, reviewer access controls, appeals, renewal for current students, and a deletion/retention policy. Avoid exposing or using marks as public status signals.
- Research content: DOI/PMID ingestion, Crossref/OpenAlex/PubMed links where permitted, citations and correction flows, source timestamps, and clear labels for editorial/community picks.
- Community safety: report/mute/block, moderation queue, spam controls, content licenses, accessibility, and rules against sharing identifiable patient data.
- Collaboration: topic-based expertise search, project roles, availability, collaborator requests, and lightweight project workspaces.
- Evaluation: performance budgets, keyboard and screen-reader tests, mobile usability, security review, privacy review, and a small pilot with biomedical engineering scholars.

## Tech stack

React + TypeScript + Vite + CSS. The UI uses `lucide-react` for icons. Google Fonts are optional visual enhancements; system font fallbacks keep the app readable if external fonts cannot load.

## Full implementation brief

`MASTER_IMPLEMENTATION_PROMPT.md` contains the detailed handoff prompt for an AI coding agent to upgrade this prototype into the fuller product, including the horizontal interaction model, live background, backend/auth architecture, scholarly metadata, recommendation logic, security rules and release checks. It is a specification, not proof those features already exist.
