# EcoTrack — Personal Carbon Footprint Tracker

EcoTrack is a premium personal carbon footprint tracker built to help individuals **Understand**, **Track**, and **Reduce** their carbon footprints. It features a React + Tailwind client and a Node.js + Express API powered by a lightweight SQLite database.

## Architecture & Modular Structure

The project is structured to enforce separation of concerns:
- **`backend/`**: Node.js and Express REST API.
  - `src/config/`: Setup configurations for SQLite and fully documented carbon emission factors.
  - `src/utils/`: Pure calculation libraries for carbon conversions.
  - `src/middleware/`: JWT verification, double-submit cookie CSRF validation, and rate limiters.
  - `src/routes/`: Subdivided routers for authentication, logging activities, profiles, dashboard analytics, goals/streaks, and catalog action lookups.
  - `src/tests/`: API route integration testing.
- **`frontend/`**: React Single Page Application initialized with Vite.
  - `src/context/`: Session management and auto-CSRF header injection.
  - `src/components/`: Modular, accessible views for onboarding, logs, dashboard recharts, goal tracking, and catalog action libraries.
- **`e2e/`**: Playwright E2E browser tests.

---

## Emission Factors & Sourcing

EcoTrack does not hide its calculations. Emission factors live in [emissionFactors.js](file:///c:/Users/SANJAY/carbon/backend/src/config/emissionFactors.js) and are fully cited:

1. **Transportation**:
   - **Gasoline Car**: `0.18 kg CO2e / km`. Sourced from *US EPA GHG Emission Factors Hub (2023)* (Mobile Combustion Table).
   - **Electric Vehicle**: `0.05 kg CO2e / km`. Calculated using grid carbon average and typical EV efficiency (~18 kWh/100km).
   - **Public Transit**: `0.04 kg CO2e / km`. Sourced from *UK DEFRA (2023) Conversion Factors*.
   - **Short Flights (<1500km)**: `0.25 kg CO2e / km` & **Long Flights (>1500km)**: `0.15 kg CO2e / km`. Sourced from *UK DEFRA (2023) Aviation Factors* including radiative forcing.

2. **Food / Diet**:
   - **Beef & Lamb**: `4.5 kg CO2e / serving` (~30 kg CO2e/kg).
   - **Pork & Poultry**: `0.9 kg CO2e / serving` (~6 kg CO2e/kg).
   - **Fish & Seafood**: `0.75 kg CO2e / serving` (~5 kg CO2e/kg).
   - **Dairy & Eggs**: `0.6 kg CO2e / serving` (~4 kg CO2e/kg).
   - **Plant-Based**: `0.12 kg CO2e / serving` (~0.8 kg CO2e/kg).
   - *Sources*: Scarborough et al. (2014) and Poore & Nemecek (2018) Science lifecycle assessments.

3. **Home Energy**:
   - **Electricity**: `0.40 kg CO2e / kWh`. Average grid mix intensity (US EPA eGRID average).
   - **Natural Gas**: `0.20 kg CO2e / kWh`. Sourced from *EPA GHG Hub*.
   - **Heating Oil**: `2.68 kg CO2e / Liter`. Sourced from *EPA GHG Hub*.

4. **Shopping & Waste**:
   - **Clothing Item**: `12.0 kg CO2e` per new item. Sourced from lifecycle apparel manufacturing audits.
   - **Electronic Device**: `80.0 kg CO2e` per device. Sourced from average brand lifecycle disclosures.
   - **Landfill Waste**: `0.50 kg CO2e / kg` of trash. Sourced from *EPA WARM* landfill decay methane estimations.

---

## Security Safeguards
1. **Password Hashing**: User passwords are encrypted using `bcryptjs` with 10 salt rounds prior to storage.
2. **SQL Injection Block**: Parameterized SQL statements are used for all database writes and reads. No raw string concatenations exist.
3. **Session Credentials**: Session JWTs are stored in HTTP-only, secure, SameSite cookies to protect from XSS theft.
4. **CSRF Prevention**: Implements a double-submit cookie pattern. The server issues a secure `_csrf` cookie on session boot, and client must submit this token inside the `X-CSRF-Token` header for state-changing requests.
5. **Rate Limiting**: Restricts registration and login requests to 10 attempts per 15 minutes per IP to block brute-force scripts.
6. **Information Shielding**: Express global error catcher logs stack traces server-side and serves clients a sanitized, generic error.

---

## Setup & Running the Application

### Prerequisites
- Node.js (v20+ recommended)
- npm

### 1. Installation
In the root directory, run the setup script to install backend and frontend dependencies:
```bash
npm run setup
```

### 2. Booting the Application
We boot backend and frontend simultaneously:

- **Start Backend API server**:
  ```bash
  npm start --prefix backend
  ```
  *(Server runs on http://localhost:5000)*

- **Start Frontend Vite client**:
  ```bash
  npm run dev --prefix frontend
  ```
  *(Vite client runs on http://localhost:5173)*

Open your browser to [http://localhost:5173](http://localhost:5173).

---

## Running the Test Suite

We maintain a high test coverage across all architectural units:

### 1. Backend Calculations (Unit Tests) & API Routes (Integration Tests)
To execute the backend Jest test suite, run:
```bash
npm run test:backend
```
*(Runs 27 assertions testing calculations edge cases and Supertest route verifications on a clean in-memory database)*

### 2. End-to-End Tests (Playwright Browser Tests)
The E2E tests boot both development servers automatically, perform browser interactions, and assert data updates:

- **First-time Playwright Browser Setup**:
  ```bash
  npx playwright install chromium
  ```

- **Execute E2E suite**:
  ```bash
  npm run test:e2e
  ```
  *(Runs user signup → 5-step onboarding baseline creation → logs an electric car activity → verifies the dashboard updates from 0.0 to 5.0 kg)*
