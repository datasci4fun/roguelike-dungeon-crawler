"""Game WebSocket API endpoint."""
import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from jose import JWTError

from ..core.security import decode_token
from ..core.websocket import manager
from ..services.game_session import session_manager, GAME_ENGINE_AVAILABLE


router = APIRouter(prefix="/game", tags=["game"])


async def get_user_from_token(token: str) -> Optional[int]:
    """Extract user ID from JWT token."""
    token_data = decode_token(token)
    if token_data:
        return token_data.user_id
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
    user_id = await get_user_from_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

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
                    session = await session_manager.create_session(user_id)
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
                    # End the game session
                    stats = await session_manager.end_session(user_id)
                    await websocket.send_json({
                        "type": "game_ended",
                        "stats": stats,
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
        # Clean up on disconnect
        await session_manager.end_session(user_id)
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
        await session_manager.end_session(user_id)
        await manager.disconnect(user_id)


@router.get("/status")
async def game_status():
    """Get game server status."""
    return {
        "engine_available": GAME_ENGINE_AVAILABLE,
        "active_connections": manager.get_connected_count(),
        "active_sessions": session_manager.get_active_session_count(),
    }
