# EcoTrack — Project Evaluation Summary

A concise breakdown of how the EcoTrack Personal Carbon Footprint Tracker addresses the six key design and operational parameters:

---

## 1. Code Quality
- **Separation of Concerns**: The project utilizes a modular division: Express REST API routes manage request/response cycles; pure JS utilities calculate carbon math; React context manages user state; CSS styles inject Tailwind utilities.
- **Consistent Naming**: All files, classes, routes, and variables adhere to uniform camelCase (frontend) and snake_case/camelCase database schemas. Linting settings are configured in Vite, ensuring unified formatting.
- **No Magic Numbers**: All greenhouse gas emission factors live in [emissionFactors.js](file:///c:/Users/SANJAY/carbon/backend/src/config/emissionFactors.js) with detailed, inline comment citations referencing EPA, UK DEFRA, and Poore & Nemecek lifecycle assessment sheets.

## 2. Security
- **Encrypted Credentials**: User passwords are encrypted using `bcryptjs` with 10 salt rounds before storage.
- **Parameterized Queries**: All database read/write queries are strictly parameterized in SQLite (`db.run(sql, [...])`), blocking SQL injection risks.
- **Cookie Authentication**: User sessions are checked via secure, HTTP-only, SameSite JWT cookies, insulating sessions from XSS token extraction.
- **CSRF Defense**: State-changing requests (POST/PUT/DELETE) undergo double-submit cookie validation. React reads the CSRF token from the secure cookie and propagates it in the custom `X-CSRF-Token` header.
- **Error Shields**: Express global error boundary shields clients from stack traces and database internal structures, routing raw diagnostics strictly to server-side logs.
- **Secrets Isolation**: Secrets like the JWT signature and server ports are handled via a local `.env` variables system loaded dynamically by `dotenv`.
- **Rate Limiting**: Integrated `express-rate-limit` on login and signup paths to prevent automated dictionary attacks.

## 3. Efficiency
- **Paginated Logs**: Activity history logs are paginated database-side and fetched in segments of 5 items. This limits memory footprints and enables lazy-loading.
- **Server Aggregation**: Rather than forcing React to loop over history logs, category totals and 30-day timeline charts are aggregated server-side via fast SQL `SUM` queries.
- **Database Indexing**: Performance is optimized for scaling data tables by applying database indexes (`idx_activities_user_date`) on user IDs and dates, making aggregates and paginations instantaneous.
- **Vite Bundling**: The Vite build pipeline splits node dependencies, keeping JS bundles highly optimized and fast-loading.

## 4. Testing
- **Calculation Math (Unit Tests)**: Pure utility calculations are tested under Jest (`calculations.test.js`). The suite asserts precise conversions, handles float roundings, and validates boundary states (zero, negatives, and invalid types).
- **REST Endpoints (Integration Tests)**: API endpoints (signup duplicate blocks, auth barriers, CSRF validations, profile onboarding baselines, and logs) are validated using `supertest` on a fresh SQLite connection.
- **End-to-End browser coverage**: Playwright E2E tests (`e2e.test.js`) automate browser rendering, verifying the user flow: signup → onboarding baselines → logging a transport activity → asserting dashboard metric updates.

## 5. Accessibility
- **Semantic Structure**: Built layout hierarchies using semantic HTML tags (`<header>`, `<main>`, `<nav>`, `<form>`, `<table>`). Form inputs have descriptive `<label>` tags with matching IDs.
- **Keyboard Usability**: Every interactive input, select dropdown, button, range slider, and navbar link is fully focusable and keyboard navigable.
- **Outline Indicators**: Added explicit `:focus-visible` styles to `index.css` to render clear outlines (a distinct green border) on focused elements.
- **WCAG Contrast & Clear Indicators**: Leveraged Tailwind neutral colors, ensuring a contrast ratio exceeding WCAG AA minimums (4.5:1). We avoid relying solely on color (green/amber/red) to indicate carbon ratings: textual summaries, percentages, and icons (leaf, alert, warnings) convey metrics.

## 6. Problem Statement Alignment
EcoTrack maps directly to the three core pillars of the problem statement:
- **UNDERSTAND**: Solved by the Onboarding Quiz estimating baseline footprints per month, combined with transparent formula displays (e.g. `100 kWh × 0.40 kg CO2e = 40 kg CO2e`) showing the math behind carbon impacts.
- **TRACK**: Addressed by the Activity Logger allowing quick log entries of transportation, diets, utility meters, and waste, backed by a detailed paginated history log.
- **REDUCE**: Strengthened by the rule-based Insights Engine dynamically scoring and ranking lifestyle recommendations by impact vs effort, custom Goals and Streaks progress meters, and a searchable Action Library.
