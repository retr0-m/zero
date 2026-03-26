from pyexpat import model
import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from db import get_db
from models import SaveIdeaRequest, IdeaListItem, IdeaDetail
from db import User, Idea, IdeaTab
from services.auth import get_current_user
from logger import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/api/ideas", tags=["ideas"])


@router.get("/", response_model=list[IdeaListItem])
async def list_ideas(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[IdeaListItem]:

    user_repr = getattr(current_user, "username", getattr(current_user, "email", str(current_user.id)))
    log.info("Listing ideas for user: %s", user_repr)

    result = await db.execute(
        select(Idea)
        .where(Idea.user_id == current_user.id)
        .order_by(Idea.created_at.desc())
    )
    ideas = result.scalars().all()

    model_validations = []
    for i in ideas:
        # Convert fields before validation
        converted = {
            "id": str(i.id),
            "title": i.title,
            "description": i.description,
            "viability_score": i.viability_score,
            "original_prompt": i.original_prompt,
            "created_at": i.created_at.isoformat() if i.created_at else None,
            # include other fields expected by IdeaListItem
        }
        model_validations.append(IdeaListItem.model_validate(converted))

    return model_validations


@router.post("/", response_model=IdeaDetail, status_code=status.HTTP_201_CREATED)
async def save_idea(
    request: SaveIdeaRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IdeaDetail:
    a = request.analysis

    idea = Idea(
        user_id=str(current_user.id),
        title=a.title,
        description=a.summary,
        viability_score=a.viability_score,
        original_prompt=request.original_prompt,
    )
    db.add(idea)
    await db.flush()

    # split full analysis into per-tab JSONB payloads
    tabs_payload = {
        "money": {
            "investment": a.investment.model_dump(),
            "revenue": a.revenue.model_dump(),
            "timeline": a.timeline.model_dump(),
        },
        "plan": {
            "business_plan": a.business_plan,
            "roadmap": [r.model_dump() for r in a.roadmap],
        },
        "problems": {
            "problems": [p.model_dump() for p in a.problems],
        },
        "people": {
            "contacts_needed": [c.model_dump() for c in a.contacts_needed],
        },
    }

    for tab_name, payload in tabs_payload.items():
        db.add(IdeaTab(idea_id=idea.id, tab=tab_name, payload=payload))
    await db.flush()
    log.info("Idea created: id=%s user=%s", idea.id, current_user.id)
    
    
    log.info("Built idea detail for idea_id=%s", idea.id)
    await db.commit()  # commit to release any locks and ensure data consistency
    log.info("Committed DB session after building idea detail for idea_id=%s", idea.id)
    
    return await _build_idea_detail(idea.id, db)


@router.get("/{idea_id}", response_model=IdeaDetail)
async def get_idea(
    idea_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> IdeaDetail:
    idea = await _get_owned_idea(idea_id, current_user.id, db)
    return await _build_idea_detail(idea.id, db)


@router.delete("/{idea_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_idea(
    idea_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    idea = await _get_owned_idea(idea_id, current_user.id, db)
    await db.delete(idea)
    log.info("Idea deleted: id=%s user=%s", idea_id, current_user.id)
    await db.commit()


async def _get_owned_idea(idea_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Idea:
    user_id = uuid.UUID(str(user_id))  
    log.info(f"Fetching idea {idea_id} for user {user_id}")
    result = await db.execute(
        select(Idea).where(Idea.id == idea_id, Idea.user_id == user_id)
    )
    idea = result.scalar_one_or_none()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found.")
    return idea


async def _build_idea_detail(idea_id: uuid.UUID, db: AsyncSession) -> IdeaDetail:
    result = await db.execute(
        select(Idea)
        .where(Idea.id == idea_id)
        .options(selectinload(Idea.tabs), selectinload(Idea.chat_messages))
    )
    idea = result.scalar_one()

    tabs_dict = {t.tab: t.payload for t in idea.tabs}
    messages = [
        {"id": str(m.id), "role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
        for m in sorted(idea.chat_messages, key=lambda m: m.created_at)
    ]
    
    return IdeaDetail(
        id=str(idea.id),
        title=idea.title,
        description=idea.description,
        viability_score=idea.viability_score,
        original_prompt=idea.original_prompt,
        created_at=idea.created_at.isoformat(),
        tabs=tabs_dict,
        chat_messages=messages,
    )