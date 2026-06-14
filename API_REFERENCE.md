# API Reference

## Base URL
```
http://localhost:3001
```

## Authentication Endpoints

### 1. Get Auth Status
**GET** `/api/auth/status`

Get current authentication status and user info.

**Response:**
```json
{
  "authenticated": true,
  "username": "John Doe",
  "userId": "uuid-string",
  "role": "data-collector"
}
```

---

### 2. Request Access
**POST** `/api/auth/request-access`

Request access with user credentials. Sends verification code.

**Request Body:**
```json
{
  "username": "string",
  "userEmail": "string",
  "company": "string",
  "purpose": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to ...",
  "requestId": "uuid-string"
}
```

**Errors:**
- 400: Missing required fields
- 400: Invalid email
- 400: Email already registered

---

### 3. Verify Code
**POST** `/api/auth/verify-code`

Verify the 6-digit code sent to email. Creates session on success.

**Request Body:**
```json
{
  "code": "string",
  "requestId": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access granted!",
  "username": "John Doe",
  "userId": "uuid-string"
}
```

**Cookies Set:**
- `sessionId`: HTTP-only session cookie (30 min expiry)

**Errors:**
- 400: Invalid code format
- 400: No pending request
- 400: Code expired
- 400: Invalid code (max 5 attempts)

---

### 4. Logout
**POST** `/api/auth/logout`

Destroy session and logout user.

**Headers:**
- Cookie: sessionId (required)

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Admin/DAM Endpoints

### 1. Get All Dams
**GET** `/api/admin/dams`

Retrieve all dams with current data.

**Response:**
```json
{
  "success": true,
  "count": 26,
  "dams": [
    {
      "id": "kariba",
      "name": "Kariba Dam",
      "capacity_percent": 78.5,
      "province": "Mashonaland West",
      "type": "Hydroelectric",
      "latitude": -16.521,
      "longitude": 28.762,
      "image_url": "https://...",
      "last_updated": "2026-03-25",
      "status": "normal"
    }
  ]
}
```

---

### 2. Get Single Dam
**GET** `/api/admin/dams/:damId`

Retrieve specific dam data.

**Parameters:**
- `damId`: Dam ID (string, required)

**Response:**
```json
{
  "success": true,
  "dam": {
    "id": "kariba",
    "name": "Kariba Dam",
    ...
  }
}
```

**Errors:**
- 404: Dam not found

---

### 3. Update Dam
**POST** `/api/admin/update-dam`

Update dam capacity level. **Requires authentication**.

**Headers:**
- Cookie: sessionId (required)
- Content-Type: application/json

**Request Body:**
```json
{
  "damId": "string",
  "capacity_percent": 0-100,
  "notes": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kariba Dam updated successfully",
  "dam": {
    "id": "kariba",
    "name": "Kariba Dam",
    "capacity_percent": 85.0,
    "last_updated": "2026-03-26",
    "status": "normal",
    "updated_by": "John Doe"
  }
}
```

**Errors:**
- 401: Unauthorized (not authenticated)
- 400: Missing damId
- 400: Invalid capacity_percent
- 404: Dam not found

---

### 4. Get All Update History
**GET** `/api/admin/history`

Retrieve complete update history for all dams.

**Response:**
```json
{
  "success": true,
  "count": 15,
  "history": [
    {
      "timestamp": "2026-03-26T14:30:00Z",
      "damId": "kariba",
      "capacity_percent": 85.0,
      "status": "normal",
      "updated_by": "John Doe",
      "notes": "Weekly update"
    }
  ]
}
```

---

### 5. Get Dam-Specific History
**GET** `/api/admin/history/:damId`

Retrieve update history for specific dam.

**Parameters:**
- `damId`: Dam ID (string, required)

**Response:**
```json
{
  "success": true,
  "damId": "kariba",
  "count": 5,
  "history": [
    {
      "timestamp": "2026-03-26T14:30:00Z",
      "capacity_percent": 85.0,
      "status": "normal",
      "updated_by": "John Doe",
      "notes": "Weekly update"
    }
  ]
}
```

---

## Health Endpoint

### Server Health Check
**GET** `/health`

Check server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T14:30:00Z",
  "uptime": 3600
}
```

---

## Error Handling

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error description"
}
```

**Common HTTP Status Codes:**
- 200: OK
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

---

## Authentication

### Session Management
- Sessions expire after **30 minutes** of inactivity
- Verification codes expire after **10 minutes**
- Maximum **5 failed verification attempts**
- Sessions stored in HTTP-only cookies (production)
- CORS credentials required: `include`

### Request Examples with Auth

Using fetch:
```javascript
const response = await fetch('http://localhost:3001/api/admin/update-dam', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Important: sends cookies
  body: JSON.stringify({
    damId: 'kariba',
    capacity_percent: 85.0,
    notes: 'Weekly update'
  })
});
```

Using curl:
```bash
curl -X POST http://localhost:3001/api/admin/update-dam \
  -H "Content-Type: application/json" \
  -b "sessionId=<session-id>" \
  -d '{
    "damId": "kariba",
    "capacity_percent": 85.0
  }'
```

---

## Rate Limiting

- Verification codes: Max 5 attempts per request
- Session timeout: 30 minutes inactivity
- Code expiry: 10 minutes

---

## CORS

**Allowed Origins:**
- http://localhost:3000
- http://localhost:3001

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type
- Authorization

---

## Data Types

### DAM Status
- `normal`: Capacity > 80%
- `caution`: Capacity 60-80%
- `warning`: Capacity < 60%

### DAM Types
- Hydroelectric
- Irrigation
- Water Supply
- Recreation
- Fishing

### User Roles
- `data-collector`: Can update dam data

---

## Notes

- All times are in ISO 8601 format
- Capacity percentages are floats (0.0 - 100.0)
- Latitude/Longitude coordinates are in decimal degrees
- Request IDs are UUIDs
- Session IDs are randomly generated strings
