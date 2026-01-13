#!/usr/bin/env python3
"""
Codebase Health Scanner

Scans the repository and generates web/src/data/codebaseHealthData.ts
with file statistics and refactor suggestions.

Usage:
    python scripts/generate_codebase_health.py
"""

import os
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from collections import defaultdict

# Repository root (parent of scripts/)
REPO_ROOT = Path(__file__).parent.parent
OUTPUT_FILE = REPO_ROOT / "web" / "src" / "data" / "codebaseHealthData.ts"

# Directories to exclude
EXCLUDE_DIRS = {
    'node_modules', '.venv', '__pycache__', '.git', '.pytest_cache',
    'dist', 'build', '.next', 'coverage', '.mypy_cache', 'eggs', '*.egg-info'
}

# File extensions to include
INCLUDE_EXTENSIONS = {
    '.py', '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.md', '.json', '.yaml', '.yml'
}

# Size thresholds
SIZE_THRESHOLDS = {
    'small': (0, 99),
    'medium': (100, 299),
    'large': (300, 499),
    'xlarge': (500, float('inf'))
}


@dataclass
class FileStats:
    """Statistics for a single file."""
    path: str
    loc: int
    nesting_depth: int
    file_type: str
    area: str
    size_category: str


@dataclass
class RefactorItem:
    """A suggested refactoring task."""
    id: str
    title: str
    description: str
    priority: str
    status: str = 'pending'
    category: List[str] = field(default_factory=list)
    effort: str = 'medium'
    affected_files: List[str] = field(default_factory=list)
    details: List[str] = field(default_factory=list)
    automated_reason: str = ''
    technique: str = ''  # Specific refactoring approach


def should_exclude(path: Path) -> bool:
    """Check if path should be excluded from scanning."""
    parts = path.parts
    for part in parts:
        if part in EXCLUDE_DIRS:
            return True
        # Handle glob patterns like *.egg-info
        for exclude in EXCLUDE_DIRS:
            if '*' in exclude and part.endswith(exclude.replace('*', '')):
                return True
    return False


def count_loc(file_path: Path) -> int:
    """Count lines of code (excluding blank lines and comments)."""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception:
        return 0

    ext = file_path.suffix.lower()
    loc = 0
    in_block_comment = False

    for line in lines:
        stripped = line.strip()

        # Skip blank lines
        if not stripped:
            continue

        # Handle Python/JS/TS comments
        if ext in ('.py',):
            # Python single line comment
            if stripped.startswith('#'):
                continue
            # Python docstrings (simplified)
            if stripped.startswith('"""') or stripped.startswith("'''"):
                if stripped.count('"""') >= 2 or stripped.count("'''") >= 2:
                    continue  # Single line docstring
                in_block_comment = not in_block_comment
                continue
            if in_block_comment:
                continue

        elif ext in ('.ts', '.tsx', '.js', '.jsx', '.css', '.scss'):
            # Single line comment
            if stripped.startswith('//'):
                continue
            # Block comment start
            if stripped.startswith('/*'):
                if '*/' in stripped:
                    continue  # Single line block comment
                in_block_comment = True
                continue
            # Block comment end
            if '*/' in stripped:
                in_block_comment = False
                continue
            if in_block_comment:
                continue

        elif ext == '.md':
            # Count all non-blank lines in markdown
            pass

        loc += 1

    return loc


def get_nesting_depth(rel_path: str) -> int:
    """Get the directory nesting depth from repo root."""
    return len(Path(rel_path).parts) - 1  # -1 because we don't count the file itself


