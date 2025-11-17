# CivicEvents+ Frontend

A complete, accessible, responsive frontend for the CivicEvents+ civic engagement platform. Built with HTML, Tailwind CSS, and jQuery, it provides a polished user experience for both regular users and administrators.

## 🚀 Features

### Authentication & Security
- ✅ Secure signup/login with JWT tokens
- ✅ Password strength validation (8+ chars, mixed case, numbers, symbols)
- ✅ Session vs persistent storage options
- ✅ Automatic token expiration handling
- ✅ Role-based access control (admin vs user)

### Core User Features
- ✅ **Events**: Browse, register, provide feedback with ratings
- ✅ **Announcements**: Listen to audio announcements with accessible controls
- ✅ **Promos**: Watch video promos with caption support
- ✅ **Service Requests**: Submit civic service requests and track status
- ✅ **Notifications**: Real-time in-app notifications with bell indicator
- ✅ **Profile Management**: Update personal information
- ✅ **My Events**: View and manage event registrations
- ✅ **Global Search**: Search across events, announcements, and promos

### Admin Features
- ✅ **Dashboard**: Comprehensive metrics and activity overview
- ✅ **Event Management**: Full CRUD with image uploads
- ✅ **Media Management**: Upload audio announcements and video promos
- ✅ **User Management**: Enable/disable users, view profiles
- ✅ **Notification Broadcasting**: Send targeted notifications
- ✅ **Service Request Management**: Review and update request status

### Accessibility & UX
- ✅ Semantic HTML with proper ARIA labels
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ High contrast color schemes
- ✅ Responsive design (mobile-first)
- ✅ Loading states and skeleton screens
- ✅ Toast notifications for user feedback
- ✅ Offline detection

## 🏗️ Architecture

| Component | Technology | Purpose |
|-----------|------------|----------|
| **Styling** | Tailwind CSS (CDN) | Utility-first responsive design |
| **JavaScript** | Vanilla ES5 + jQuery | Lightweight, compatible scripting |
| **State Management** | CivicAuth module | User authentication and role management |
| **Routing** | Hash-based router | SPA navigation with role guards |
| **API Layer** | CivicAPI module | HTTP client with auth injection |
| **File Structure** | Modular views | Feature-based organization |

### Key Files
- `index.html` – Main layout with auth screens and navigation
- `js/api.js` – API client, toast system, event bus
- `js/auth.js` – Authentication flows and state management
- `js/router.js` – Client-side routing with role-based guards
- `js/search.js` – Global search functionality
- `js/views/` – Feature modules (events, admin tools, etc.)

## 📋 Prerequisites

1. **Backend API**: The CivicEvents+ backend must be running
   - Default URL: `http://localhost:4000/api`
   - Follow `backend/README.md` for setup instructions
   - Ensure PostgreSQL database is configured and running

2. **Static Web Server**: Any HTTP server (no build process required)
   - Node.js: `npx serve frontend`
   - Python: `python -m http.server 3000`
   - Live Server (VS Code extension)
   - Any other static file server

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```
Verify the backend is running at `http://localhost:4000`

### 2. Serve the Frontend
```bash
cd frontend
npx serve .
```
Or use any static file server of your choice.

