# RepoPilot

> **AI Software Engineering Agent** --- an intelligent agent designed to
> understand GitHub tasks, inspect repositories, modify code, test
> changes safely, debug failures, and eventually create Pull Requests.

RepoPilot is being built as a complete AI software-engineering system
rather than a simple AI chatbot. The architecture combines **AI agents,
GitHub automation, backend engineering, databases, testing, sandboxed
execution, and production job processing**.

------------------------------------------------------------------------

## Current Status

RepoPilot currently has a working **AI coding agent loop with human-reviewed file changes**.

The agent can:

-   Authenticate users with JWT and GitHub OAuth
-   Synchronize GitHub repositories
-   Create and execute tasks
-   Create and track agent runs
-   Use Gemini 3 Flash through a local OpenAI-compatible LLM gateway
-   Generate structured JSON plans and actions
-   Validate LLM actions before execution
-   Inspect repositories through GitHub tools
-   Propose file modifications through coding tools
-   Generate and persist file diffs
-   Require human approval before applying changes
-   Apply approved changes through the GitHub API
-   Track file-change status from `PENDING` to `APPROVED` to `APPLIED`
-   Record tool results and observations
-   Prevent duplicate tool calls
-   Properly handle agent completion
-   Persist execution information in MongoDB
-   Clone repositories into temporary managed execution workspaces
-   Execute allowed commands inside a Docker sandbox
-   Enforce command timeout, CPU, memory, PID, and network restrictions
-   Automatically clean execution workspaces after agent runs
-   Successfully complete a real multi-step coding agent run

### Latest successful coding agent run

``` text
Task
  ↓
Agent Run
  ↓
Gemini 3 Flash
  ↓
Plan
  ↓
list_files
  ↓
get_file
  ↓
edit_file
  ↓
FileChange = PENDING
  ↓
Human Approval
  ↓
FileChange = APPROVED
  ↓
GitHub API
  ↓
FileChange = APPLIED
```

The latest tested coding run completed successfully and applied a real file
change to GitHub after human approval.

------------------------------------------------------------------------

# 1. Vision

The original RepoPilot architecture is designed around this complete
workflow:

``` text
GitHub Repository
       ↓
GitHub Issue / Task
       ↓
AI Planner
       ↓
Repository Analysis
       ↓
Code Search
       ↓
Read Files
       ↓
Create Implementation Plan
       ↓
Edit Code
       ↓
Generate Diff
       ↓
Human Review
       ↓
Docker Sandbox
       ↓
Install Dependencies
       ↓
Run Tests
       ↓
Tests Fail?
    ↓       ↓
   YES      NO
    ↓        ↓
Analyze     Continue
Failure
    ↓
Fix Code
    ↓
Run Tests Again
       ↓
Git Diff
       ↓
Create Branch
       ↓
Commit
       ↓
Create GitHub PR
```

The current implementation is intentionally progressing toward this
architecture incrementally.

------------------------------------------------------------------------

# 2. High-Level Architecture

``` text
                         ┌─────────────────────────┐
                         │        RepoPilot        │
                         │ AI Software Engineering │
                         │         Agent           │
                         └────────────┬────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
   ┌───────────────┐          ┌────────────────┐          ┌───────────────┐
   │   Frontend    │          │    Backend     │          │    MongoDB    │
   │ React / Vite  │          │ Node / Express │          │   Mongoose    │
   └───────────────┘          └───────┬────────┘          └───────┬───────┘
                                      │                           │
                                      ▼                           │
                              ┌────────────────┐                  │
                              │ Authentication │                  │
                              │ JWT + GitHub   │                  │
                              │ OAuth          │                  │
                              └───────┬────────┘                  │
                                      │                           │
                                      ▼                           │
                              ┌────────────────┐                  │
                              │  Task System   │◄─────────────────┤
                              └───────┬────────┘                  │
                                      │                           │
                                      ▼                           │
                              ┌────────────────┐                  │
                              │   Agent Run    │◄─────────────────┤
                              └───────┬────────┘                  │
                                      │                           │
                                      ▼                           │
                              ┌────────────────┐                  │
                              │   Agent Loop   │                  │
                              └───────┬────────┘                  │
                                      │                           │
                         ┌────────────┴────────────┐              │
                         │                         │              │
                         ▼                         ▼              │
                  ┌──────────────┐         ┌──────────────┐      │
                  │    Planner   │         │    Action    │      │
                  │              │         │  Validation  │      │
                  └──────┬───────┘         └──────┬───────┘      │
                         │                        │              │
                         └───────────┬────────────┘              │
                                     ▼                           │
                              ┌───────────────┐                  │
                              │      LLM      │                  │
                              │ Gemini 3 Flash│                  │
                              └───────┬───────┘                  │
                                      │                          │
                                      ▼                          │
                              ┌────────────────┐                 │
                              │ FreeLLMAPI     │                 │
                              │ Extended       │                 │
                              │ OpenAI /v1     │                 │
                              └───────┬────────┘                 │
                                      │                          │
                                      ▼                          │
                              Gemini 3 Flash                     │
                                                                 │
                              ┌──────────────────────────────────┘
                              │
                              ▼
                     Persistent Agent Data
```