def classify_file_type(rel_path: str, filename: str) -> str:
    """Classify the file type based on path and name patterns."""
    path_lower = rel_path.lower().replace('\\', '/')
    name_lower = filename.lower()

    # Test files
    if '/tests/' in path_lower or name_lower.endswith('.test.ts') or name_lower.endswith('.test.tsx'):
        return 'test'

    # Frontend classifications
    if path_lower.startswith('web/'):
        if '/components/' in path_lower and (name_lower.endswith('.tsx') or name_lower.endswith('.ts')):
            if name_lower.startswith('use'):
                return 'hook'
            return 'component'
        if '/pages/' in path_lower and name_lower.endswith('.tsx'):
            return 'page'
        if '/hooks/' in path_lower or name_lower.startswith('use'):
            return 'hook'
        if '/services/' in path_lower:
            return 'service'
        if '/contexts/' in path_lower:
            return 'context'
        if '/types/' in path_lower or name_lower.endswith('.d.ts'):
            return 'types'
        if '/data/' in path_lower:
            return 'data'
        if '/config/' in path_lower:
            return 'config'
        if name_lower.endswith('.css') or name_lower.endswith('.scss'):
            return 'style'

    # Backend classifications
    if path_lower.startswith('server/'):
        if '/models/' in path_lower:
            return 'model'
        if '/schemas/' in path_lower:
            return 'schema'
        if '/api/' in path_lower:
            return 'api'
        if '/services/' in path_lower:
            return 'service'
        if '/config/' in path_lower:
            return 'config'

    # Core game classifications
    if path_lower.startswith('src/'):
        if '/managers/' in path_lower:
            return 'manager'
        if '/ui/' in path_lower:
            return 'ui'
        if '/entities/' in path_lower:
            return 'entity'
        if '/world/' in path_lower:
            return 'world'
        if '/combat/' in path_lower:
            return 'combat'
        if '/story/' in path_lower:
            return 'story'
        if '/items/' in path_lower:
            return 'items'
        if '/core/' in path_lower:
            return 'core'
        return 'module'

    # Generic classifications by name
    if 'util' in name_lower or 'helper' in name_lower or 'common' in name_lower:
        return 'util'
    if 'constant' in name_lower or 'config' in name_lower:
        return 'constants'
    if name_lower.endswith('.css') or name_lower.endswith('.scss'):
        return 'style'
    if name_lower.endswith('.md'):
        return 'docs'

    return 'other'


def classify_area(rel_path: str) -> str:
    """Classify which area of the codebase a file belongs to."""
    path_lower = rel_path.lower().replace('\\', '/')

    if path_lower.startswith('web/'):
        return 'frontend'
    if path_lower.startswith('server/'):
        return 'backend'
    if path_lower.startswith('src/'):
        return 'core'
    if path_lower.startswith('tests/'):
        return 'tests'
    if path_lower.startswith('docs/') or path_lower.endswith('.md'):
        return 'docs'
    if path_lower.startswith('scripts/'):
        return 'scripts'
    if path_lower.startswith('.claude/'):
        return 'config'

    # Root level config files
    root_configs = {
        'package.json', 'tsconfig.json', 'vite.config.ts', 'docker-compose.yml',
        'requirements.txt', '.gitignore', 'pyproject.toml', 'setup.py'
    }
    if Path(rel_path).name.lower() in root_configs:
        return 'config'

    return 'other'


def get_size_category(loc: int) -> str:
    """Categorize file by lines of code."""
    for category, (min_loc, max_loc) in SIZE_THRESHOLDS.items():
        if min_loc <= loc <= max_loc:
            return category
    return 'xlarge'


@dataclass
class FileAnalysis:
    """Analysis of a file's internal structure."""
    classes: List[str] = field(default_factory=list)
    functions: List[str] = field(default_factory=list)
    components: List[str] = field(default_factory=list)
    hooks: List[str] = field(default_factory=list)
    interfaces: List[str] = field(default_factory=list)
    large_functions: List[Tuple[str, int]] = field(default_factory=list)  # (name, line_count)
    decorators: List[str] = field(default_factory=list)
    css_sections: List[str] = field(default_factory=list)


def analyze_python_file(file_path: Path) -> FileAnalysis:
    """Analyze a Python file to extract structure information."""
    analysis = FileAnalysis()
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
    except Exception:
        return analysis

    # Find classes
    class_pattern = re.compile(r'^class\s+(\w+)')
    for line in lines:
        match = class_pattern.match(line)
        if match:
            analysis.classes.append(match.group(1))

    # Find top-level functions and their sizes
    func_pattern = re.compile(r'^def\s+(\w+)\s*\(')
    current_func = None
    func_start = 0
    for i, line in enumerate(lines):
        match = func_pattern.match(line)
        if match:
            # Close previous function
            if current_func:
                func_lines = i - func_start
                analysis.functions.append(current_func)
                if func_lines > 50:
                    analysis.large_functions.append((current_func, func_lines))
            current_func = match.group(1)
            func_start = i
    # Don't forget the last function
    if current_func:
        func_lines = len(lines) - func_start
        analysis.functions.append(current_func)
        if func_lines > 50:
            analysis.large_functions.append((current_func, func_lines))

    # Find decorators (for API routes, etc.)
    decorator_pattern = re.compile(r'^@(\w+)')
    for line in lines:
        match = decorator_pattern.match(line.strip())
        if match:
            dec = match.group(1)
            if dec not in analysis.decorators:
                analysis.decorators.append(dec)

    return analysis


