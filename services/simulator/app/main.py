import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .models import (
    HealthResponse,
    MeasureRequest,
    MeasurementSample,
    ProtocolMetadata,
    SimulationRequest,
    SimulationResult
)
from .engine import run_superdense_simulation, sample_measurements
from .errors import (
    AppError,
    app_error_handler,
    generic_http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler
)

app = FastAPI(
    title="Quantum Superdense Coding Simulator API",
    description="Validated state-vector quantum simulation engine for quantum superdense coding.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Exception Handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, generic_http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# CORS Configuration
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)


@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    return HealthResponse()


@app.get("/api/v1/protocols/superdense", response_model=ProtocolMetadata, tags=["Protocol"])
async def get_protocol_metadata():
    return ProtocolMetadata(
        protocol="superdense-coding",
        title="Quantum Superdense Coding Protocol",
        summary="Transmits two classical bits by sending a single physical qubit using pre-shared entanglement.",
        basisOrdering="|q0 q1> with q0 as Alice (MSB) and q1 as Bob (LSB)",
        aliceEncodingMap={
            "00": {"gates": ["I"], "label": "Identity (I)", "math": "I"},
            "01": {"gates": ["X"], "label": "Bit Flip (X)", "math": "X"},
            "10": {"gates": ["Z"], "label": "Phase Flip (Z)", "math": "Z"},
            "11": {"gates": ["Z", "X"], "label": "Phase & Bit Flip (XZ)", "math": "X \\cdot Z"}
        },
        idealEndStateProbability=1.0
    )


@app.post("/api/v1/simulations", response_model=SimulationResult, tags=["Simulation"])
async def run_simulation(req: SimulationRequest):
    try:
        result = run_superdense_simulation(
            message=req.message,
            shots=req.shots,
            seed=req.seed,
            mode=req.mode,
            noise_rate=req.noiseRate
        )
        return result
    except ValueError as e:
        raise AppError(code="E_SIMULATION_MATH", message=str(e), status_code=422)


@app.post("/api/v1/simulations/measure", response_model=MeasurementSample, tags=["Simulation"])
async def sample_simulation_measurements(req: MeasureRequest):
    try:
        sample = sample_measurements(
            probs=req.probabilities,
            shots=req.shots,
            seed=req.seed
        )
        return sample
    except ValueError as e:
        raise AppError(code="E_SAMPLING_MATH", message=str(e), status_code=422)
