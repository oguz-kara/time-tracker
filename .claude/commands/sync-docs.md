---
description: Synchronize CLAUDE.md with codebase changes - intelligently updates documentation with architectural changes while preserving existing content
---

Analyze the current codebase and compare it against CLAUDE.md:

1. SCAN: Review all code changes since CLAUDE.md was last updated
2. IDENTIFY: Find new features, architectural changes, or patterns
3. EVALUATE: Determine which changes are documentation-worthy (architectural decisions, non-obvious patterns, critical dependencies, important constraints)
4. UPDATE: Modify CLAUDE.md by:
   - Adding new important information
   - Updating outdated sections with current implementation
   - Preserving all existing content unless it's demonstrably outdated
   - Maintaining the existing structure and organization

5. SUMMARY: Show me what you changed and why

Criteria for inclusion:
- Architectural/design decisions
- New patterns or conventions
- Critical integrations or dependencies
- Non-obvious gotchas or constraints
- Setup/configuration changes

Skip: routine features, self-explanatory code, minor updates, implementation details