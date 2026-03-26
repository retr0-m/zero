from fastapi import APIRouter, HTTPException
from models import IdeaRequest, QuickReadResult, FullAnalysisRequest, FullAnalysisResult
from services.ai import quick_read, full_analysis
from logger import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/quick-read", response_model=QuickReadResult)
async def route_quick_read(request: IdeaRequest) -> QuickReadResult:
    log.info("POST /api/quick-read")
    try:
        return await quick_read(request.idea)
    except RuntimeError as e:
        log.error("AI service error: %s", e)
        raise HTTPException(status_code=502, detail="AI service unavailable.")
    except Exception:
        log.exception("Unexpected error in /api/quick-read")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.post("/full-analysis", response_model=FullAnalysisResult)
async def route_full_analysis(request: FullAnalysisRequest) -> FullAnalysisResult:
    log.info("POST /api/full-analysis")
    try:
        return await full_analysis(request)
    except RuntimeError as e:
        log.error("AI service error: %s", e)
        raise HTTPException(status_code=502, detail="AI service unavailable.")
    except ValueError as e:
        log.warning("Parse error: %s", e)
        raise HTTPException(status_code=422, detail=f"Could not parse AI response: {e}")
    except Exception:
        log.exception("Unexpected error in /api/full-analysis")
        raise HTTPException(status_code=500, detail="Internal server error.")