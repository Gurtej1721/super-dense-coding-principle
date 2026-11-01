from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    loc = ".".join(str(l) for l in first_error.get("loc", []))
    msg = first_error.get("msg", "Invalid request parameter")

    code = "E_VALIDATION"
    if "message" in loc:
        code = "E_VALIDATION_MESSAGE"
    elif "shots" in loc:
        code = "E_VALIDATION_SHOTS"
    elif "seed" in loc:
        code = "E_VALIDATION_SEED"
    elif "probabilities" in loc:
        code = "E_VALIDATION_PROBABILITIES"

    # Sanitize errors to be strictly JSON serializable
    sanitized_errors = []
    for err in errors:
        sanitized_errors.append({
            "loc": err.get("loc"),
            "msg": str(err.get("msg")),
            "type": str(err.get("type"))
        })

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": code,
                "message": f"Validation error at {loc}: {msg}",
                "details": sanitized_errors
            }
        }
    )


async def generic_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"E_HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "details": {}
            }
        }
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "E_INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred during quantum simulation.",
                "details": {}
            }
        }
    )
