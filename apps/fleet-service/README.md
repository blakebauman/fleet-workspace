# fleet-service

A Cloudflare Workers application implementing the Fleet pattern with hierarchical Durable Objects for infinite nesting of manager/agent relationships.

## Features

- **Single DO Architecture**: Unified Durable Object class handling both manager and agent roles
- **Dynamic Hierarchy**: Automatic DO creation and management based on URL paths
- **Real-time Updates**: WebSocket-based communication for instant state changes
- **Production Ready**: Input validation, error handling, type safety, clean shutdown procedures

## Architecture

### URL-Based Hierarchy

Each path segment represents a unique Durable Object instance, creating an infinitely nestable hierarchy:

```
Root (/)
├── agent1
│   ├── subagent1
│   └── subagent2
│       └── subsubagent1
└── agent2
    └── subagent3
```

### Communication

- **WebSocket Protocol**: Real-time bidirectional communication
- **Message Types**:
  - `increment`: Update local counter
  - `createAgent`: Spawn new child agent
  - `deleteAgent`: Remove child agent and its subtree
  - `directMessage`: Send private message to specific agent
  - `broadcast`: Send message to all child agents
  - `state`: Current DO state updates
  - `error`: Error notifications

## Development

### Run in dev mode

```sh
pnpm dev
```

### Run tests

```sh
pnpm test
```

### Deploy

```sh
pnpm turbo deploy
```

## Usage Examples

1. **Root Manager** (`/`): View and manage top-level agents, monitor system state
2. **Nested Management** (`/team1/project1/task1`): Deep hierarchy support
3. **Agent Operations**: Create, delete, and communicate with agents in real-time
4. **Message Broadcasting**: Send messages to all child agents or specific agents

## Security

- Input validation for agent names (alphanumeric, dash, underscore, 1-32 chars)
- Secure WebSocket handling with proper connection lifecycle
- Hierarchical deletion safety with cascading cleanup
