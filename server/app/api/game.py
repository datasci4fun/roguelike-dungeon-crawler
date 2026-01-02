"""Game WebSocket API endpoint."""
import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import decode_token
from ..core.database import AsyncSessionLocal
from ..core.websocket import manager
from ..services.game_session import session_manager, GAME_ENGINE_AVAILABLE
from ..services.leaderboard_service import LeaderboardService


router = APIRouter(prefix="/game", tags=["game"])


async def get_user_from_token(token: str) -> Optional[tuple]:
    """Extract user ID and username from JWT token."""
    token_data = decode_token(token)
    if token_data:
        return (token_data.user_id, token_data.username)
    return None


async def record_game_result(user_id: int, stats: dict) -> Optional[dict]:
    """
    Record a completed game result to the leaderboard.

    Args:
        user_id: The user's ID
        stats: Game stats from end_session

    Returns:
        The recorded result data, or None if recording failed
    """
    if not stats:
        return None

    try:
        async with AsyncSessionLocal() as db:
            service = LeaderboardService(db)
            result = await service.record_game_result(
                user_id=user_id,
                victory=stats.get("victory", False),
                level_reached=stats.get("level_reached", 1),
                kills=stats.get("kills", 0),
                damage_dealt=stats.get("damage_dealt", 0),
                damage_taken=stats.get("damage_taken", 0),
                final_hp=stats.get("final_hp", 0),
                max_hp=stats.get("max_hp", 0),
                player_level=stats.get("player_level", 1),
                potions_used=stats.get("potions_used", 0),
                items_collected=stats.get("items_collected", 0),
                gold_collected=stats.get("gold_collected", 0),
                cause_of_death=stats.get("cause_of_death"),
                killed_by=stats.get("killed_by"),
                game_duration_seconds=stats.get("game_duration_seconds", 0),
                turns_taken=stats.get("turns_taken", 0),
                started_at=stats.get("started_at"),
                ghost_data=stats.get("ghost_data"),
            )
            return {
                "game_id": result.id,
                "score": result.score,
                "victory": result.victory,
            }
    except Exception as e:
        print(f"Error recording game result: {e}")
        return None




@router.websocket("/ws")
async def game_websocket(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """
    WebSocket endpoint for real-time game communication.

    Connect with: ws://localhost:8000/api/game/ws?token=<jwt_token>

    Message format (client -> server):
    {
        "action": "command",
        "command": "MOVE_UP" | "MOVE_DOWN" | "MOVE_LEFT" | "MOVE_RIGHT" | etc.
    }

    {
        "action": "new_game"
    }

    {
        "action": "quit"
    }

    Response format (server -> client):
    {
        "type": "game_state",
        "game_state": "PLAYING" | "DEAD" | "VICTORY",
        "player": {...},
        "dungeon": {...},
        "enemies": [...],
        "items": [...],
        "messages": [...],
        "events": [...]
    }

    {
        "type": "error",
        "message": "Error description"
    }
    """
    # Authenticate user from token
    user_info = await get_user_from_token(token)
    if not user_info:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return
    user_id, username = user_info

    # Check if game engine is available
    if not GAME_ENGINE_AVAILABLE:
        await websocket.accept()
        await websocket.send_json({
            "type": "error",
            "message": "Game engine not available on server"
        })
        await websocket.close(code=4002, reason="Game engine not available")
        return

    # Connect the WebSocket
    await manager.connect(websocket, user_id)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "message": "Connected to game server",
            "user_id": user_id,
        })

        # Main message loop
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_json()
                action = data.get("action")

                if action == "new_game":
                    # Start a new game session
                    session = await session_manager.create_session(user_id, username)
                    if session:
                        state = session_manager.serialize_game_state(session)
                        await websocket.send_json(state)
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Failed to create game session"
                        })

                elif action == "command":
                    # Process a game command
                    command = data.get("command", "")
                    session = await session_manager.get_session(user_id)

                    if not session:
                        await websocket.send_json({
                            "type": "error",
                            "message": "No active game session. Send 'new_game' first."
                        })
                        continue

                    result = await session_manager.process_command(
                        user_id, command, data.get("data")
                    )

                    if result:
                        await websocket.send_json(result)

                elif action == "get_state":
                    # Get current game state without processing a command
                    session = await session_manager.get_session(user_id)
                    if session:
                        state = session_manager.serialize_game_state(session)
                        await websocket.send_json(state)
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": "No active game session"
                        })

                elif action == "quit":
                    # End the game session and record result
                    stats = await session_manager.end_session(user_id)
                    recorded = await record_game_result(user_id, stats)
                    await websocket.send_json({
                        "type": "game_ended",
                        "stats": stats,
                        "recorded": recorded,
                    })

                elif action == "ping":
                    # Keep-alive ping
                    await websocket.send_json({"type": "pong"})

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
        # Clean up on disconnect and record game result
        stats = await session_manager.end_session(user_id)
        await record_game_result(user_id, stats)
        await manager.disconnect(user_id)

    except Exception as e:
        # Handle unexpected errors
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Server error: {str(e)}"
            })
        except:
            pass
        stats = await session_manager.end_session(user_id)
        await record_game_result(user_id, stats)
        await manager.disconnect(user_id)


@router.get("/status")
async def game_status():
    """Get game server status."""
    return {
        "engine_available": GAME_ENGINE_AVAILABLE,
        "active_connections": manager.get_connected_count(),
        "active_sessions": session_manager.get_active_session_count(),
    }