def analyze_typescript_file(file_path: Path) -> FileAnalysis:
    """Analyze a TypeScript/React file to extract structure information."""
    analysis = FileAnalysis()
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            lines = content.split('\n')
    except Exception:
        return analysis

    # Find React components (function components and arrow functions)
    # Pattern: export function ComponentName or const ComponentName =
    func_component = re.compile(r'(?:export\s+)?function\s+([A-Z]\w+)')
    arrow_component = re.compile(r'(?:export\s+)?const\s+([A-Z]\w+)\s*[=:]\s*(?:\([^)]*\)|[^=])*=>')

    for line in lines:
        match = func_component.search(line)
        if match:
            name = match.group(1)
            if not name.startswith('use'):
                analysis.components.append(name)
        match = arrow_component.search(line)
        if match:
            name = match.group(1)
            if not name.startswith('use'):
                analysis.components.append(name)

    # Find hooks (functions starting with 'use')
    hook_pattern = re.compile(r'(?:export\s+)?(?:function|const)\s+(use\w+)')
    for line in lines:
        match = hook_pattern.search(line)
        if match:
            analysis.hooks.append(match.group(1))

    # Find interfaces and types
    interface_pattern = re.compile(r'(?:export\s+)?(?:interface|type)\s+(\w+)')
    for line in lines:
        match = interface_pattern.search(line)
        if match:
            analysis.interfaces.append(match.group(1))

    # Find large functions (simplified - count lines between function start and next function/end)
    func_pattern = re.compile(r'(?:function|const)\s+(\w+)\s*(?:=|:|\()')
    current_func = None
    func_start = 0
    brace_count = 0

    for i, line in enumerate(lines):
        match = func_pattern.search(line)
        if match and brace_count == 0:
            if current_func:
                func_lines = i - func_start
                if func_lines > 80:
                    analysis.large_functions.append((current_func, func_lines))
            current_func = match.group(1)
            func_start = i

    return analysis


def analyze_css_file(file_path: Path) -> FileAnalysis:
    """Analyze a CSS file to extract major sections."""
    analysis = FileAnalysis()
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return analysis

    # Find top-level class selectors to identify sections
    selector_pattern = re.compile(r'^\.([a-zA-Z][\w-]*)\s*\{', re.MULTILINE)
    selectors = selector_pattern.findall(content)

    # Group by prefix (e.g., .battle-*, .hud-*, .menu-*)
    prefixes = defaultdict(int)
    for sel in selectors:
        parts = sel.split('-')
        if len(parts) > 1:
            prefixes[parts[0]] += 1
        else:
            prefixes[sel] += 1

    # Get the top section prefixes
    sorted_prefixes = sorted(prefixes.items(), key=lambda x: -x[1])
    analysis.css_sections = [p[0] for p in sorted_prefixes[:5] if p[1] >= 3]

    return analysis


