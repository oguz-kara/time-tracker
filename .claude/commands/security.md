---
description: Security Audit for a specific file
options:
  - param: File to audit
---
# Security Audit
Analyze `$1` for:
1. **Auth:** Is `ctx.session` checked?
2. **Validation:** Is `Zod` used?
3. **Injection:** Are DB queries using Drizzle builder?
Output a Markdown table of risks.
