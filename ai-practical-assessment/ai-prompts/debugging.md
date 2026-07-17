# AI Prompts: Debugging Phase

## Prompt: Terminal Error
> can you check the error that show in terminal

## Prompt: PostgreSQL Setup
> please implement postgresql Locally

## How AI Helped Debug
1. Read terminal output and identified PrismaClientInitializationError
2. Explained root cause (no PostgreSQL running)
3. Provided step-by-step setup commands
4. Identified .env vs .env.local distinction for Prisma CLI
5. Fixed integration test failures after auth migration (final checkpoint)