------------------------------------------------------------------------

# 3. Technology Stack

## Current Stack

  Layer                   Technology
  ----------------------- -----------------------------
  Frontend                React / Vite
  Backend                 Node.js / Express
  Language                TypeScript
  Database                MongoDB
  ODM                     Mongoose
  Authentication          JWT
  GitHub Authentication   GitHub OAuth
  GitHub Integration      GitHub API
  LLM                     Gemini 3 Flash
  LLM Gateway             FreeLLMAPI Extended
  LLM Interface           OpenAI-compatible `/v1` API
  Agent Architecture      Custom Agent Loop
  Development             Windows / Node.js

## Planned Stack

  Component            Planned Technology
  -------------------- ----------------------------
  Local LLM fallback   Ollama + Qwen3
  Code execution       Docker sandbox
  Job queue            Redis + BullMQ
  Testing              Jest / Supertest
  Agent graph          LangGraph later, if useful
  Production workers   Redis/BullMQ workers
  Pull Requests        GitHub API

------------------------------------------------------------------------

# 4. Backend Architecture

The backend is organized around several responsibilities:

``` text
server/
└── src/
    ├── agent/
    │   ├── agent.ts
    │   ├── agentState.ts
    │   ├── agentLoop.ts
    │   ├── planner.ts
    │   └── ...
    │
    ├── controllers/
    │   ├── agentRunController.ts
    │   ├── taskController.ts
    │   ├── repositoryController.ts
    │   └── ...
    │
    ├── models/
    │   ├── User.ts
    │   ├── Repository.ts
    │   ├── Task.ts
    │   ├── AgentRun.ts
    │   ├── AgentStep.ts
    │   ├── ToolCall.ts
    │   └── ...
    │
    ├── routes/
    │   ├── agentRunRoutes.ts
    │   ├── taskRoutes.ts
    │   ├── githubRepositoryRoutes.ts
    │   └── ...
    │
    ├── services/
    │   ├── llmService.ts
    │   ├── githubService.ts
    │   ├── executionService.ts
    │   ├── workspaceService.ts
    │   └── ...
    │
    ├── tools/
    │   └── githubTool.ts
    │
    └── server.ts
```

------------------------------------------------------------------------

# 5. Authentication

RepoPilot uses two authentication layers.

## Application Authentication

``` text
User
 ↓
Login
 ↓
JWT
 ↓
Authorization: Bearer <JWT>
 ↓
Express Middleware
 ↓
Authenticated Request
```

The backend uses the authenticated user's ID rather than trusting a user
ID supplied in the request body.

## GitHub Authentication

``` text
User
 ↓
GitHub OAuth
 ↓
GitHub Access Token
 ↓
RepoPilot User
 ↓
GitHub API
```

The GitHub access token is used by the backend to access the user's
repositories.

------------------------------------------------------------------------

# 6. Repository Synchronization

RepoPilot can synchronize repositories from GitHub into MongoDB.

``` text
GitHub
   ↓
GitHub API
   ↓
Repository Sync
   ↓
MongoDB
   ↓
Repository documents
```

