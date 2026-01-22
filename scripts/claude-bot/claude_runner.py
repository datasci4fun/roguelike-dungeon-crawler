from __future__ import annotations

import json, subprocess
from typing import Any, Dict, Optional, List

class ClaudeError(RuntimeError):
    pass

def run_claude(prompt: str, *, allowed_tools: Optional[str]=None, json_schema: Optional[Dict[str, Any]]=None, max_turns: int=8) -> Dict[str, Any]:
    cmd: List[str] = ["claude", "-p", prompt, "--output-format", "json", "--max-turns", str(max_turns)]
    if allowed_tools:
        cmd += ["--allowedTools", allowed_tools]
    if json_schema is not None:
        cmd += ["--json-schema", json.dumps(json_schema)]
    cp = subprocess.run(cmd, text=True, capture_output=True)
    if cp.returncode != 0:
        raise ClaudeError(f"claude failed (rc={cp.returncode}):\nSTDOUT:\n{cp.stdout}\nSTDERR:\n{cp.stderr}")
    try:
        return json.loads(cp.stdout)
    except Exception as e:
        raise ClaudeError(f"claude output was not JSON. error={e}\nRAW:\n{cp.stdout[:2000]}")
