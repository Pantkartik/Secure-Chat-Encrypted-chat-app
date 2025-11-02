# 🔒 Security Implementation for Cypher Chat

This security implementation adds authentication and protection to your existing Cypher Chat backend without changing its core logic.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Configure Environment
Edit the `.env` file and change these values:
```
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-very-random
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-secure-admin-password
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
PORT=3001
```

### 3. Start the Secure Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 4. Access Admin Panel
Open your browser and go to: `http://localhost:3001/admin`

Default credentials (change these in .env):
- Username: `admin`
- Password: `admin123`

## 🛡️ Security Features

### ✅ Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Admin-only access** to protected endpoints
- **Session management** with automatic cleanup
- **Rate limiting** on login attempts (5 attempts per 15 minutes)

### ✅ Security Headers
- **Helmet.js** for security headers
- **Content Security Policy** (CSP) protection
- **XSS protection** and other security headers

### ✅ Data Protection
- **bcryptjs** for secure password hashing
- **HTTPS-ready** cookie configuration
- **Input validation** and sanitization
- **Request size limiting** (10MB max)

### ✅ API Protection
- **Rate limiting** on all endpoints
- **CORS** configuration for specific origins
- **Error handling** without exposing sensitive information
- **Health check** endpoint for monitoring

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)

### Admin
- `GET /admin` - Admin login page
- `GET /api/auth/stats` - Get session statistics (requires auth)

### System
- `GET /api/health` - Health check (public)

### Chat API (Protected)
- All original chat endpoints are available under `/api/chat/*` with authentication
- Original endpoints remain accessible without auth for backward compatibility

## 🔧 Configuration Options

### Environment Variables
```bash
# Required - JWT secret for token signing
JWT_SECRET=your-secret-key

# Required - Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password

# Optional - Allowed origins for CORS
ALLOWED_ORIGINS=http://localhost:3000

# Optional - Server port (default: 3001)
PORT=3001

# Optional - Environment (development/production)
NODE_ENV=development
```

### Security Settings
The implementation includes:
- **24-hour** JWT token expiration
- **15-minute** rate limiting windows
- **5 login attempts** per IP per window
- **24-hour** session cleanup interval
- **Secure cookies** in production mode

## 🔄 Backward Compatibility

Your existing chat functionality remains unchanged:
- Original endpoints work exactly as before
- Socket.IO connections are preserved
- Session management continues to work
- File upload/download functionality is maintained

## 🚨 Important Security Notes

### ⚠️ Production Deployment
1. **Change default credentials** in `.env` file
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable HTTPS** for secure cookie transmission
4. **Configure proper CORS origins**
5. **Set NODE_ENV=production**

### ⚠️ Monitoring
- Check `/api/health` endpoint regularly
- Monitor active sessions via admin dashboard
- Review server logs for suspicious activity
- Consider implementing IP whitelisting for admin access

### ⚠️ Regular Maintenance
- Update dependencies regularly
- Review and rotate JWT secrets periodically
- Monitor for security advisories
- Backup your `.env` file securely

## 🆘 Troubleshooting

### Can't access admin panel?
- Ensure server is running on correct port
- Check browser console for CORS errors
- Verify `ALLOWED_ORIGINS` includes your frontend URL

### Login not working?
- Verify `.env` file exists and has correct values
- Check that dependencies are installed
- Ensure admin credentials match `.env` configuration

### Original app not working?
- Use `npm run original` to run the original version
- Check that all original dependencies are installed
- Verify no port conflicts

## 📞 Support

For security issues or questions:
1. Check the server logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are properly installed
4. Test with both development and production modes

---

**Remember**: This security implementation adds protection without breaking your existing functionality. Your original chat application continues to work exactly as before, with the added benefit of secure admin access and monitoring capabilities.