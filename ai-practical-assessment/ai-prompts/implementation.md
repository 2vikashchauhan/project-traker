# AI Prompts: Implementation Phase

## Prompt: Execute All Tasks
> Run all task mandatory and non mandatory

## Prompt: Execute Auth Tasks
> Run all tasks for this spec.

## How Implementation Worked
1. Kiro read the tasks.md dependency graph
2. Identified parallel execution waves
3. Executed tasks in order (types → DB → repos → validators → services → routes → frontend → tests)
4. After each task: `npx tsc --noEmit` + `npx vitest run`
5. Fixed any issues before proceeding to next task
6. Final checkpoint verified full suite passes

## Key Implementation Decisions (made by AI, approved by me)
- HOF composition pattern for route handlers
- Prisma select for password exclusion (not omit)
- SetNull on user deletion (preserves projects/tasks)
- Strict Zod schemas on all inputs
- bcrypt cost factor 10 for password hashing
