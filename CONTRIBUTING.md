# Contributing to Quantum Superdense Coding Simulator

Thank you for your interest in contributing to the Quantum Superdense Coding Simulator.

## Development Workflow

1. **Prerequisites**:
   - Node.js >= 18 (Node 20+ recommended)
   - Python >= 3.10 (3.11 - 3.14 supported)
   - npm >= 9

2. **Repository Structure**:
   - `packages/contracts`: Shared TypeScript data schemas and API contracts.
   - `packages/quantum-core`: Pure TypeScript state-vector quantum engine.
   - `services/simulator`: FastAPI + NumPy scientific backend service.
   - `apps/web`: Next.js 14+ App Router frontend.
   - `tests/`: Integration and end-to-end test suites.
   - `docs/`: Technical and mathematical documentation.

3. **Running Locally**:
   - Install root and JS packages: `npm install`
   - Setup Python environment:
     ```bash
     cd services/simulator
     python -m venv .venv
     # Windows:
     .venv\Scripts\activate
     # Linux/macOS:
     source .venv/bin/activate
     pip install -r requirements.txt
     ```
   - Run tests:
     - Python: `pytest`
     - TypeScript / Core: `npm test`
   - Start development servers:
     - Backend: `uvicorn app.main:app --reload --port 8000`
     - Frontend: `npm run dev --workspace=apps/web`

4. **Testing Standards**:
   - Scientific invariants: state norms must equal 1 within $10^{-9}$ tolerance.
   - Probability normalization: $\sum |a_i|^2 = 1.0 \pm 10^{-9}$.
   - All 4 messages (`00`, `01`, `10`, `11`) must verify deterministic recovery in tests.
   - Zero tolerance for skipped or weakened test assertions.

5. **Code Style & Accessibility**:
   - Strict TypeScript (`noImplicitAny`, strict null checks).
   - WCAG 2.2 AA compliant contrast and keyboard accessibility.
   - Honor `prefers-reduced-motion`.