A repository stores information such as:

``` text
githubId
userId
fullName
name
defaultBranch
url
```

This gives tasks and agent runs a persistent repository reference.

------------------------------------------------------------------------

# 7. Task System

A task connects the user's goal to a repository.

``` text
Task
├── userId
├── repositoryId
├── issueNumber
├── title
├── description
└── status
```

Current task flow:

``` text
User / GitHub Issue
        ↓
      Task
        ↓
    Agent Run
```

The backend verifies task ownership using the authenticated user.

------------------------------------------------------------------------

# 8. Agent Architecture

The agent is the core of RepoPilot.

## Agent State

The current agent maintains:

``` text
AgentState
│
├── taskId
├── runId
├── goal
├── currentStep
├── status
├── plan
├── observations
├── filesInspected
├── searchResults
└── toolHistory
```

The agent supports:

-   Setting a plan
-   Recording observations
-   Recording tool history
-   Updating the current step
-   Completing a run
-   Failing a run

------------------------------------------------------------------------

# 9. Planner

The planner sends the task goal to the LLM and generates a structured
plan.

``` text
Task Goal
   ↓
Planner
   ↓
Gemini 3 Flash
   ↓
Structured JSON
   ↓
Validated Plan
```

Example:

``` json
{
  "plan": [
    "Understand the repository structure",
    "Inspect relevant files",
    "Determine the required implementation"
  ]
}
```

JSON output and action validation have been strengthened to reduce
invalid LLM decisions.

------------------------------------------------------------------------

# 10. LLM Architecture

RepoPilot no longer calls the Gemini SDK directly.

Current architecture:

``` text
RepoPilot
    ↓
llmService.ts
    ↓
OpenAI-compatible client
    ↓
http://localhost:3001/v1
    ↓
FreeLLMAPI Extended
    ↓
Gemini 3 Flash
```

This provides an abstraction between RepoPilot and the underlying model
provider.

The existing application interface remains:

``` typescript
askLLM(systemPrompt, userPrompt)
```

This means the planner and agent loop do not need to know how the LLM
provider is accessed.

### Verified

The following have been successfully tested:

``` text
Gemini 3 Flash through FreeLLMAPI       ✓
Structured JSON response                ✓
RepoPilot llmService integration        ✓
Real agent execution                    ✓
```

------------------------------------------------------------------------

# 11. Agent Loop

The current loop works approximately as follows:

``` text
                  ┌───────────────┐
                  │     Task      │
                  └───────┬───────┘
                          ↓
                  ┌───────────────┐
                  │    Planner    │
                  └───────┬───────┘
                          ↓
                  ┌───────────────┐
                  │      LLM      │
                  └───────┬───────┘
                          ↓
                  ┌───────────────┐
                  │ Action         │
                  │ Validation     │
                  └───────┬───────┘
                          ↓
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
             Tool Call            Finish
                │                   │
                ▼                   ▼
          Execute Tool          Complete
                │
                ▼
          Tool Result
                │
                ▼
          Observation
                │
                ▼
              LLM
                │
                └──────→ Next Action
```

Current protections include:

-   Tool allow-list
-   Required tool input validation
-   Structured action validation
-   Duplicate tool-call prevention
-   Tool result recording
-   Observation recording
-   Proper `finish` handling
-   Maximum step protection

------------------------------------------------------------------------

# 12. Current GitHub Agent Tools

The current agent supports both **repository inspection** and **safe file-change proposals**. Write operations are not applied immediately; they create `FileChange` records that must be approved before being applied to GitHub.

## `list_files`

Lists repository files.

``` text
Agent
 ↓
list_files
 ↓
GitHub API
 ↓
Repository structure
```

## `get_file`

Reads a specific repository file.

``` text
Agent
 ↓
get_file
 ↓
GitHub API
 ↓
File contents
```

## `search_code`

Searches repository code.

``` text
Agent
 ↓
search_code
 ↓
GitHub API
 ↓
Matching code
```

## `edit_file`

Proposes a modification to an existing file and creates a pending
`FileChange`.

## `create_file`

