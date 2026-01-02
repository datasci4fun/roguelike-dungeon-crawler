"""Chat API endpoints including WebSocket for real-time messaging."""
import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db, AsyncSessionLocal
from ..core.security import decode_token, get_current_user
from ..models.user import User
from ..models.chat_message import ChatChannel
from ..services.chat_service import ChatService
from ..services.chat_manager import chat_manager
from ..schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatHistoryResponse,
    WhisperConversation,
    WhisperConversationsResponse,
    OnlineUser,
    OnlineUsersResponse,
    ChatStatus,
)


router = APIRouter(prefix="/api/chat", tags=["chat"])


# ============== REST Endpoints ==============

@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    limit: int = Query(50, ge=1, le=100),
    before_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Get global chat history.

    Messages are returned in chronological order (oldest first).
    Use before_id for pagination to get older messages.
    """
    service = ChatService(db)
    messages = await service.get_global_messages(limit=limit + 1, before_id=before_id)

    has_more = len(messages) > limit
    if has_more:
        messages = messages[1:]  # Remove oldest if we have more

    return ChatHistoryResponse(
        messages=[
            ChatMessageResponse(
                id=m.id,
                sender_id=m.sender_id,
                sender_username=m.sender.username if m.sender else "Unknown",
                sender_display_name=m.sender.display_name if m.sender else None,
                recipient_id=m.recipient_id,
                recipient_username=m.recipient.username if m.recipient else None,
                channel=m.channel,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ],
        has_more=has_more,
    )


@router.get("/whispers/{user_id}", response_model=ChatHistoryResponse)
async def get_whisper_history(
    user_id: int,
    limit: int = Query(50, ge=1, le=100),
    before_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get whisper conversation with another user.

    Messages are returned in chronological order.
    """
    service = ChatService(db)
    messages = await service.get_whispers(
        user_id=current_user.id,
        other_user_id=user_id,
        limit=limit + 1,
        before_id=before_id,
    )

    has_more = len(messages) > limit
    if has_more:
        messages = messages[1:]

    return ChatHistoryResponse(
        messages=[
            ChatMessageResponse(
                id=m.id,
                sender_id=m.sender_id,
                sender_username=m.sender.username if m.sender else "Unknown",
                sender_display_name=m.sender.display_name if m.sender else None,
                recipient_id=m.recipient_id,
                recipient_username=m.recipient.username if m.recipient else None,
                channel=m.channel,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ],
        has_more=has_more,
    )


@router.get("/whispers", response_model=WhisperConversationsResponse)
async def get_whisper_conversations(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get list of whisper conversations."""
    service = ChatService(db)
    conversations = await service.get_user_whisper_conversations(
        user_id=current_user.id,
        limit=limit,
    )

    return WhisperConversationsResponse(
        conversations=[
            WhisperConversation(
                user_id=c["user_id"],
                username=c["username"],
                display_name=c["display_name"],
                last_message=c["last_message"],
                last_message_at=c["last_message_at"],
            )
            for c in conversations
        ]
    )


@router.get("/online", response_model=OnlineUsersResponse)
async def get_online_users():
    """Get list of users currently online in chat."""
    users = chat_manager.get_online_users()

    return OnlineUsersResponse(
        users=[
            OnlineUser(
                user_id=u["user_id"],
                username=u["username"],
                connected_at=u["connected_at"],
            )
            for u in users
        ],
        count=len(users),
    )


@router.get("/status", response_model=ChatStatus)
async def get_chat_status(
    current_user: User = Depends(get_current_user),
):
    """Get chat system status for current user."""
    return ChatStatus(
        online_count=chat_manager.get_online_count(),
        is_connected=chat_manager.is_online(current_user.id),
    )


# ============== WebSocket Endpoint ==============

@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """
    WebSocket endpoint for real-time chat.

    Connect with: ws://localhost:8000/api/chat/ws?token=<jwt_token>

    Client -> Server messages:
    {
        "action": "send",
        "content": "Hello world",
        "channel": "global"  // or "whisper"
        "recipient_id": 123  // required for whispers
    }

    {
        "action": "ping"
    }

    Server -> Client messages:
    {
        "type": "chat_message",
        "channel": "global",
        "message": {
            "id": 1,
            "sender_id": 123,
            "sender_username": "player1",
            "content": "Hello",
            "created_at": "2024-01-01T12:00:00"
        }
    }

    {
        "type": "whisper",
        "message": {...}
    }

    {
        "type": "system_message",
        "content": "Welcome to chat",
        "created_at": "..."
    }

    {
        "type": "user_joined",
        "user_id": 123,
        "username": "player1"
    }

    {
        "type": "user_left",
        "user_id": 123,
        "username": "player1"
    }

    {
        "type": "online_users",
        "users": [...]
    }
    """
    # Authenticate user
    token_data = decode_token(token)
    if not token_data:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    user_id = token_data.user_id
    username = token_data.username

    # Connect to chat
    await chat_manager.connect(websocket, user_id, username)

    try:
        # Send welcome message and online users
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to chat",
            "user_id": user_id,
            "username": username,
        })

        # Send current online users
        await websocket.send_json({
            "type": "online_users",
            "users": chat_manager.get_online_users(),
        })

        # Broadcast user joined
        await chat_manager.broadcast({
            "type": "user_joined",
            "user_id": user_id,
            "username": username,
        }, exclude_user_id=user_id)

        # Main message loop
        while True:
            try:
                data = await websocket.receive_json()
                action = data.get("action")

                if action == "send":
                    content = data.get("content", "").strip()
                    channel = data.get("channel", "global")
                    recipient_id = data.get("recipient_id")

                    if not content:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Message content is required"
                        })
                        continue

                    # Save message to database
                    async with AsyncSessionLocal() as db:
                        service = ChatService(db)
                        message = await service.send_message(
                            sender_id=user_id,
                            content=content,
                            channel=channel,
                            recipient_id=recipient_id,
                        )

                        if not message:
                            await websocket.send_json({
                                "type": "error",
                                "message": "Failed to send message (rate limited or invalid)"
                            })
                            continue

                        # Broadcast or send whisper
                        if channel == ChatChannel.WHISPER.value:
                            await chat_manager.send_whisper(
                                sender_id=user_id,
                                sender_username=username,
                                recipient_id=recipient_id,
                                content=content,
                                message_id=message.id,
                                created_at=message.created_at.isoformat(),
                            )
                        else:
                            await chat_manager.broadcast_message(
                                sender_id=user_id,
                                sender_username=username,
                                content=content,
                                message_id=message.id,
                                created_at=message.created_at.isoformat(),
                            )

                elif action == "ping":
                    await websocket.send_json({"type": "pong"})

                elif action == "get_online":
                    await websocket.send_json({
                        "type": "online_users",
                        "users": chat_manager.get_online_users(),
                    })

                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown action: {action}"
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON message"
                })

    except WebSocketDisconnect:
        # Broadcast user left
        await chat_manager.broadcast({
            "type": "user_left",
            "user_id": user_id,
            "username": username,
        })
        await chat_manager.disconnect(user_id)

    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Server error: {str(e)}"
            })
        except:
            pass
        await chat_manager.disconnect(user_id)
