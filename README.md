# Challenge App Backend

A backend service for the challengeappbackend technical challenge, implementing user authentication, profile management with horoscope/zodiac auto-calculation, and real-time chat with RabbitMQ-based notifications.

Built with **NestJS**, **MongoDB**, **RabbitMQ**, **Socket.io**, and **Docker**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Real-Time Chat Testing](#real-time-chat-testing)
- [Testing](#testing)
- [Architecture Decisions](#architecture-decisions)
- [Security](#security)
- [Project Structure](#project-structure)

---

## Features

- 🔐 **Authentication** — JWT-based register/login with bcrypt password hashing
- 👤 **Profile Management** — Full CRUD with auto-calculated horoscope and Chinese zodiac from birthday
- 💬 **Real-Time Chat** — Persistent 1-on-1 messaging delivered live over Socket.io
- 📨 **Event-Driven Notifications** — Message events published to RabbitMQ and consumed by the WebSocket gateway
- 📚 **Auto-Generated API Docs** — Swagger UI available at `/docs`
- ✅ **Validation** — Class-validator DTOs on every endpoint
- 🛡️ **Rate Limiting** — Multi-tier throttling with stricter limits on auth endpoints
- 🧪 **Unit Tests** — Jest tests covering business logic in services and utilities
- 🐳 **Dockerized** — Full stack runs with one `docker compose up` command

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | NestJS 10 |
| Database | MongoDB 7 (via Mongoose) |
| Message Broker | RabbitMQ 3 |
| Real-Time | Socket.io |
| Auth | JWT + Passport |
| Validation | class-validator + class-transformer |
| Docs | Swagger / OpenAPI |
| Testing | Jest |
| Container | Docker + Docker Compose |

---

## Architecture

```
┌─────────────┐      HTTP       ┌──────────────────────────────┐
│   Client    │ ───────────────▶│         NestJS API           │
│  (Browser   │                 │                              │
│  / Mobile)  │ ◀───── WS ──────│  ┌────────┐  ┌────────────┐ │
└─────────────┘                 │  │  Auth  │  │  Profile   │ │
                                │  │ Module │  │   Module   │ │
                                │  └────────┘  └────────────┘ │
                                │  ┌────────────────────────┐ │
                                │  │     Chat Module        │ │
                                │  │  ┌──────────────────┐  │ │
                                │  │  │ ChatService      │  │ │
                                │  │  │   ↓ publish      │  │ │
                                │  │  └──────────────────┘  │ │
                                │  │  ┌──────────────────┐  │ │
                                │  │  │ ChatGateway      │  │ │
                                │  │  │   ↑ consume      │  │ │
                                │  │  └──────────────────┘  │ │
                                │  └────────────────────────┘ │
                                └──────────┬───────────────┬──┘
                                           │               │
                                  ┌────────▼──┐     ┌──────▼─────┐
                                  │  MongoDB  │     │  RabbitMQ  │
                                  └───────────┘     └────────────┘
```

The chat module demonstrates microservices-oriented design: `ChatService` publishes events to RabbitMQ, and `ChatGateway` consumes them independently. Either side could be extracted into a separate process without changing the other.

---

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (only required for local development outside Docker)

### 1. Clone and configure

```bash
git clone <repo-url>
cd challengeappbackend-backend
cp .env.example .env
```

Edit `.env` if you want to change defaults. The provided values work out of the box.

### 2. Run with Docker (recommended)

```bash
docker compose up -d
```

This starts MongoDB, RabbitMQ, and the API. The first run will build the API image.

Verify everything is up:

```bash
docker compose ps
```

You should see three services running: `challengeappbackend-mongo`, `challengeappbackend-rabbit`, `challengeappbackend-api`.

### 3. Or run locally (for development)

Start only the infrastructure with Docker:

```bash
docker compose up -d mongodb rabbitmq
```

Then run the API on your host:

```bash
npm install
npm run start:dev
```

### 4. Verify it works

- **API:** http://localhost:3000/api
- **Swagger Docs:** http://localhost:3000/docs
- **RabbitMQ Management UI:** http://localhost:15672 (guest / guest)

---

## API Documentation

Full interactive documentation is available at **http://localhost:3000/docs** via Swagger UI.

### Endpoint Summary

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | — | Create a new user account |
| POST | `/api/login` | — | Authenticate and receive a JWT |
| POST | `/api/createProfile` | Bearer | Create the authenticated user's profile |
| GET | `/api/getProfile` | Bearer | Retrieve the authenticated user's profile |
| PUT | `/api/updateProfile` | Bearer | Update the authenticated user's profile |
| POST | `/api/sendMessage` | Bearer | Send a message to another user |
| GET | `/api/viewMessages` | Bearer | Retrieve message history with another user (paginated) |

### Example: Full Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "password": "Password123!"
  }'

# 2. Login (returns { "access_token": "..." })
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "Password123!"
  }'

# 3. Create profile (horoscope & zodiac are auto-calculated)
curl -X POST http://localhost:3000/api/createProfile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Doe",
    "gender": "Male",
    "birthday": "1995-08-28",
    "heightCm": 175,
    "weightKg": 69,
    "interests": ["Music", "Basketball", "Fitness"]
  }'
# Response will include: "horoscope": "Virgo", "zodiac": "Pig"
```

---

## Real-Time Chat Testing

A minimal HTML test client is included at `chat-test.html`. Open it in two different browser tabs (each as a different user) to see real-time delivery.

Alternatively, connect via Socket.io directly:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: '<your-jwt-token>' }
});

socket.on('connect', () => console.log('Connected'));
socket.on('message:new', (msg) => console.log('New message:', msg));
socket.on('message:sent', (msg) => console.log('Sent confirmation:', msg));
socket.emit('typing', { to: '<other-user-id>' });
```

### Event Reference

| Event | Direction | Payload |
|---|---|---|
| `message:new` | Server → Client | `{ messageId, senderId, content, createdAt }` |
| `message:sent` | Server → Client | Confirmation echoed back to sender |
| `typing` | Client → Server | `{ to: userId }` |
| `typing` | Server → Client | `{ from: userId }` |

---

## Testing

```bash
# Run all tests
npm test

# Watch mode (re-runs on changes)
npm run test:watch

# Coverage report
npm run test:cov
```

### Test Coverage

Tests focus on business logic in the service layer and pure utility functions:

- ✅ `astrology.spec.ts` — Horoscope/zodiac calculation with boundary cases
- ✅ `conversation-id.spec.ts` — Deterministic conversation ID generation
- ✅ `auth.service.spec.ts` — Register, login, password hashing, JWT signing
- ✅ `profile.service.spec.ts` — CRUD with auto-enrichment of horoscope/zodiac
- ✅ `chat.service.spec.ts` — Message persistence and RabbitMQ publishing

Controller tests are intentionally omitted since controllers are thin delegates; the underlying services are tested directly.

---

## Architecture Decisions

### Schema Design (MongoDB)

**Three separate collections** with clear ownership boundaries — one per module:

| Collection | Owned By | Notes |
|---|---|---|
| `users` | AuthModule | Credentials only; unique indexes on `email` and `username` |
| `profiles` | ProfileModule | Linked to users via `userId` reference; `interests` embedded as an array |
| `messages` | ChatModule | Linked to users via `sender`/`receiver`; indexed by `conversationId` + `createdAt` |

**Embed vs. Reference decisions:**

- **Interests are embedded** in the Profile document because they're always read together, have bounded size (a handful of tags), and don't need to be queried independently.
- **Messages are referenced** (separate collection) rather than embedded in a conversation document because conversations grow unboundedly and would quickly exceed MongoDB's 16MB document limit.
- **Profile is a separate document** from User because the two have different lifecycles: auth data is read on every request, profile data only when viewing.

**Indexing strategy:**

```typescript
// Messages: optimized for paginated history per conversation
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Users: prevent duplicate emails/usernames at the DB layer
{ email: { unique: true }, username: { unique: true } }
```

**Deterministic conversation IDs:** Instead of maintaining a separate `conversations` collection, the `conversationId` is computed by sorting and joining the two user IDs (`makeConversationId(a, b)`). This guarantees both participants query the same conversation without a lookup table.

### Microservices-Oriented Design

Although deployed as a single NestJS app, the codebase is structured for microservice extraction:

1. **Bounded contexts** — Each module (Auth, Profile, Chat) owns its schema, controller, and service. No module imports another's schema or directly queries another's collection.

2. **Event-driven communication via RabbitMQ** — When `ChatService.sendMessage` saves a message, it publishes a `NEW_MESSAGE` event to a durable queue. The `ChatGateway` consumes from this queue and pushes notifications over Socket.io. The publisher and consumer are decoupled — either could be extracted to a separate process without code changes to the other.

3. **Extensibility** — Additional consumers (email notifications, push notifications, analytics) could subscribe to the same queue without modifying the producer.

### Object-Oriented Patterns

- **Strategy pattern** — `RabbitMQService` exposes a consumer hook (`consumeNotifications(handler)`) that accepts any handler function, allowing the gateway to swap delivery logic without touching the queue layer.
- **Encapsulation** — The `onlineUsers` map (`Map<userId, Set<socketId>>`) is private to `ChatGateway`; the rest of the system interacts only with `emitToUser(userId, event, payload)`.
- **Ready-promise pattern** — `RabbitMQService` exposes an internal `ready` promise so consumers can safely call `publishNotification` or `consumeNotifications` even before `onModuleInit` has completed, preventing race conditions during startup.

### Data Structure Choices

| Use Case | Structure | Why |
|---|---|---|
| Online users tracking | `Map<userId, Set<socketId>>` | O(1) lookup; supports multi-device (one user, multiple sockets) |
| Conversation identification | Sorted string concatenation | Deterministic and stateless — no DB lookup needed |
| Horoscope ranges | Lookup table (array of tuples) | Avoids long if-else chains; easy to verify against reference data |

---

## Security

### Password Hashing

Passwords are hashed with **bcrypt** using a cost factor of 10. Plaintext passwords are never stored or logged.

### JWT Authentication

- Tokens are signed with HMAC-SHA256 using a secret loaded from `JWT_SECRET` env var.
- Default expiry is **1 day** (configurable via `JWT_EXPIRES_IN`).
- Tokens are required as `Authorization: Bearer <token>` on all protected endpoints.
- Socket.io connections authenticate by passing the token in `handshake.auth.token`.

### Rate Limiting

All endpoints are throttled using `@nestjs/throttler` with three concurrent tiers:

- **3 requests/second** (burst protection)
- **20 requests/10 seconds** (short-window throttling)
- **100 requests/minute** (long-window throttling)

Auth endpoints (`/api/register`, `/api/login`) have stricter limits of **5 attempts per minute per IP** to prevent brute-force attacks. Exceeding limits returns HTTP `429 Too Many Requests`.

### Input Validation

Every endpoint validates inputs with **class-validator** DTOs. The global `ValidationPipe` is configured with:

- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — rejects requests with extra fields
- `transform: true` — auto-converts payloads to DTO instances

### Environment Variables

Secrets are loaded from `.env` (gitignored). A `.env.example` is committed showing all required variables without real values.

---

## Project Structure

```
challengeappbackend-backend/
├── src/
│   ├── auth/                    # Authentication bounded context
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── schemas/
│   │   │   └── user.schema.ts
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts
│   │   └── auth.module.ts
│   │
│   ├── profile/                 # Profile bounded context
│   │   ├── dto/
│   │   ├── schemas/
│   │   │   └── profile.schema.ts
│   │   ├── utils/
│   │   │   ├── astrology.ts
│   │   │   └── astrology.spec.ts
│   │   ├── profile.controller.ts
│   │   ├── profile.service.ts
│   │   ├── profile.service.spec.ts
│   │   └── profile.module.ts
│   │
│   ├── chat/                    # Chat bounded context
│   │   ├── dto/
│   │   ├── rabbitmq/
│   │   │   └── rabbitmq.service.ts
│   │   ├── schemas/
│   │   │   └── message.schema.ts
│   │   ├── utils/
│   │   │   ├── conversation-id.ts
│   │   │   └── conversation-id.spec.ts
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── chat.service.spec.ts
│   │   ├── chat.gateway.ts
│   │   └── chat.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
└── README.md
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://admin:admin123@mongodb:27017/challengeappbackend?authSource=admin` |
| `JWT_SECRET` | Secret for signing JWTs | _(required, no default)_ |
| `JWT_EXPIRES_IN` | JWT expiration time | `1d` |
| `RABBITMQ_URL` | RabbitMQ AMQP connection URL | `amqp://guest:guest@rabbitmq:5672` |

When running the API **outside Docker** (local dev), replace service names (`mongodb`, `rabbitmq`) with `localhost`.

---

## Available NPM Scripts

| Script | Purpose |
|---|---|
| `npm run start` | Start in production mode |
| `npm run start:dev` | Start with hot reload |
| `npm run start:debug` | Start with debugger attached |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Generate coverage report |
| `npm run lint` | Lint source files |
| `npm run format` | Format with Prettier |

---

## License

This project was created for the challengeappbackend technical assessment.