Proposes creation of a new file and creates a pending `FileChange`.

## `delete_file`

Proposes deletion of an existing file and creates a pending `FileChange`.

Current tool registry:

``` text
list_files
get_file
search_code
edit_file
create_file
delete_file
```

The coding tools currently generate changes for human review instead of
directly modifying the repository.

------------------------------------------------------------------------

# 13. Tool Execution

The agent does not directly call GitHub APIs from the planner.

Instead:

``` text
LLM
 ↓
Tool Decision
 ↓
Action Validation
 ↓
Tool Executor
 ↓
GitHub Tool
 ↓
GitHub Service
 ↓
GitHub API
```

This separation allows new tools to be added without rewriting the agent
itself.

------------------------------------------------------------------------

# 14. Agent Observability

RepoPilot tracks agent execution in MongoDB.

## AgentRun

Represents one complete execution.

``` text
AgentRun
├── taskId
├── status
├── startedAt
├── completedAt
├── tokensUsed
└── executionTime
```

## AgentStep

Represents individual agent actions.

``` text
AgentStep
├── runId
├── stepNumber
├── action
├── toolName
├── input
└── status
```

## ToolCall

Stores tool execution information.

``` text
ToolCall
├── runId
├── toolName
├── input
├── output
└── status
```

This provides the foundation for a future detailed execution timeline.

------------------------------------------------------------------------

# 15. Current Successful Coding Execution

The latest successful real coding agent run followed this flow:

``` text
Task
 │
 ▼
AgentRun
 │
 ▼
Create Plan
 │
 ▼
list_files
 │
 ▼
list_files (server)
 │
 ▼
get_file
 │
 └── server/server.js
 │
 ▼
edit_file
 │
 ▼
FileChange = PENDING
 │
 ▼
Human Approval
 │
 ▼
FileChange = APPROVED
 │
 ▼
GitHub API
 │
 ▼
GitHub Commit
 │
 ▼
FileChange = APPLIED
 │
 ▼
AgentRun = COMPLETED
```

The tested change added a comment to `server/server.js`.

Result:

``` text
AgentRun: COMPLETED
FileChange: APPLIED
GitHub commit: created successfully
```

This confirms that the coding-agent proposal, human approval, and GitHub
application pipeline is functional.

------------------------------------------------------------------------

# 16. Development Roadmap

RepoPilot is being developed in phases.

## Phase 1 --- Foundation

### Status: COMPLETE

``` text
React / Vite
Node.js / Express
TypeScript
MongoDB / Mongoose
JWT
GitHub OAuth
GitHub API
```

------------------------------------------------------------------------

## Phase 2 --- GitHub Read Agent

### Status: COMPLETE

``` text
Repository synchronization
        ↓
Task
        ↓
Agent Run
        ↓
Planner
        ↓
Action validation
        ↓
Tool execution
        ↓
list_files
get_file
search_code
        ↓
Observations
        ↓
finish
```

------------------------------------------------------------------------

# Phase 3 --- Coding Agent

### Status: COMPLETE

RepoPilot can now propose changes to repository files and keep them
separate from the live GitHub repository until a human approves them.

Implemented tools:

``` text
edit_file
create_file
delete_file
```

Current architecture:

``` text
Read
 ↓
Understand
 ↓
Plan
 ↓
Edit
 ↓
Generate Diff
 ↓
FileChange
 ↓
Human Review
 ↓
Apply Approved Change
 ↓
GitHub
```

The `FileChange` model tracks:

``` text
FileChange
├── runId
├── filePath
├── changeType
├── oldContent
├── newContent
├── additions
├── deletions
├── diff
└── status
```

Supported statuses:

``` text
PENDING
   ↓
APPROVED
   ↓
APPLIED
```

Rejected changes can also be represented using the `REJECTED` status.

The agent does not immediately apply generated changes. Human approval is
required before the GitHub API is used.

------------------------------------------------------------------------

# Phase 4 --- Safe Code Execution

### Status: PLANNED

RepoPilot will execute generated code inside a Docker sandbox.

