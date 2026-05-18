# API Documentation - CInplifica

## Base URL
`http://localhost:3001/api`

## Authentication
The API uses **CIn-SSO** (OpenID Connect) for authentication.

1.  **Login**: Redirect the user to `/api/auth/login`.
2.  **Callback**: After successful login, the SSO redirects to `/api/auth/callback`, which then redirects to the frontend with a JWT token: `${FRONTEND_URL}/auth/success?token=...`.
3.  **Usage**: Include the token in the `Authorization` header for protected routes: `Authorization: Bearer <token>`.

---

## Auth Endpoints

### GET /auth/login
Initiates the CIn-SSO login flow.

### GET /auth/mock-login
(Development Only) Returns a JWT token and user info for a test user.

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
    "users": [{ "id": "uuid", "name": "Name" }],
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

**Response:** `200 OK`

---

## WebSockets (Real-time)

**Connection URL:** `ws://localhost:3001`

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
