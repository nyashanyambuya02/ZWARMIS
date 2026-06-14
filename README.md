# ZWARMIS Backend

Zimbabwe Water Resource Monitoring System - Backend API Server

## Features

- ✅ Express.js REST API
- ✅ Authentication with verification codes
- ✅ DAM data management
- ✅ CORS enabled for frontend integration
- ✅ In-memory session storage
- ✅ Email-based verification (demo mode by default)
- ✅ Update history tracking

## Installation

1. Navigate to the backend directory:
```bash
cd zwarmis-backend
```

2. Install dependencies:
```bash
npm install
```

## Configuration

Create a `.env` file in the backend directory:

```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=zwarmis-secret-key-2026

# Email configuration (optional - uses demo mode by default)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## Running the Server

### Development (with auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/request-access` - Request access with credentials
  - Body: `{ username, userEmail, company, purpose }`
- `POST /api/auth/verify-code` - Verify code and create session
  - Body: `{ code, requestId }`
- `POST /api/auth/logout` - Logout and destroy session

### DAM Management

- `GET /api/admin/dams` - Get all dams
- `GET /api/admin/dams/:damId` - Get single dam
- `POST /api/admin/update-dam` - Update dam capacity (requires auth)
  - Body: `{ damId, capacity_percent, notes }`
- `GET /api/admin/history` - Get all update history
- `GET /api/admin/history/:damId` - Get dam update history

### Health

- `GET /health` - Server health check

## Demo Mode

By default, the backend runs in demo mode where:
- Verification codes are logged to console instead of emailed
- A verification code is generated for each request
- All data is stored in memory (not persisted between restarts)

## Data Storage

### Dams Data

The server loads dam data from `dams-data.json`. This file contains:

```json
{
  "dams": [
    {
      "id": "dam-id",
      "name": "Dam Name",
      "capacity_percent": 75.5,
      "province": "Province Name",
      "type": "Hydroelectric",
      "latitude": -16.5,
      "longitude": 28.7,
      "image_url": "https://...",
      "last_updated": "2026-03-25",
      "status": "normal"
    }
  ]
}
```

## Session Management

- Sessions expire after 30 minutes of inactivity
- Sessions are stored in memory
- Cookies are httpOnly and secure (in production)
- Session data includes user info and request context

## Testing

### Test Request Access:
```bash
curl -X POST http://localhost:3001/api/auth/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "username": "John Doe",
    "userEmail": "john@example.com",
    "company": "Water Authority",
    "purpose": "Monitor dam levels"
  }'
```

### Verify Code:
```bash
curl -X POST http://localhost:3001/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

### Get Dams:
```bash
curl http://localhost:3001/api/admin/dams
```

### Update Dam (requires auth):
```bash
curl -X POST http://localhost:3001/api/admin/update-dam \
  -H "Content-Type: application/json" \
  -d '{
    "damId": "kariba",
    "capacity_percent": 82.5,
    "notes": "Weekly update"
  }' \
  -b "sessionId=YOUR_SESSION_ID"
```

## Database

Currently using in-memory storage. For production, consider:
- MongoDB
- PostgreSQL
- MySQL
- Firebase Firestore

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |
| NODE_ENV | development | Environment |
| FRONTEND_URL | http://localhost:3000 | Frontend URL |
| SESSION_SECRET | zwarmis-secret-key-2026 | Session encryption key |
| SMTP_HOST | smtp.gmail.com | Email server |
| SMTP_PORT | 587 | Email port |
| SMTP_USER | noreply@zwarmis.com | Email user |
| SMTP_PASS | app-password | Email password |
| CORS_ORIGIN | localhost:3000,localhost:3001 | Allowed origins |

## Troubleshooting

### Port already in use
```bash
# Find process using port 3001
lsof -i :3001
# Kill process
kill -9 <PID>
```

### CORS errors
- Check CORS_ORIGIN in .env
- Verify frontend URL matches CORS_ORIGIN

### Session not persisting
- Ensure cookies are enabled
- Check httpOnly flag in production
- Verify SESSION_SECRET is set

## Development Notes

- Demo mode logs verification codes to console
- No persistent database by default
- All data cleared on server restart
- Frontend should handle API errors gracefully

## License

MIT