def generate_technique(file_path: str, analysis: FileAnalysis, file_type: str, loc: int) -> str:
    """Generate a specific refactoring technique based on file analysis."""
    path = Path(file_path)
    filename = path.stem
    ext = path.suffix

    # Python files
    if ext == '.py':
        techniques = []

        # If has multiple large classes, suggest splitting by class
        if len(analysis.classes) >= 3:
            class_list = ', '.join(f'`{c}`' for c in analysis.classes[:4])
            techniques.append(f"Extract classes into separate modules: {class_list}")
        elif len(analysis.classes) == 2:
            techniques.append(f"Split into `{analysis.classes[0].lower()}.py` and `{analysis.classes[1].lower()}.py`")

        # If has many functions, group by responsibility
        if len(analysis.functions) > 15:
            # Try to identify groupings by prefix
            prefixes = defaultdict(list)
            for func in analysis.functions:
                parts = func.split('_')
                if len(parts) > 1 and parts[0] not in ('get', 'set', 'is', 'has', 'do', 'on'):
                    prefixes[parts[0]].append(func)

            if prefixes:
                groups = sorted(prefixes.items(), key=lambda x: -len(x[1]))[:3]
                if groups and len(groups[0][1]) >= 3:
                    group_names = [f"`{g[0]}_*.py`" for g in groups if len(g[1]) >= 2]
                    if group_names:
                        techniques.append(f"Group related functions into: {', '.join(group_names)}")

        # Large functions suggest extraction
        if analysis.large_functions:
            large = analysis.large_functions[:3]
            func_names = ', '.join(f'`{f[0]}` ({f[1]} lines)' for f in large)
            techniques.append(f"Break down large functions: {func_names}")

        # API routes can be split by decorator groups
        if 'router' in analysis.decorators or 'app' in analysis.decorators:
            techniques.append("Split API routes into domain-specific router modules")

        if techniques:
            return ' | '.join(techniques)
        return "Identify logical domains and extract into focused modules"

    # TypeScript/React files
    elif ext in ('.tsx', '.ts'):
        techniques = []

        # Multiple components suggest splitting
        if len(analysis.components) >= 2:
            comp_list = ', '.join(f'`{c}`' for c in analysis.components[:4])
            techniques.append(f"Extract components to separate files: {comp_list}")

        # Hooks should be in their own files
        if analysis.hooks:
            hook_list = ', '.join(f'`{h}`' for h in analysis.hooks[:3])
            techniques.append(f"Move hooks to `hooks/` directory: {hook_list}")

        # Many interfaces suggest a types file
        if len(analysis.interfaces) >= 5:
            techniques.append(f"Extract {len(analysis.interfaces)} interfaces to `types.ts`")

        # Large functions in components
        if analysis.large_functions:
            large = analysis.large_functions[:2]
            if large:
                func_names = ', '.join(f'`{f[0]}`' for f in large)
                techniques.append(f"Extract logic from large functions: {func_names}")

        # Component-specific suggestions
        if 'Renderer' in filename or '3D' in filename:
            techniques.append("Separate rendering logic, scene setup, and animation into dedicated modules")
        elif 'Form' in filename:
            techniques.append("Extract form validation and submission logic to custom hooks")
        elif 'List' in filename or 'Table' in filename:
            techniques.append("Extract row/item components and pagination logic")

        if techniques:
            return ' | '.join(techniques)
        return "Apply container/presenter pattern and extract reusable UI pieces"

    # CSS files
    elif ext in ('.css', '.scss'):
        if analysis.css_sections:
            sections = ', '.join(f'`{s}-*.css`' for s in analysis.css_sections[:3])
            return f"Split by component prefix into: {sections}"
        return "Split into component-scoped CSS modules"

    return "Analyze file structure and extract cohesive modules"


def scan_repository() -> List[FileStats]:
    """Scan all files in the repository."""
    files: List[FileStats] = []

    for root, dirs, filenames in os.walk(REPO_ROOT):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for filename in filenames:
            file_path = Path(root) / filename
            rel_path = str(file_path.relative_to(REPO_ROOT))

            # Skip excluded paths
            if should_exclude(file_path.relative_to(REPO_ROOT)):
                continue

            # Only include certain extensions
            if file_path.suffix.lower() not in INCLUDE_EXTENSIONS:
                continue

            loc = count_loc(file_path)
            nesting = get_nesting_depth(rel_path)
            file_type = classify_file_type(rel_path, filename)
            area = classify_area(rel_path)
            size_cat = get_size_category(loc)

            files.append(FileStats(
                path=rel_path.replace('\\', '/'),
                loc=loc,
                nesting_depth=nesting,
                file_type=file_type,
                area=area,
                size_category=size_cat
            ))

    # Sort by area, then by path
    files.sort(key=lambda f: (f.area, f.path))
    return files


