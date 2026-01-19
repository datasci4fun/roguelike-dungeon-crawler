#!/usr/bin/env python3
import ast
import hashlib
import io
import json
import os
import sys
import tokenize
from pathlib import Path
from typing import Any, Generator

def read_cfg(p: str) -> dict[str, Any]:
    return json.loads(Path(p).read_text("utf-8"))

def should_exclude(rel_parts: tuple[str, ...], exclude_dirs: list[str]) -> bool:
    return any(p in exclude_dirs for p in rel_parts)

def walk(root: Path, cfg: dict[str, Any]) -> Generator[Path, None, None]:
    for dirpath, dirnames, filenames in os.walk(root):
        rel = Path(dirpath).relative_to(root)
        if should_exclude(rel.parts, cfg["exclude_dirs"]):
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if d not in cfg["exclude_dirs"]]
        for fn in filenames:
            p = Path(dirpath) / fn
            if p.suffix in cfg["include_ext"]:
                yield p

def sha1(s: str) -> str:
    return hashlib.sha1(s.encode("utf-8")).hexdigest()

def token_norm(tok_type: int, tok_str: str, mode: str) -> str:
    # mode: type1 keeps identifiers/literals; type2 normalizes them
    if mode == "type1":
        return f"{tokenize.tok_name[tok_type]}:{tok_str}"
    # type2:
    if tok_type == tokenize.NAME:
        return "NAME:ID"
    if tok_type in (tokenize.NUMBER, tokenize.STRING):
        return f"{tokenize.tok_name[tok_type]}:LIT"
    return f"{tokenize.tok_name[tok_type]}:{tok_str}"

def scan_tokens(py_src: str, mode: str) -> tuple[list[str], list[int]]:
    toks: list[str] = []
    lines: list[int] = []
    g = tokenize.generate_tokens(io.StringIO(py_src).readline)
    for tok in g:
        if tok.type in (tokenize.NL, tokenize.NEWLINE, tokenize.INDENT, tokenize.DEDENT, tokenize.ENDMARKER):
            continue
        if tok.type == tokenize.COMMENT:
            continue
        toks.append(token_norm(tok.type, tok.string, mode))
        lines.append(tok.start[0])
    return toks, lines

class Canon(ast.NodeTransformer):
    def __init__(self):
        super().__init__()

    def generic_visit(self, node: ast.AST) -> ast.AST:
        for attr in ("lineno", "col_offset", "end_lineno", "end_col_offset"):
            if hasattr(node, attr):
                setattr(node, attr, None)
        return super().generic_visit(node)

    def visit_Name(self, node: ast.Name):
        node.id = "ID"
        return self.generic_visit(node)

    def visit_Constant(self, node: ast.Constant):
        # normalize literals
        node.value = "LIT"
        return self.generic_visit(node)

def node_fingerprint(node: ast.AST) -> str:
    # deterministic structural dump
    return ast.dump(node, annotate_fields=True, include_attributes=False)

def ast_hashes(tree: ast.AST) -> list[dict[str, Any]]:
    # bottom-up hashes; record per-node hash + span if available
    out: list[dict[str, Any]] = []

    def walk(n: ast.AST) -> str:
        child_hashes: list[str] = []
        for ch in ast.iter_child_nodes(n):
            child_hashes.append(walk(ch))
        fp = node_fingerprint(n) + "|" + "|".join(child_hashes)
        h = sha1(fp)
        # node count proxy: 1 + number of children
        size = 1 + len(child_hashes)
        start = getattr(n, "lineno", None) or 1
        end = getattr(n, "end_lineno", None) or start
        out.append({"hash": h, "startLine": start, "endLine": end, "sizeNodes": size})
        return h

    walk(tree)
    return out

def main():
    cfg_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not cfg_path:
        raise SystemExit("Usage: py_analyze.py <config.json>")
    cfg = read_cfg(cfg_path)
    root = Path.cwd()

    out_dir = Path(cfg["paths"]["out_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    token_out = out_dir / "py_tokens.jsonl"
    ast_out = out_dir / "py_ast.jsonl"
    token_out.write_text("", "utf-8")
    ast_out.write_text("", "utf-8")

    for p in walk(root, cfg):
        if p.suffix != ".py":
            continue
        try:
            src = p.read_text("utf-8")
        except UnicodeDecodeError:
            continue

        t1, l1 = scan_tokens(src, "type1")
        t2, l2 = scan_tokens(src, "type2")

        try:
            tree = ast.parse(src)
            tree = Canon().visit(tree)
            ast.fix_missing_locations(tree)
            hashes = ast_hashes(tree)
        except SyntaxError:
            hashes = []

        with token_out.open("a", encoding="utf-8") as f:
            f.write(json.dumps({
                "path": str(p.relative_to(root)),
                "lang": "py",
                "type1_tokens": t1,
                "type1_lines": l1,
                "type2_tokens": t2,
                "type2_lines": l2
            }) + "\n")

        with ast_out.open("a", encoding="utf-8") as f:
            for r in hashes:
                f.write(json.dumps({
                    "path": str(p.relative_to(root)),
                    "lang": "py",
                    **r
                }) + "\n")

if __name__ == "__main__":
    main()
