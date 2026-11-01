# Comprehensive Testing Strategy & Verification Guide

This document describes the test pyramid, verification commands, and test suites across the repository.

---

## 1. Test Pyramid Overview

| Layer | Framework | Target / Purpose |
|---|---|---|
| **Quantum Core Unit Tests** | Vitest | Mathematical invariants: Gate unitarity, Bell state amplitudes, state normalization ($\pm 10^{-9}$), exact 4-message recovery, seeded PRNG reproducibility. |
| **Scientific Backend Tests** | pytest | Python NumPy engine: Bell state properties, state norms, projective measurement fidelity, structured validation rejection. |
| **API Integration Tests** | pytest / TestClient | FastAPI endpoints (`/api/v1/health`, `/api/v1/protocols/superdense`, `/api/v1/simulations`, `/api/v1/simulations/measure`). |
| **Frontend Component Tests** | Vitest + React Testing Library | MessageSelector, Controls, ProbabilityBars, Timeline, StateInspector, validation errors, keyboard callbacks. |
| **Browser E2E Tests** | Playwright | Full end-to-end user journeys for messages {00, 01, 10, 11}, mobile/desktop viewports, step progression, reduced-motion compliance. |

---

## 2. Test Execution Commands

### 2.1 Backend Tests (Pytest)
```bash
cd services/simulator
.\.venv\Scripts\pytest -v
```
Evidence: 18 passed in 0.50s.

### 2.2 Quantum Core Engine Tests (Vitest)
```bash
npm run test:core
```
Evidence: 15 passed in 6ms.

### 2.3 Web Component Tests (Vitest)
```bash
npm run test:web
```

### 2.4 End-to-End Tests (Playwright)
```bash
npm run test:e2e
```

---

## 3. Strict Quality Invariants Enforced

- **No Test Weakening**: Zero skipped tests (`.skip`), zero loose assertions, zero mocks inside the quantum domain.
- **Reproducibility**: PRNG sampling verified for deterministic seed output across repeated executions.
- **Normalization Verification**: Every single snapshot in the 8-stage sequence verifies $\sum |\alpha_i|^2 = 1.0 \pm 10^{-9}$.
