<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# gstack

Use the `/browse` skill from gstack for all web browsing; never use default browser tools.

### Available Skills:
- `/office-hours`: YC Office Hours product brainstorming and forcing questions
- `/plan-ceo-review`: CEO / Founder review on product strategy and scope
- `/plan-eng-review`: Architecture, data flow, diagrams, failure modes, edge cases, and tests
- `/plan-design-review`: Design review with 0-10 scoring and AI slop detection
- `/design-consultation`: Complete design system build and creative UI risks
- `/review`: Staff Engineer code review catching production bugs and completeness gaps
- `/ship`: End-to-end branch verification, testing, and pull request creation
- `/land-and-deploy`: Merge PRs and deploy to production environments
- `/canary`: Production health checks and canary deployment monitoring
- `/benchmark`: Performance, latency, and throughput benchmarks
- `/browse`: Fast headless browser for QA testing, element interaction, and site dogfooding
- `/qa`: Automated browser QA testing and interactive bug hunting
- `/qa-only`: Targeted QA testing without code changes
- `/design-review`: Visual design review and UX polish audits
- `/setup-browser-cookies`: Import browser cookies for authenticated QA sessions
- `/setup-deploy`: Configure deployment targets and pipeline infrastructure
- `/retro`: Weekly engineering retrospective and process reflection
- `/investigate`: Deep root cause investigation and error pattern correlation
- `/document-release`: Post-release documentation and changelog generation
- `/codex`: Run Codex review and automated refactoring
- `/cso`: Chief Security Officer security, permissions, and attack surface review
- `/autoplan`: Automated task planning and progressive decomposition
- `/careful`: Elevated caution mode for production/live operations
- `/freeze`: Scope file modifications strictly to designated directories
- `/guard`: Maximum safety guardrails preventing destructive commands
- `/unfreeze`: Lift directory freeze constraints
- `/gstack-upgrade`: Check and update gStack to the latest upstream release

