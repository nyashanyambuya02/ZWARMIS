# Testing Checklist for ZWARMIS Backend

## ✅ Health Check
```bash
curl http://localhost:3001/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

## ✅ Get All Dams
```bash
curl http://localhost:3001/api/admin/dams
```
Expected: Array of 26+ dams with capacity levels

## ✅ Authentication Flow

### 1. Request Access
```bash
curl -X POST http://localhost:3001/api/auth/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Test User",
    "userEmail": "test@example.com",
    "company": "Test Company",
    "purpose": "Testing API"
  }'
```

Save the returned `requestId` and look for the verification code in the server console.

### 2. Check Auth Status (Not Authenticated)
```bash
curl http://localhost:3001/api/auth/status
```
Expected:
```json
{
  "authenticated": false,
  "username": null
}
```

### 3. Verify Code
```bash
curl -X POST http://localhost:3001/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```
(Replace with actual code from server console)

Save the returned `sessionId` from Set-Cookie header.

### 4. Check Auth Status (Authenticated)
```bash
curl http://localhost:3001/api/auth/status \
  -b "sessionId=<your-session-id>"
```
Expected:
```json
{
  "authenticated": true,
  "username": "Test User",
  "userId": "...",
  "role": "data-collector"
}
```

## ✅ Update Dam (Requires Auth)
```bash
curl -X POST http://localhost:3001/api/admin/update-dam \
  -H "Content-Type: application/json" \
  -d '{
    "damId": "kariba",
    "capacity_percent": 85.0,
    "notes": "Test update"
  }' \
  -b "sessionId=<your-session-id>"
```

## ✅ Get Dam Update History
```bash
curl http://localhost:3001/api/admin/history/kariba
```

## ✅ Logout
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -b "sessionId=<your-session-id>"
```

## 📊 Frontend Integration Tests

1. **Open Frontend**: Open `zwarmis-frontend/index.html` in browser
2. **Check Console**: Open DevTools (F12) and check for any errors
3. **API Calls**: Monitor Network tab for API calls to http://localhost:3001
4. **Authentication**: Click "Add/Update Data" and complete flow
5. **Update Dam**: Select a dam and update its capacity
6. **Verify Update**: Check if dam capacity updated on map and dashboard

## 🔧 Troubleshooting

### Server Won't Start
- [ ] Port 3001 not in use
- [ ] Node.js installed (`node --version`)
- [ ] Dependencies installed (`npm list`)
- [ ] No syntax errors (check server.js)

### CORS Issues
- [ ] Check CORS_ORIGIN in .env
- [ ] Browser shows CORS error in console
- [ ] Verify frontend URL matches

### Authentication Issues
- [ ] Code expires after 10 minutes
- [ ] Max 5 verification attempts
- [ ] Session expires after 30 minutes
- [ ] Check browser cookies enabled

### DAM Data Not Loading
- [ ] Check dams-data.json exists
- [ ] Valid JSON format (use JSONLint)
- [ ] Check server logs for parse errors
- [ ] Fallback to default mock data

## 📝 Notes
- Demo mode prints verification codes to console
- All data stored in memory (lost on server restart)
- No database setup required for testing
- CORS credentials: include (for cookies)