``` text
Agent
 ↓
Execution Job
 ↓
Docker Worker
 ↓
Temporary Repository
 ↓
Install Dependencies
 ↓
Run Tests
 ↓
Capture Output
 ↓
Destroy Container
```

The goal is to avoid executing AI-generated commands directly on the
user's machine.

Planned restrictions include:

-   CPU limits
-   Memory limits
-   Execution timeout
-   Restricted network access
-   Temporary workspace
-   No GitHub credentials inside the container

------------------------------------------------------------------------

# Phase 5 --- Autonomous Debugging

### Status: PLANNED

This is where RepoPilot becomes a more autonomous software-engineering
agent.

``` text
Plan
 ↓
Edit
 ↓
Run Tests
 ↓
Tests Fail
 ↓
Analyze Failure
 ↓
Modify Code
 ↓
Run Tests Again
 ↓
Success?
 ├── NO → Analyze and Fix
 └── YES → Continue
```

Example:

``` text
Test
 ↓
Expected: 403
Received: 200
 ↓
LLM analyzes failure
 ↓
Find authorization bug
 ↓
Edit code
 ↓
Run tests
 ↓
All tests pass
```

------------------------------------------------------------------------

# Phase 6 --- GitHub Automation

### Status: PLANNED

After successful testing:

``` text
Validated Changes
       ↓
Create Branch
       ↓
Commit Changes
       ↓
Push Branch
       ↓
Create Pull Request
```

Eventually:

``` text
GitHub Issue
     ↓
RepoPilot
     ↓
Code Changes
     ↓
Tests
     ↓
Human Approval
     ↓
Pull Request
```

------------------------------------------------------------------------

# Phase 7 --- Production Infrastructure

### Status: PLANNED

For production-scale execution:

``` text
Users
  ↓
API Server
  ↓
Redis / BullMQ
  ↓
┌────────────┬────────────┬────────────┐
│   Worker   │   Worker   │   Worker   │
└─────┬──────┴─────┬──────┴─────┬──────┘
      ↓            ↓            ↓
   Docker       Docker       Docker
```

Planned infrastructure:

-   Redis
-   BullMQ
-   Background workers
-   Job retries
-   Rate limiting
-   Execution monitoring
-   Better observability

------------------------------------------------------------------------

# 17. Ollama / Local LLM

A local LLM is planned as part of the future architecture.

Planned setup:

``` text
Primary / Gateway LLM
        ↓
Gemini 3 Flash
        ↓
FreeLLMAPI Extended
        ↓
Local fallback
        ↓
Ollama
        ↓
Qwen3
```

Ollama is particularly useful as a provider-independent local fallback.

It is not considered part of the currently verified production agent
path yet.

------------------------------------------------------------------------

# 18. Complete Future Architecture

The final intended architecture is:

``` text
                         GitHub
                           │
                    Issue / Repository
                           │
                           ▼
                    ┌───────────────┐
                    │   RepoPilot   │
                    │    Backend    │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │     Task      │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │   Agent Run   │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  Agent Loop   │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │     Planner   │
                    └───────┬───────┘
                            │
                       ┌────▼────┐
                       │   LLM   │
                       └────┬────┘
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
      Gemini / Gateway                 Ollama
             │
             ▼
        Tool Decision
             │
       ┌─────┴──────────┐
       │                │
       ▼                ▼
   Read Tools       Write Tools
       │                │
       ▼                ▼
   GitHub API      File Changes
                        │
                        ▼
                      Diff
                        │
                        ▼
                 Human Approval
                        │
                        ▼
                 Docker Sandbox
                        │
                        ▼
                    Run Tests
                        │
                  ┌─────┴─────┐
                  │           │
                FAIL        PASS
                  │           │
                  ▼           ▼
             Analyze       Continue
             Failure          │
                  │           │
                  └─────┬─────┘
                        │
                        ▼
                   Retest Loop
                        │
                        ▼
                    Git Diff
                        │
                        ▼
                 Create Branch
                        │
                        ▼
                     Commit
                        │
                        ▼
                  Create PR
                        │
                        ▼
                  GitHub Review
```

------------------------------------------------------------------------

# 19. Current vs Future