def generate_refactor_suggestions(files: List[FileStats]) -> List[RefactorItem]:
    """Generate refactor suggestions based on file statistics."""
    suggestions: List[RefactorItem] = []
    ref_id = 0

    for f in files:
        # Skip docs and config
        if f.area in ('docs', 'config', 'scripts'):
            continue

        # Analyze file for specific recommendations
        file_path = REPO_ROOT / f.path
        ext = Path(f.path).suffix.lower()

        if ext == '.py':
            analysis = analyze_python_file(file_path)
        elif ext in ('.ts', '.tsx'):
            analysis = analyze_typescript_file(file_path)
        elif ext in ('.css', '.scss'):
            analysis = analyze_css_file(file_path)
        else:
            analysis = FileAnalysis()

        # Generate specific technique
        technique = generate_technique(f.path, analysis, f.file_type, f.loc)

        # Large files (>500 LOC)
        if f.loc > 500:
            ref_id += 1
            # Build specific details based on analysis
            details = [f'Current size: {f.loc} lines']
            if analysis.classes:
                details.append(f'Contains {len(analysis.classes)} classes: {", ".join(analysis.classes[:5])}')
            if analysis.functions and len(analysis.functions) > 10:
                details.append(f'Contains {len(analysis.functions)} functions')
            if analysis.components:
                details.append(f'Contains {len(analysis.components)} components: {", ".join(analysis.components[:5])}')
            if analysis.hooks:
                details.append(f'Contains {len(analysis.hooks)} hooks: {", ".join(analysis.hooks[:5])}')
            if analysis.large_functions:
                large_names = [f'{name} ({lines}L)' for name, lines in analysis.large_functions[:3]]
                details.append(f'Large functions: {", ".join(large_names)}')
            details.append('Update imports in dependent files after splitting')

            suggestions.append(RefactorItem(
                id=f'ref-{ref_id:03d}',
                title=f'Split large file: {Path(f.path).name}',
                description=f'File has {f.loc} lines - consider breaking into smaller modules',
                priority='high' if f.loc > 800 else 'medium',
                category=['split-file'],
                effort='large' if f.loc > 800 else 'medium',
                affected_files=[f.path],
                details=details,
                automated_reason=f'LOC > 500 ({f.loc} lines)',
                technique=technique
            ))

        # Large React components (>300 LOC)
        elif f.file_type == 'component' and f.loc > 300:
            ref_id += 1
            details = [f'Current size: {f.loc} lines']
            if analysis.components:
                details.append(f'Sub-components found: {", ".join(analysis.components[:5])}')
            if analysis.hooks:
                details.append(f'Hooks used: {", ".join(analysis.hooks[:5])}')
            if analysis.interfaces:
                details.append(f'Types defined: {len(analysis.interfaces)}')
            details.append('Consider custom hooks for complex stateful logic')

            suggestions.append(RefactorItem(
                id=f'ref-{ref_id:03d}',
                title=f'Extract sub-components: {Path(f.path).name}',
                description=f'Component has {f.loc} lines - consider extracting reusable parts',
                priority='medium',
                category=['extract-component'],
                effort='medium',
                affected_files=[f.path],
                details=details,
                automated_reason=f'Component LOC > 300 ({f.loc} lines)',
                technique=technique
            ))

        # Large pages (>400 LOC)
        elif f.file_type == 'page' and f.loc > 400:
            ref_id += 1
            details = [f'Current size: {f.loc} lines']
            if analysis.components:
                details.append(f'Inline components: {", ".join(analysis.components[:5])}')
            if analysis.hooks:
                details.append(f'Hooks: {", ".join(analysis.hooks[:5])}')
            details.append('Consider container/presenter pattern')

            suggestions.append(RefactorItem(
                id=f'ref-{ref_id:03d}',
                title=f'Simplify page: {Path(f.path).name}',
                description=f'Page has {f.loc} lines - extract sections into components',
                priority='medium',
                category=['extract-component', 'reduce-complexity'],
                effort='medium',
                affected_files=[f.path],
                details=details,
                automated_reason=f'Page LOC > 400 ({f.loc} lines)',
                technique=technique
            ))

        # Large CSS files (>800 LOC)
        elif f.file_type == 'style' and f.loc > 800:
            ref_id += 1
            details = [f'Current size: {f.loc} lines']
            if analysis.css_sections:
                details.append(f'Major sections: {", ".join(analysis.css_sections[:5])}')
            details.extend([
                'Consider CSS modules or styled-components',
                'Group styles by component'
            ])

            suggestions.append(RefactorItem(
                id=f'ref-{ref_id:03d}',
                title=f'Split stylesheet: {Path(f.path).name}',
                description=f'Stylesheet has {f.loc} lines - consider component-level splitting',
                priority='low',
                category=['split-file'],
                effort='small',
                affected_files=[f.path],
                details=details,
                automated_reason=f'CSS LOC > 800 ({f.loc} lines)',
                technique=technique
            ))

        # Deep nesting (>5 levels)
        if f.nesting_depth > 5:
            ref_id += 1
            # For deep nesting, suggest a more appropriate location
            path_parts = Path(f.path).parts
            suggested_location = '/'.join(path_parts[:3]) if len(path_parts) > 3 else f.path

            suggestions.append(RefactorItem(
                id=f'ref-{ref_id:03d}',
                title=f'Flatten structure: {f.path}',
                description=f'File is nested {f.nesting_depth} levels deep',
                priority='low',
                category=['consolidate'],
                effort='small',
                affected_files=[f.path],
                details=[
                    f'Current nesting depth: {f.nesting_depth}',
                    f'Consider moving to: {suggested_location}/',
                    'Update import paths in dependent files'
                ],
                automated_reason=f'Nesting depth > 5 ({f.nesting_depth} levels)',
                technique=f'Move to shallower location like `{suggested_location}/`'
            ))

    return suggestions


