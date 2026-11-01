# System Architecture & Component Design

The Quantum Superdense Coding Simulator is designed as a modular monorepo cleanly separating quantum mathematics, API orchestration, and frontend rendering.

---

## 1. Monorepo Structure

```text
quantum-superdense/
├── apps/
│   └── web/                     # Next.js 14+ App Router, Tailwind CSS, KaTeX
├── services/
│   └── simulator/               # FastAPI + NumPy + Pydantic backend service
├── packages/
│   ├── contracts/               # Shared TypeScript schemas & contracts
│   └── quantum-core/            # Framework-agnostic TypeScript state-vector engine
├── docs/                        # Architecture, Math, API, Testing, and BUILD_LOG
├── docker-compose.yml           # Container orchestration
├── README.md                    # Installation & runnable developer guide
└── CONTRIBUTING.md              # Engineering guidelines
```

---

## 2. Separation of Concerns

1. **Quantum Core (`packages/quantum-core`)**:
   - Zero UI, zero HTTP dependencies.
   - Pure matrix algebra: $2 \times 2$ single-qubit gates, $4 \times 4$ CNOT, Kronecker tensor products.
   - Enforces $10^{-9}$ state-vector normalization invariants.
   - Computes Born-rule probabilities and reproducible seeded sampling.

2. **Backend API (`services/simulator`)**:
   - High-performance FastAPI server powered by NumPy 2.x and Pydantic 2.x.
   - Strict validation with structured error codes (`E_VALIDATION_MESSAGE`, `E_VALIDATION_SHOTS`).
   - OpenAPI/Swagger documentation at `/docs`.
   - Cross-validated against the TypeScript quantum core.

3. **Frontend Domain (`apps/web`)**:
   - Next.js 14 App Router with Tailwind CSS and KaTeX math formulas.
   - Authoritative simulation state machine prevents stale asynchronous updates.
   - Automatic resilient fallback: connects to FastAPI backend when live, falls back seamlessly to client TypeScript quantum core if offline.
   - Zero duplicated simulation math inside components.

---

## 3. Accessibility & UX Architecture

- **Visual Design**: Scientific instrument aesthetic with refined dark theme, hairline dividers, and WCAG AA contrast.
- **Micro-Interactions**: Tactile segmented message buttons, smooth ~400ms spring animations, optional synthesized audio clicks.
- **Accessible DOM**: SVG circuit gates are focusable `<g role="button" tabIndex={0}>` with tooltips and ARIA live announcements.
- **Motion Controls**: Complete respect for `prefers-reduced-motion: reduce`.