``` text
COMPLETE
────────────────────────────────────────
✓ React / Vite
✓ Node / Express / TypeScript
✓ MongoDB / Mongoose
✓ JWT authentication
✓ GitHub OAuth
✓ GitHub repository synchronization
✓ GitHub repository access
✓ Task system
✓ AgentRun system
✓ AgentStep system
✓ ToolCall foundation
✓ Agent state
✓ Planner
✓ Gemini 3 Flash
✓ FreeLLMAPI Extended
✓ OpenAI-compatible LLM interface
✓ Structured JSON output
✓ Action validation
✓ Tool execution
✓ Duplicate-call prevention
✓ Observation tracking
✓ Finish handling
✓ list_files
✓ get_file
✓ search_code
✓ Successful real agent run
```

``` text
NEXT
────────────────────────────────────────
→ edit_file
→ create_file
→ delete_file
→ FileChange tracking
→ Git diff
→ Human approval
```

``` text
LATER
────────────────────────────────────────
→ Docker sandbox
→ Command execution
→ Test execution
→ Autonomous debugging
→ Retry/fix loop
→ Branch creation
→ Commit
→ Pull Request
→ Redis
→ BullMQ
→ Background workers
→ Production observability
```

------------------------------------------------------------------------

# 20. Current Project Position

``` text
Foundation
    ✓
    │
    ▼
GitHub Read Agent
    ✓
    │
    ▼
LLM + Agent Tool Calling
    ✓
    │
    ▼
┌─────────────────────────────┐
│ YOU ARE HERE                │
│                             │
│ Coding Agent                │
│ edit/create/delete files    │
│ diff + FileChange           │
│ human approval + apply      │
└──────────────┬──────────────┘
               │
               ▼
Docker Execution
               │
               ▼
Autonomous Debugging
               │
               ▼
Branch → Commit → PR
               │
               ▼
Redis → BullMQ → Workers
```

------------------------------------------------------------------------

# 21. Project Goal

The final goal of RepoPilot is to provide an AI software-engineering
workflow where a developer can give an issue such as:

``` text
"Add role-based authorization to product deletion."
```

and RepoPilot can eventually:

``` text
Understand the issue
       ↓
Understand the repository
       ↓
Find relevant files
       ↓
Create a plan
       ↓
Modify the code
       ↓
Generate a diff
       ↓
Ask for approval
       ↓
Run tests safely
       ↓
Analyze failures
       ↓
Fix the implementation
       ↓
Run tests again
       ↓
Create a branch
       ↓
Commit changes
       ↓
Create a Pull Request
```

The project is therefore evolving from a repository inspection agent into
a complete **AI Software Engineering Agent**, with the core coding-change
and human-approval workflow now implemented.

------------------------------------------------------------------------

## Repository

GitHub: https://github.com/sheoran357/RepoPilot

## Current Milestone

**Working AI Coding Agent --- Safe File Modification + Human Approval**

### Next Milestone

**Safe Code Execution --- Docker Sandbox + Test Execution**

------------------------------------------------------------------------

## Architecture Decision

The original architecture specified PostgreSQL. RepoPilot uses
**MongoDB + Mongoose** instead.

The LLM layer was also abstracted behind an OpenAI-compatible interface
so the agent is not tightly coupled to a single provider.

This keeps the core agent architecture independent from the database and
model-provider implementation.


------------------------------------------------------------------------

# 18. Safe Code Execution

RepoPilot executes development commands inside a temporary managed workspace rather than inside the backend source directory.

``` text
Agent Run
    ↓
Clone GitHub Repository
    ↓
Managed Workspace
    ↓
Docker Sandbox
    ↓
Allowed Command
    ↓
Execution Result
    ↓
Workspace Cleanup
```

The current Docker sandbox applies:

-   No container network access
-   1 CPU limit
-   512 MB memory limit
-   128 process limit
-   Read-only container filesystem
-   Writable repository workspace
-   30 second command timeout
-   20,000 character stdout/stderr limit
-   Restricted command allowlist

Currently allowed commands are:

``` text
node --version
npm --version
npm test
npm run build
```

Dependency installation and autonomous test/debugging will be added after the sandbox execution path is verified locally.