def generate_typescript(files: List[FileStats], refactors: List[RefactorItem]) -> str:
    """Generate the TypeScript data file content."""
    timestamp = datetime.now().isoformat()

    # File type config
    file_type_config = {
        'component': ('Component', 'box', '#3b82f6'),
        'page': ('Page', 'file', '#8b5cf6'),
        'hook': ('Hook', 'link', '#06b6d4'),
        'service': ('Service', 'server', '#10b981'),
        'context': ('Context', 'share', '#f59e0b'),
        'model': ('Model', 'database', '#ef4444'),
        'schema': ('Schema', 'code', '#ec4899'),
        'api': ('API', 'globe', '#6366f1'),
        'module': ('Module', 'package', '#84cc16'),
        'manager': ('Manager', 'settings', '#f97316'),
        'util': ('Utility', 'tool', '#64748b'),
        'constants': ('Constants', 'hash', '#78716c'),
        'types': ('Types', 'type', '#a855f7'),
        'test': ('Test', 'check', '#22c55e'),
        'style': ('Style', 'palette', '#e879f9'),
        'data': ('Data', 'table', '#0ea5e9'),
        'config': ('Config', 'cog', '#71717a'),
        'docs': ('Docs', 'book', '#94a3b8'),
        'ui': ('UI', 'monitor', '#14b8a6'),
        'entity': ('Entity', 'user', '#f43f5e'),
        'world': ('World', 'map', '#22d3ee'),
        'combat': ('Combat', 'zap', '#ef4444'),
        'story': ('Story', 'scroll', '#a78bfa'),
        'items': ('Items', 'box', '#fbbf24'),
        'core': ('Core', 'cpu', '#6366f1'),
        'other': ('Other', 'file', '#9ca3af'),
    }

    area_config = {
        'frontend': ('Frontend', 'monitor', '#3b82f6'),
        'backend': ('Backend', 'server', '#10b981'),
        'core': ('Core Game', 'gamepad', '#8b5cf6'),
        'tests': ('Tests', 'check-circle', '#22c55e'),
        'docs': ('Documentation', 'book', '#f59e0b'),
        'scripts': ('Scripts', 'terminal', '#6366f1'),
        'config': ('Config', 'cog', '#71717a'),
        'other': ('Other', 'folder', '#9ca3af'),
    }

    # Generate file stats array
    file_stats_lines = []
    for f in files:
        file_stats_lines.append(
            f"  {{ path: '{f.path}', loc: {f.loc}, nestingDepth: {f.nesting_depth}, "
            f"fileType: '{f.file_type}', area: '{f.area}', sizeCategory: '{f.size_category}' }}"
        )

    # Generate refactor items array
    refactor_lines = []
    for r in refactors:
        categories = ', '.join(f"'{c}'" for c in r.category)
        affected = ', '.join(f"'{f}'" for f in r.affected_files)
        # Escape single quotes in details
        escaped_details = [d.replace("'", "\\'") for d in r.details]
        details = ', '.join(f"'{d}'" for d in escaped_details)
        # Escape single quotes in title and description
        escaped_title = r.title.replace("'", "\\'")
        escaped_desc = r.description.replace("'", "\\'")
        # Escape technique field
        escaped_technique = r.technique.replace("'", "\\'").replace('\n', ' ')
        refactor_lines.append(f"""  {{
    id: '{r.id}',
    title: '{escaped_title}',
    description: '{escaped_desc}',
    priority: '{r.priority}',
    status: '{r.status}',
    category: [{categories}],
    effort: '{r.effort}',
    affectedFiles: [{affected}],
    details: [{details}],
    automatedReason: '{r.automated_reason}',
    technique: '{escaped_technique}'
  }}""")

    # Pre-compute joined strings for the template
    file_type_config_lines = '\n'.join(
        f"  {k}: {{ label: '{v[0]}', icon: '{v[1]}', color: '{v[2]}' }},"
        for k, v in file_type_config.items()
    )
    area_config_lines = '\n'.join(
        f"  {k}: {{ label: '{v[0]}', icon: '{v[1]}', color: '{v[2]}' }},"
        for k, v in area_config.items()
    )
    file_stats_joined = ',\n'.join(file_stats_lines)
    refactor_todos_joined = ',\n'.join(refactor_lines)

    # Build the TypeScript content
    ts_content = f'''/**
 * Codebase Health Data
 * Auto-generated by scripts/generate_codebase_health.py
 * Generated: {timestamp}
 *
 * DO NOT EDIT MANUALLY - Run the script to regenerate
 */

// =============================================================================
// Types
// =============================================================================

export type FileType =
  | 'component' | 'page' | 'hook' | 'service' | 'context'
  | 'model' | 'schema' | 'api' | 'module' | 'manager'
  | 'util' | 'constants' | 'types' | 'test' | 'style'
  | 'data' | 'config' | 'docs' | 'ui' | 'entity'
  | 'world' | 'combat' | 'story' | 'items' | 'core' | 'other';

export type Area = 'frontend' | 'backend' | 'core' | 'tests' | 'docs' | 'scripts' | 'config' | 'other';

export type SizeCategory = 'small' | 'medium' | 'large' | 'xlarge';

export type RefactorPriority = 'critical' | 'high' | 'medium' | 'low';

export type RefactorStatus = 'pending' | 'in-progress' | 'completed' | 'deferred';

export type RefactorCategory =
  | 'split-file' | 'reduce-complexity' | 'extract-hook'
  | 'extract-component' | 'consolidate' | 'rename' | 'delete';

export type Effort = 'small' | 'medium' | 'large' | 'epic';

// =============================================================================
// Interfaces
// =============================================================================

export interface FileStats {{
  path: string;
  loc: number;
  nestingDepth: number;
  fileType: FileType;
  area: Area;
  sizeCategory: SizeCategory;
}}

export interface RefactorItem {{
  id: string;
  title: string;
  description: string;
  priority: RefactorPriority;
  status: RefactorStatus;
  category: RefactorCategory[];
  effort: Effort;
  affectedFiles: string[];
  details: string[];
  automatedReason: string;
  technique: string;
}}

// =============================================================================
// Config Objects
// =============================================================================

export const FILE_TYPE_CONFIG: Record<FileType, {{ label: string; icon: string; color: string }}> = {{
{file_type_config_lines}
}};

export const AREA_CONFIG: Record<Area, {{ label: string; icon: string; color: string }}> = {{
{area_config_lines}
}};

export const SIZE_CONFIG: Record<SizeCategory, {{ label: string; color: string; minLoc: number; maxLoc: number }}> = {{
  small: {{ label: 'Small', color: '#22c55e', minLoc: 0, maxLoc: 99 }},
  medium: {{ label: 'Medium', color: '#eab308', minLoc: 100, maxLoc: 299 }},
  large: {{ label: 'Large', color: '#f97316', minLoc: 300, maxLoc: 499 }},
  xlarge: {{ label: 'X-Large', color: '#ef4444', minLoc: 500, maxLoc: Infinity }},
}};

export const REFACTOR_PRIORITY_CONFIG: Record<RefactorPriority, {{ label: string; color: string; order: number }}> = {{
  critical: {{ label: 'Critical', color: '#ef4444', order: 0 }},
  high: {{ label: 'High', color: '#f97316', order: 1 }},
  medium: {{ label: 'Medium', color: '#eab308', order: 2 }},
  low: {{ label: 'Low', color: '#22c55e', order: 3 }},
}};

export const REFACTOR_STATUS_CONFIG: Record<RefactorStatus, {{ label: string; icon: string; color: string }}> = {{
  pending: {{ label: 'Pending', icon: '○', color: '#6b7280' }},
  'in-progress': {{ label: 'In Progress', icon: '◐', color: '#3b82f6' }},
  completed: {{ label: 'Completed', icon: '●', color: '#22c55e' }},
  deferred: {{ label: 'Deferred', icon: '◷', color: '#4b5563' }},
}};

export const REFACTOR_CATEGORY_CONFIG: Record<RefactorCategory, {{ label: string; icon: string }}> = {{
  'split-file': {{ label: 'Split File', icon: '✂' }},
  'reduce-complexity': {{ label: 'Reduce Complexity', icon: '📉' }},
  'extract-hook': {{ label: 'Extract Hook', icon: '🪝' }},
  'extract-component': {{ label: 'Extract Component', icon: '📦' }},
  consolidate: {{ label: 'Consolidate', icon: '🔗' }},
  rename: {{ label: 'Rename', icon: '✏️' }},
  delete: {{ label: 'Delete', icon: '🗑️' }},
}};

export const EFFORT_CONFIG: Record<Effort, {{ label: string; dots: number }}> = {{
  small: {{ label: 'Small', dots: 1 }},
  medium: {{ label: 'Medium', dots: 2 }},
  large: {{ label: 'Large', dots: 3 }},
  epic: {{ label: 'Epic', dots: 4 }},
}};

// =============================================================================
// Generated Data
// =============================================================================

export const GENERATED_AT = '{timestamp}';

export const FILE_STATS: FileStats[] = [
{file_stats_joined}
];

export const REFACTOR_TODOS: RefactorItem[] = [
{refactor_todos_joined}
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getFilesByArea(area: Area): FileStats[] {{
  return FILE_STATS.filter((f) => f.area === area);
}}

export function getFilesByType(fileType: FileType): FileStats[] {{
  return FILE_STATS.filter((f) => f.fileType === fileType);
}}

export function getFilesBySize(sizeCategory: SizeCategory): FileStats[] {{
  return FILE_STATS.filter((f) => f.sizeCategory === sizeCategory);
}}

export function getAreaStats(): Record<Area, {{ count: number; totalLoc: number }}> {{
  const stats: Record<string, {{ count: number; totalLoc: number }}> = {{}};
  for (const area of Object.keys(AREA_CONFIG) as Area[]) {{
    const files = getFilesByArea(area);
    stats[area] = {{
      count: files.length,
      totalLoc: files.reduce((sum, f) => sum + f.loc, 0),
    }};
  }}
  return stats as Record<Area, {{ count: number; totalLoc: number }}>;
}}

export function getTypeStats(): Record<FileType, {{ count: number; totalLoc: number }}> {{
  const stats: Record<string, {{ count: number; totalLoc: number }}> = {{}};
  for (const fileType of Object.keys(FILE_TYPE_CONFIG) as FileType[]) {{
    const files = getFilesByType(fileType);
    stats[fileType] = {{
      count: files.length,
      totalLoc: files.reduce((sum, f) => sum + f.loc, 0),
    }};
  }}
  return stats as Record<FileType, {{ count: number; totalLoc: number }}>;
}}

export function getTotalStats(): {{ fileCount: number; totalLoc: number; avgLoc: number }} {{
  const totalLoc = FILE_STATS.reduce((sum, f) => sum + f.loc, 0);
  return {{
    fileCount: FILE_STATS.length,
    totalLoc,
    avgLoc: Math.round(totalLoc / FILE_STATS.length),
  }};
}}

export function getLargestFiles(limit = 10): FileStats[] {{
  return [...FILE_STATS].sort((a, b) => b.loc - a.loc).slice(0, limit);
}}

export function getDeepestFiles(limit = 10): FileStats[] {{
  return [...FILE_STATS].sort((a, b) => b.nestingDepth - a.nestingDepth).slice(0, limit);
}}

export function getRefactorsByPriority(priority: RefactorPriority): RefactorItem[] {{
  return REFACTOR_TODOS.filter((r) => r.priority === priority);
}}

export function getRefactorStats(): {{ total: number; pending: number; completed: number; byPriority: Record<RefactorPriority, number> }} {{
  return {{
    total: REFACTOR_TODOS.length,
    pending: REFACTOR_TODOS.filter((r) => r.status === 'pending').length,
    completed: REFACTOR_TODOS.filter((r) => r.status === 'completed').length,
    byPriority: {{
      critical: REFACTOR_TODOS.filter((r) => r.priority === 'critical').length,
      high: REFACTOR_TODOS.filter((r) => r.priority === 'high').length,
      medium: REFACTOR_TODOS.filter((r) => r.priority === 'medium').length,
      low: REFACTOR_TODOS.filter((r) => r.priority === 'low').length,
    }},
  }};
}}
'''

    return ts_content


def main():
    """Main entry point."""
    print("Scanning repository...")
    files = scan_repository()
    print(f"Found {len(files)} files")

    print("Generating refactor suggestions...")
    refactors = generate_refactor_suggestions(files)
    print(f"Generated {len(refactors)} suggestions")

    print("Generating TypeScript...")
    ts_content = generate_typescript(files, refactors)

    print(f"Writing to {OUTPUT_FILE}...")
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(ts_content)

    # Print summary
    total_loc = sum(f.loc for f in files)
    areas = defaultdict(int)
    for f in files:
        areas[f.area] += 1

    print("\n" + "=" * 50)
    print("CODEBASE HEALTH SUMMARY")
    print("=" * 50)
    print(f"Total files: {len(files)}")
    print(f"Total LOC: {total_loc:,}")
    print(f"Average LOC: {total_loc // len(files) if files else 0}")
    print("\nFiles by area:")
    for area, count in sorted(areas.items()):
        print(f"  {area}: {count}")
    print(f"\nRefactor suggestions: {len(refactors)}")
    print(f"\nOutput: {OUTPUT_FILE}")
    print("=" * 50)


if __name__ == '__main__':
    main()
