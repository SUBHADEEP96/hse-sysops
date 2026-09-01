# HSE Safety Audit Tool — iOS MVP

Expo SDK 54 / React Native 0.81 iOS client for the existing Master and SAT APIs. The app implements secure three-stage authentication, dashboard, audits, server-driven observations, in-app notifications, and a read-only profile.

## Prerequisites and installation

- Node.js 20 LTS (the committed Expo toolchain is tested with Node 20)
- npm 10+
- Xcode 16+ and an iOS simulator for local iOS development

```bash
npm ci
cp .env.example .env.local
npx expo start                 # Expo Go; press i for iOS Simulator
npm run ios                    # iOS simulator
```

Only public routing configuration belongs in `.env.local`. `EXPO_PUBLIC_API_ORIGIN` is the unified origin; the Master and SAT prefixes default to `/api/master` and `/api/sat`. Never add credentials or tokens to environment files.

## Architecture

- `app/`: thin Expo Router authentication, tabs, and audit stack routes.
- `src/api/`: typed HTTP/error handling, route constants, query client, timeout/cancellation, bearer injection, and authenticated-401 invalidation.
- `src/features/`: feature-first auth, dashboard, audits, observations, notifications, and profile logic.
- `src/components/ui/`: accessible reusable NativeWind primitives and async states.

React Query owns server state. The auth context restores and deletes only the SAT session token with SecureStore; passwords, Master tokens, and launch tokens remain transient. Mutations are not retried. SAT 401 responses clear secure user state and cached queries. Dynamic forms are rendered from server questions with required validation and a safe text fallback.

## Integrated API endpoints

Authentication uses `POST /api/master/auth/login`, `POST /api/master/auth/app-launch`, then `POST /api/sat/auth/session`. Features use dashboard stats, critical-RPN and observation counts; audit list/detail/create/status/forms/pairs; submission list/create; dynamic forms; countries/locations; RPN likelihood/severity; and all four SAT notification endpoints. The authenticated user ID is always used as auditor/submitter.

## Verification

```bash
npx expo install --fix
npx expo-doctor
npm run typecheck
npm run lint
npm test
npm run export:ios
```

The Jest suite mocks network boundaries and must never contact the production API.

## iOS / TestFlight handover

`app.json` contains the existing EAS project link/owner, iOS bundle identifier, build number, encryption declaration, and camera/photo permission descriptions. `eas.json` provides simulator development, internal preview, and auto-incrementing production profiles. Confirm the bundle identifier with the product owner before the first signed build.

```bash
npx expo-doctor
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile production
npx testflight
```

The final two commands are owner-controlled: do not run them until Apple credentials and build authorization are available. Production API values are public routing metadata, not secrets.

## Known backend contract limitation

The SAT API documentation (sat_API_LIST.md §3 Submissions) lists 6 submission endpoints but does **not** include `POST /submissions/:id/media` for uploading observation attachments. Picker, preview, cancellation, removal, and conservative JPEG/PNG/PDF validation are fully implemented. Submission is blocked when files are attached pending backend contract definition. `ObservationAttachmentAdapter` isolates this missing contract.

## Handover checklist

1. Run all verification commands above on the handover commit.
2. Confirm API origin/prefixes for each EAS environment.
3. Confirm the iOS bundle identifier and EAS project ownership.
4. **Obtain the observation attachment upload endpoint definition from the SAT backend owner** — confirm request method, path, field names, multipart encoding, and response format.
5. Implement `uploadAttachment()` and update `submitObservation()` with the documented endpoint.
6. Perform authenticated device acceptance tests with non-production credentials supplied out of band.
7. Have the Apple account owner initiate the production build and TestFlight upload.
