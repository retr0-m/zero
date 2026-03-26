import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from db import get_db
from models import ChatRequest, ChatMessageResponse
from db import User, Idea, ChatMessage
from services.auth import get_current_user
from services.ai import chat_response
from logger import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/api/ideas/{idea_id}/chat", tags=["chat"])


@router.post("/", response_model=ChatMessageResponse)
async def send_message(
    idea_id: uuid.UUID,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    # verify ownership
    result = await db.execute(
        select(Idea)
        .where(Idea.id == idea_id, Idea.user_id == current_user.id)
        .options(selectinload(Idea.chat_messages))
    )
    idea = result.scalar_one_or_none()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found.")

    # build history for context
    history = [
        {"role": m.role, "content": m.content}
        for m in sorted(idea.chat_messages, key=lambda m: m.created_at)
    ]

    idea_context = {
        "title": idea.title,
        "summary": idea.description,
        "viability_score": idea.viability_score,
        "original_prompt": idea.original_prompt,
    }

    # save user message
    user_msg = ChatMessage(idea_id=idea_id, role="user", content=request.message)
    db.add(user_msg)
    await db.flush()

    # get AI reply
    try:
        reply_content = await chat_response(idea_context, history, request.message)
    except RuntimeError as e:
        log.error("Chat AI error: %s", e)
        raise HTTPException(status_code=502, detail="AI service unavailable.")

    # save assistant message
    assistant_msg = ChatMessage(idea_id=idea_id, role="assistant", content=reply_content)
    db.add(assistant_msg)
    await db.flush()

    log.info("Chat message saved for idea=%s", idea_id)
    
    assistant_msg_formatted = _format_chat_message(assistant_msg)
    await db.commit()  # commit to save both user and assistant messages
    return ChatMessageResponse.model_validate(assistant_msg_formatted)

def _format_chat_message(msg: ChatMessage) -> dict:
    return {
        "id": str(msg.id),
        "role": msg.role,
        "content": msg.content,
        "created_at": msg.created_at.isoformat(),
    }