### 3. Open in Browser
Navigate to `http://localhost:3000` (or your server's URL)

### 4. Test the Application
- **Create Account**: Use the signup form with a strong password
- **Login**: Sign in with your credentials
- **Explore**: Browse events, announcements, and promos
- **Admin Access**: Contact an admin to upgrade your role for full features

## ⚙️ Configuration

### Backend API URL
The frontend connects to `http://localhost:4000/api` by default. To use a different backend:

```html
<!-- Add this before loading js/api.js in index.html -->
<script>
  window.CIVIC_EVENTS_API_BASE_URL = 'https://your-api-domain.com/api';
</script>
```

### Environment Variables
No build-time environment variables needed. All configuration is runtime-based.

### Authentication Storage

| Storage Type | When Used | Persistence | Security |
|--------------|-----------|-------------|----------|
| **sessionStorage** | Default login | Tab session only | Higher security |
| **localStorage** | "Keep me signed in" | Across browser sessions | User convenience |

**Storage Key**: `civicevents_auth`  
**Manual Logout**: Clear this key from browser storage

## 📱 User Flows

### Regular User Journey
1. **Sign Up** → Create account with strong password
2. **Browse Events** → Filter by date/location, view details
3. **Register** → Sign up for events, provide feedback
4. **Media Consumption** → Listen to announcements, watch promos
5. **Service Requests** → Submit civic service requests
6. **Profile Management** → Update personal information

### Admin Workflow
1. **Dashboard** → Monitor platform metrics and activity
2. **Content Management** → Create/edit events, upload media
3. **User Administration** → Manage user accounts and permissions
4. **Communication** → Send targeted notifications
5. **Service Management** → Review and respond to service requests

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (buttons, links, focus states)
- **Success**: Emerald (confirmations, published status)
- **Warning**: Amber (drafts, pending states)
- **Error**: Rose (errors, destructive actions)
- **Neutral**: Slate (text, borders, backgrounds)

### Typography
- **Headings**: Semibold weights for hierarchy
- **Body**: Regular weight for readability
- **Captions**: Smaller sizes for metadata

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: Consistent padding and hover states
- **Forms**: Clear labels and validation feedback
- **Modals**: Accessible with focus management

## 🧪 Testing Guide

### Browser Compatibility
- ✅ **Chrome/Chromium** (Recommended)
- ✅ **Firefox** (Fully supported)
- ✅ **Edge** (Fully supported)
- ⚠️ **Safari** (Should work, not extensively tested)

### Testing Scenarios

#### User Testing
1. **Account Creation**: Test password validation and signup flow
2. **Event Interaction**: Browse, register, cancel, provide feedback
3. **Media Consumption**: Play audio/video with accessibility features
4. **Service Requests**: Submit and track civic service requests
5. **Profile Management**: Update personal information

#### Admin Testing
1. **Dashboard**: Verify metrics and activity display
2. **Content Management**: Create events with image uploads
3. **Media Management**: Upload audio/video with captions
4. **User Management**: Enable/disable accounts, view profiles
5. **Notifications**: Send targeted broadcasts

#### Accessibility Testing
1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with NVDA/JAWS/VoiceOver
3. **Color Contrast**: Verify WCAG AA compliance
4. **Focus Management**: Ensure visible focus indicators

### Demo Recording (5-7 minutes)
**Required Coverage**:
1. Backend setup and database connection
2. User signup/login and core features
3. Admin dashboard and management tools
4. Accessibility features demonstration
5. Mobile responsiveness showcase

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **401 Unauthorized** | Expired token | Automatic redirect to login |
| **CORS Errors** | Backend configuration | Ensure backend allows frontend origin |
| **API Not Found** | Wrong base URL | Check `CIVIC_EVENTS_API_BASE_URL` |
| **Upload Failures** | File size/type | Check browser console for validation errors |
| **Blank Page** | JavaScript errors | Check browser console for errors |
| **Styles Missing** | Tailwind CDN issue | Verify internet connection |

### File Upload Limits
- **Images**: 4MB max, common formats (jpg, png, gif)
- **Audio**: 15MB max, common formats (mp3, wav)
- **Video**: 200MB max, common formats (mp4, mov)

### Performance Tips
- Use modern browsers for best performance
- Clear browser cache if experiencing issues
- Ensure stable internet connection for media uploads
- Monitor browser console for any JavaScript errors

## 🤝 Contributing

### Code Style
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Test across multiple browsers

### Adding Features
1. Create new view file in `js/views/`
2. Register route in router
3. Add navigation if needed
4. Update this README

### Security Considerations
- All role checks are UX-only (backend enforces real security)
- Sanitize user inputs before display
- Use HTTPS in production
- Regularly update dependencies

---

**Built with ❤️ for civic engagement and community participation.**