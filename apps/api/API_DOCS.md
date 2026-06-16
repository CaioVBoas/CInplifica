# API Documentation - CInplifica

## Base URL
`http://localhost:3011/api`

## Authentication
The API uses **CIn-SSO** (OpenID Connect) for authentication and only accepts users whose SSO email ends with `@cin.ufpe.br`.

1.  **Login**: Redirect the user to `/api/auth/login`.
2.  **Callback**: After successful login, the SSO redirects to `/api/auth/callback`, which then redirects to the frontend with a JWT token: `${FRONTEND_URL}/auth/success?token=...`.
3.  **Usage**: Include the token in the `Authorization` header for protected routes: `Authorization: Bearer <token>`.

The CIn SSO client credentials and OpenID Connect endpoints must be configured through `CIN_SSO_*` environment variables.

---

## Auth Endpoints

### GET /auth/login
Initiates the CIn-SSO login flow.

### GET /auth/mock-login
(Development Only) Returns a JWT token and user info for a test user using the allowed `@cin.ufpe.br` domain. This route is blocked in production.

### GET /auth/callback
Internal callback for CIn-SSO. Redirects to frontend with token.

---

## Listings

### GET /listings
(Public) Returns all active listings.

**Query Parameters:**
- `category` (optional): Filter by category (`SALE`, `LOST_FOUND`, `ACADEMIC`).
- `search` (optional): Search term for filtering by title or description (case-insensitive).

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Monitor 24\"",
    "description": "...",
    "price": 800.0,
    "imageUrl": "https://...",
    "category": "SALE",
    "status": "ACTIVE",
    "authorId": "uuid",
    "createdAt": "iso-date",
    "updatedAt": "iso-date",
    "author": {
      "id": "uuid",
      "name": "User Name",
      "email": "user@cin.ufpe.br"
    }
  }
]
```

### GET /listings/:id
(Public) Returns a specific listing.

**Response:** `200 OK` or `404 Not Found`

### POST /listings
(Protected) Creates a new listing. The `authorId` is automatically taken from the JWT token.

**Header:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "string",
  "description": "string",
  "price": number (optional),
  "category": "SALE" | "LOST_FOUND" | "ACADEMIC"
}
```

**Response:** `201 Created`

### DELETE /listings/:id
(Protected) Deletes a listing.

**Header:** `Authorization: Bearer <token>`

**Response:** `204 No Content`

---

## Conversations (Chat)

### GET /conversations
(Protected) Returns all conversations for the authenticated user.

**Header:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "participants": [{ "id": "uuid", "name": "Name", "email": "user@cin.ufpe.br" }],
    "messages": [{ "text": "last message...", "createdAt": "..." }],
    "updatedAt": "iso-date"
  }
]
```

### POST /conversations
(Protected) Starts or retrieves a conversation with another user.

**Header:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "participantId": "uuid"
}
```

**Response:** `200 OK`

### GET /conversations/:id/messages
(Protected) Returns all messages for a specific conversation.

### GET /conversations/unread-count
(Protected) Returns the total unread message count for the authenticated user.

### POST /conversations/:id/read
(Protected) Marks all unread messages in a conversation as read for the authenticated user.

---

## Notifications and Interests

### GET /notifications
(Protected) Lists the latest notifications for the authenticated user.

### GET /notifications/unread-count
(Protected) Returns the unread notification count.

### POST /notifications/mark-all-read
(Protected) Marks all notifications as read.

### GET /interests/keywords
(Protected) Lists the user's interest keywords.

### POST /interests/keywords
(Protected) Adds an interest keyword.

**Body:**
```json
{
  "keyword": "string"
}
```

### DELETE /interests/keywords/:id
(Protected) Removes an interest keyword owned by the authenticated user.

---

## Reports

### POST /reports
(Protected) Creates a report for a listing, message, or conversation.

**Header:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "targetType": "LISTING" | "MESSAGE" | "CONVERSATION",
  "targetId": "uuid",
  "reason": "string",
  "description": "string (optional)"
}
```

**Response:** `201 Created`

### GET /reports
(Protected: `ADMIN` or `MODERATOR`) Lists reports for moderation.

**Query Parameters:**
- `status` (optional): `PENDING`, `REVIEWED`, `DISMISSED`, or `RESOLVED`.
- `targetType` (optional): `LISTING`, `MESSAGE`, or `CONVERSATION`.

### PATCH /reports/:id/status
(Protected: `ADMIN` or `MODERATOR`) Updates a report status.

**Body:**
```json
{
  "status": "PENDING" | "REVIEWED" | "DISMISSED" | "RESOLVED"
}
```

**Response:** `200 OK`

---

## Moderation

All moderation routes require `ADMIN` or `MODERATOR`.

### GET /moderation/actions
Lists the latest moderation actions.

### POST /moderation/reports/:id/approve
Approves and resolves a report.

**Body:**
```json
{
  "reason": "string (optional)",
  "removeContent": true,
  "suspendUser": false
}
```

### POST /moderation/reports/:id/reject
Rejects a report and marks it as dismissed.

**Body:**
```json
{
  "reason": "string (optional)"
}
```

### POST /moderation/content/remove
Removes content directly by target.

**Body:**
```json
{
  "targetType": "LISTING" | "MESSAGE" | "CONVERSATION",
  "targetId": "uuid",
  "reason": "string (optional)",
  "reportId": "uuid (optional)"
}
```

### POST /moderation/users/:id/suspend
Suspends a user account.

**Body:**
```json
{
  "reason": "string (optional)",
  "reportId": "uuid (optional)"
}
```

---

## Audit Log

### GET /audit-logs
(Protected: `ADMIN` or `MODERATOR`) Lists the latest audit log entries.

**Query Parameters:**
- `entityType` (optional)
- `actorId` (optional)
- `action` (optional)

---

## WebSockets (Real-time)

**Connection URL:** `ws://localhost:3011`

### Client -> Server Events

#### join_conversation
Joins a specific conversation room to receive messages.
- **Data:** `conversationId` (string)

#### send_message
Sends a message to a conversation.
- **Data:** `{ conversationId: string, senderId: string, text: string }`

### Server -> Client Events

#### new_message
Received when a new message is sent in a joined conversation.
- **Data:** `Message` object

#### error
Received when a socket operation fails.
- **Data:** `{ message: string }`

---

## Health Check
`GET /health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "iso-date"
}
```
