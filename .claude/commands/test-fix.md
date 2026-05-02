---
description: TDD Loop - Run test and fix implementation until pass
options:
  - param: Test File Path
---
# TDD Protocol
1. Run `npm test $1`.
2. If pass, stop.
3. If fail, read the error.
4. Modify the *implementation* file (not the test) to fix logic.
5. Repeat.
