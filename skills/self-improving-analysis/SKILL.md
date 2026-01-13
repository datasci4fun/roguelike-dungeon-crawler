---
name: self-improving-analysis
description: Iteratively improve code analysis accuracy by having Claude analyze its own recommendations, identify flaws, fix the detection logic, and repeat until quality plateaus.
---

## Purpose

Use this skill when you want to create or improve a codebase analysis tool (refactoring recommendations, code health metrics, complexity detection, etc.) to a level of accuracy that exceeds what manual development typically achieves.

This creates a **self-improving feedback loop** where Claude:
1. Generates analysis/recommendations about code
2. Critiques its own output for accuracy issues
3. Fixes the underlying detection logic
4. Regenerates and verifies
5. Repeats until no significant issues remain

## When to Use

- After creating a new code analysis script
- When refactoring recommendations seem generic or inaccurate
- When you want to push detection quality beyond "good enough"
- To bootstrap a static analysis tool to production quality in one session

## The Pattern

```
┌─────────────────────────────────────────────────────────┐
│  1. GENERATE: Run the analysis script                   │
│                    ↓                                    │
│  2. CRITIQUE: Analyze output for flaws:                 │
│     - Wrong information?                                │
│     - Missing context?                                  │
│     - Generic/unhelpful advice?                         │
│     - False positives/negatives?                        │
│                    ↓                                    │
│  3. INVESTIGATE: Cross-reference with actual code       │
│     - Read the files being analyzed                     │
│     - Verify claims in recommendations                  │
│     - Check edge cases                                  │
│                    ↓                                    │
│  4. FIX: Update the analysis script                     │
│     - Add new detection patterns                        │
│     - Fix broken logic                                  │
│     - Improve output quality                            │
│                    ↓                                    │
│  5. VERIFY: Regenerate and confirm fixes                │
│                    ↓                                    │
│  6. LOOP: Return to step 2 until quality plateaus       │
└─────────────────────────────────────────────────────────┘
```

## Procedure

### Step 1: Establish Baseline

Run the analysis script and review a sample of the output:

```bash
python scripts/generate_codebase_health.py  # or equivalent
```

Examine 10-15 recommendations looking for:
- Accuracy of file/function/class detection
- Quality of technique suggestions
- Grammar and formatting issues
- False positives (flagging things that aren't problems)
- False negatives (missing obvious issues)

### Step 2: Systematic Critique

For each issue category, ask:

**Accuracy Issues:**
- Are line counts correct?
- Are class/function names accurate?
- Are inheritance relationships detected?
- Are file types correctly classified?

**Quality Issues:**
- Are recommendations actionable?
- Do suggestions reference actual code entities?
- Are fallback recommendations too generic?
- Is context provided (imports, dependencies)?

**Edge Cases:**
- Enums vs regular classes
- Data files vs code files
- Base classes with subclasses in same file
- Constants vs functions
- React components vs helper functions

### Step 3: Cross-Reference

For each suspected issue, verify against actual code:

```bash
# Check if claimed classes exist
grep -E "^class\s+\w+" path/to/file.py

# Verify inheritance
grep -E "^class\s+\w+\(" path/to/file.py

# Check actual line counts
wc -l path/to/file.py
```

### Step 4: Categorize and Prioritize Fixes

Create a mental or written list:
- **Critical**: Wrong information (incorrect class names, wrong line counts)
- **High**: Missing important context (inheritance not detected)
- **Medium**: Quality issues (generic recommendations)
- **Low**: Polish (grammar, formatting)

### Step 5: Implement Fixes

Update the analysis script to address each category:

```python
# Example fixes from actual session:

# 1. Add grammar helper
def pluralize(count, singular, plural=None):
    if plural is None:
        plural = singular + 's'
    return singular if count == 1 else plural

# 2. Detect inheritance patterns
class_pattern = re.compile(r'^class\s+(\w+)(?:\s*\(\s*([^)]+)\s*\))?')

# 3. Distinguish enums from classes
enum_bases = {'Enum', 'IntEnum', 'StrEnum', 'Flag', 'IntFlag'}

# 4. Detect constants
constant_pattern = re.compile(r'^([A-Z][A-Z0-9_]+)\s*[=:]')
```

### Step 6: Regenerate and Verify

```bash
# Regenerate
python scripts/generate_codebase_health.py

# Verify specific fixes
grep "Has 1 import" output.ts  # Should show singular
grep "inherit from" output.ts  # Should show inheritance
grep "subclasses of" output.ts  # Should show patterns
```

### Step 7: Iterate

Return to Step 2 with fresh eyes. Each iteration typically catches:

- **Round 1**: Obvious bugs, grammar, false positives
- **Round 2**: Semantic issues, inheritance, relationships
- **Round 3**: Architectural patterns, cross-file analysis
- **Round 4**: Domain-specific insights, coupling metrics
- **Round N**: Diminishing returns signal completion

## Example Prompts

**To start the loop:**
> "Analyze the generated recommendations and look for: wrong information, missing context, generic advice, false positives. The goal is to enhance the script so recommendations are as accurate as possible."

**To continue iterating:**
> "Now do the same process again to see if there are more improvements to make."

**To verify a specific fix:**
> "Check if entities.py now correctly shows the Entity/Player/Enemy inheritance relationship."

## Signs of Completion

Stop iterating when:
- New iterations find only trivial issues
- Recommendations consistently match manual code inspection
- False positive rate is acceptably low
- Suggested techniques reference actual code entities

## Why This Works

Traditional static analysis tools improve slowly through:
- User bug reports (slow feedback)
- Manual testing (limited coverage)
- Periodic refactoring (infrequent)

This pattern enables:
- Immediate feedback (same session)
- Comprehensive coverage (AI can check all output)
- Rapid iteration (fix and verify in minutes)
- Context awareness (AI understands both code and analysis)

## Output

After completing iterations, you should have:
- A significantly improved analysis script
- Higher accuracy recommendations
- Better coverage of edge cases
- Domain-specific detection logic
- Production-quality output

## Safety Notes

- Commit after each successful iteration
- Verify fixes don't break existing correct detections
- Keep the regenerated data file in sync with script changes
