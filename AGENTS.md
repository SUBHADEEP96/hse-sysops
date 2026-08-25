# AGENTS.md

## Project

This repository is the Expo SDK 54 React Native iOS client for the existing HSE/SAT APIs.

## Source of truth

1. Supplied API and developer-flow documents
2. Existing working repository code
3. Official Expo SDK 54 and NativeWind v5 documentation
4. Supplied screenshots for visual reference
5. Assumptions only when unavoidable

Never invent API contracts. Report missing contracts explicitly.

## Scope

Work only on:

- Authentication and Master-to-SAT session exchange
- Dashboard
- Audit listing, details, creation and status
- Dynamic opening/closing forms
- Observation submission, RPN and attachments
- In-app API notifications
- Read-only profile and logout
- Tests, iOS build preparation and handover documentation

Do not add backend work, push notifications, chat, tickets, audit scheduling, AI features, social login, user administration, offline sync, maps or Android-specific delivery.

## Engineering rules

- Expo SDK 54 only
- TypeScript strict mode
- Expo Router
- NativeWind v5 and Tailwind CSS v4
- Feature-first modular architecture
- React Query for server state
- React Hook Form and Zod for forms where appropriate
- `expo-secure-store` for the SAT session token
- Never store passwords, Master tokens or launch tokens
- Never log credentials, tokens or Authorization headers
- Keep route files thin
- Prefer reusable components
- Avoid `any`, duplicated request logic and oversized modules
- Do not add unused dependencies
- Preserve unrelated user changes

## API rules

- API origin must come from environment configuration
- Normalize all documented error-envelope variants
- Do not automatically retry mutations
- Clear the secure session on authenticated `401`
- Do not invent refresh or logout endpoints
- Never hard-code server-owned forms, lookups or audit data
- Use the authenticated user ID for auditor and submitter identities

## UI rules

- Use supplied HSE branding
- Follow iOS safe areas and interaction conventions
- Support small and large iPhones
- Keep touch targets at least 44 points where practical
- Provide loading, error, empty, validation and retry states
- Maintain accessible labels and contrast
- Use NativeWind utilities except for truly dynamic styles

## Verification

Before declaring completion, run:

- `npx expo install --fix`
- `npx expo-doctor`
- TypeScript type checking
- ESLint
- Jest tests
- Expo export/bundle validation supported by the repository

Never state that a check passed unless it was run successfully.