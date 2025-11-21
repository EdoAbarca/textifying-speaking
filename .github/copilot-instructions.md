# Copilot Instructions for Textifying Speaking

## Project Overview
Textifying Speaking is a web application for audio/video transcription and summarization with user authentication. Built as a containerized full-stack application with:
- **Backend**: NestJS 10.x (TypeScript) on port 3001
- **Frontend**: React 19 + Vite 7 (JavaScript/JSX) with TailwindCSS 4 on port 5173
- **Database**: MongoDB 7.0 on port 27017 with Mongoose ODM
- **Architecture**: Microservices with Docker Compose orchestration

## Project Structure
```
ts-back/          # NestJS backend (TypeScript)
  src/
    auth/         # Authentication module (registration, login)
      dto/        # Data Transfer Objects for validation
        register.dto.ts
        login.dto.ts
      guards/     # JWT guards
        jwt-auth.guard.ts
      strategies/ # Passport strategies
        jwt.strategy.ts
      auth.controller.ts
      auth.service.ts
      auth.service.spec.ts
      auth.module.ts
    users/        # Users module
      schemas/    # MongoDB schemas (User)
      users.service.ts
      users.module.ts
    media/        # Media upload & status module
      schemas/    # MongoDB schemas (MediaFile)
        media-file.schema.ts
      media.controller.ts
      media.service.ts
      media.service.spec.ts
      media.gateway.ts # WebSocket gateway for real-time updates
      media.module.ts
    app.module.ts # Main module with MongoDB & Config
    main.ts       # Entry point with ValidationPipe
  test/           # E2E tests
    auth-register.e2e-spec.ts
    auth-login.e2e-spec.ts
    media-upload.e2e-spec.ts
    media-list.e2e-spec.ts
    media-delete.e2e-spec.ts
    media-status.e2e-spec.ts
  uploads/        # Uploaded files storage
ts-front/         # React frontend (JSX, not TypeScript)
  src/
    components/   # Shared components
      Navbar.jsx  # Navigation with auth-aware UI & upload button
    hooks/        # Custom React hooks
      useFileStatus.js # WebSocket hook for real-time status updates
    pages/        # Page components
      Register.jsx
      Login.jsx
      Dashboard.jsx # File list with real-time status updates
      Upload.jsx  # File upload page
      HealthCheck.jsx
    store/        # Zustand state management
      authStore.js # Auth state (user, token, actions)
    App.jsx       # Routes with ToastContainer & Navbar
    assets/       # Static resources
docker-compose.yml # Orchestrates backend, frontend, MongoDB
Makefile          # Development commands
```

## Development Workflow

### Running the Application
**IMPORTANT**: Use Docker Compose V2 syntax (`docker compose`, NOT `docker-compose`).

Using Makefile (recommended):
```bash
make quickstart             # Build and start all services
make up                     # Start services
make down                   # Stop services
make logs                   # View logs
make test-backend           # Run backend tests
make help                   # See all commands
```

Using Docker Compose directly:
```bash
docker compose up --build -d  # Build and start all services
docker compose down          # Stop services
docker compose logs -f       # Follow logs
```

Individual service development (without Docker):
```bash
# Backend (in ts-back/)
npm run start:dev           # Watch mode with hot reload

# Frontend (in ts-front/)
npm run dev                 # Vite dev server
```

### Testing
Backend uses Jest for unit and E2E tests:
```bash
# Using Makefile
make test-backend           # Unit tests
make test-backend-e2e       # E2E tests
make test-backend-cov       # With coverage

# Using Docker
docker exec ts-backend npm test
docker exec ts-backend npm run test:e2e
docker exec ts-backend npm run test:cov

# Local
cd ts-back
npm test                    # Unit tests
npm run test:e2e            # E2E tests
npm run test:cov            # With coverage
```

## Code Conventions

### Frontend (ts-front/)
- **Language**: JavaScript (JSX), NOT TypeScript despite project name
- **Styling**: TailwindCSS 4 utility classes (gradient backgrounds, rounded corners, shadows)
- **Routing**: React Router DOM 7 with `<Routes>` and `<Route>` in `App.jsx`
- **Notifications**: React Toastify with ToastContainer in `App.jsx`
- **Icons**: @iconify/react for all icons (e.g., `mdi:account-plus`, `mdi:login`, `mdi:upload`)
- **State Management**: Zustand for global state (auth store with persist middleware)
- **Form Validation**: Yup schema-based validation with abortEarly: false for multi-field errors
- **Forms**: Controlled components with useState for form data and errors
- **File naming**: PascalCase for components (`Register.jsx`, `Navbar.jsx`)
- **Component structure**: Functional components with default exports
- **API calls**: Axios for file uploads with progress tracking, fetch for other requests
- **File uploads**: multipart/form-data with progress monitoring via axios

### Backend (ts-back/)
- **Language**: TypeScript
- **Pattern**: NestJS decorators (`@Controller()`, `@Get()`, `@Post()`, `@UseGuards()`, `@UseInterceptors()`)
- **Module structure**: Feature-based modules with controller-service pairs
- **Validation**: Global ValidationPipe with class-validator decorators in DTOs
- **Database**: MongoDB with Mongoose ODM (@nestjs/mongoose)
- **Authentication**: JWT tokens with @nestjs/jwt, 1-hour expiration, JwtAuthGuard for protected routes
- **File uploads**: Multer via @nestjs/platform-express for multipart form data
- **Password hashing**: bcrypt with 10 salt rounds
- **CORS**: Enabled globally in `main.ts` via `app.enableCors()`
- **Port**: 3001 (configured in `main.ts`)
- **Testing**: `.spec.ts` files co-located with source files, jest.clearAllMocks() in beforeEach
- **Environment**: ConfigModule for environment variables (MONGODB_URI, JWT_SECRET, MEDIA_STORAGE_PATH)

### Docker & Networking
- Services communicate via `textifying-speaking-network`
- Frontend depends on backend, backend depends on MongoDB (see `docker-compose.yml`)
- MongoDB data persisted in `mongodb_data` volume
- Vite dev server bound to `0.0.0.0` for container access
- Both use `node:20-alpine` base image
- MongoDB uses official `mongo:7.0` image
- Environment variables configured in `docker-compose.yml`
- Both use `node:20-alpine` base image

## Critical Patterns

### Backend API Endpoints
Current pattern (see `app.controller.ts`):
- Routes prefixed at controller level with `@Controller()`
- Return typed objects: `{ message: string }`
- Services injected via constructor dependency injection

### Frontend API Communication
- Frontend expects backend at port 3001
- Health check pattern: `/health` endpoint returning JSON

### File Modifications
- Frontend uses flat ESLint config (`eslint.config.js`)
- Backend uses NestJS CLI conventions (`nest-cli.json`)
- Both have separate `package.json` - install dependencies in correct directory

## Common Tasks

**Add new backend endpoint**: Create/update controller with decorator, implement in service, inject service in controller constructor

**Add new frontend page**: Create component in `src/pages/`, add route in `App.jsx`

**Debug containers**: 
```bash
docker logs ts-backend      # Backend logs
docker logs ts-frontend     # Frontend logs
docker logs ts-mongodb      # MongoDB logs
make shell-backend          # Access backend shell
make shell-frontend         # Access frontend shell
make db-shell              # Access MongoDB shell
```

**Rebuild after dependency changes**:
```bash
docker compose down
docker compose up --build
# OR
make down
make build
make up
```

**Test authentication endpoints**:
```bash
# Register a user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Check MongoDB data**:
```bash
docker exec ts-mongodb mongosh textifying-speaking --eval 'db.users.find().pretty()'
docker exec ts-mongodb mongosh textifying-speaking --eval 'db.mediafiles.find().pretty()'
```

**Test file upload**:
```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.accessToken')

# Upload file
curl -X POST http://localhost:3001/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/audio.mp3"
```

## Features Implemented

### US-01: User Registration ✅
- **Backend**:
  - User schema with username, email, passwordHash, timestamps
  - POST `/auth/register` endpoint with validation
  - Bcrypt password hashing (10 rounds)
  - Duplicate email/username detection
  - DTOs with class-validator decorators
  - Unit tests for auth service
  - E2E tests for registration endpoint
- **Frontend**:
  - Registration form with controlled inputs
  - Client-side validation with visual feedback
  - Loading states during submission
  - Success modal with navigation options
  - Error handling with toast notifications
  - Responsive design with TailwindCSS

### US-02: User Login ✅
- **Backend**:
  - LoginDto with email and password validation
  - POST `/auth/login` endpoint with JWT token generation
  - Bcrypt password verification
  - JWT token with 1-hour expiration
  - User credential validation
  - Unit tests for login service (successful login, invalid credentials, non-existent user)
  - E2E tests for login endpoint
  - JWT Strategy with Passport for token validation
  - JwtAuthGuard for protecting routes
- **Frontend**:
  - Login form with controlled inputs
  - Yup validation with visual feedback
  - JWT token storage via Zustand persist
  - User data storage via Zustand persist
  - Loading states during submission
  - Success notification with automatic redirect
  - Error handling with toast notifications
  - Navigation to registration page
  - Responsive design with TailwindCSS

### US-03: File Upload ✅
- **Backend**:
  - MediaFile schema with userId, filename, mimetype, path, size, uploadDate, status
  - POST `/media/upload` endpoint with JWT authentication
  - Multer configuration for file handling (100MB limit, MIME type validation)
  - File type validation (.mp3, .wav, .mp4, .m4a)
  - Storage in configurable directory (MEDIA_STORAGE_PATH env variable)
  - Unique filename generation (timestamp + random number)
  - Unit tests for media service
  - E2E tests for upload endpoint (auth required, file type validation, size limits)
- **Frontend**:
  - Upload page with drag-and-drop interface
  - File input with accept attribute for allowed types
  - Yup schema validation (file type, size)
  - Real-time upload progress bar with Axios
  - File preview with size display
  - Cancel upload functionality
  - Success/error notifications
  - Protected route (requires authentication)
  - Upload button in Navbar for authenticated users
  - Responsive design with TailwindCSS

### US-04: See Uploaded Files ✅
- **Backend**:
  - GET `/media` endpoint with JWT authentication
  - Returns all files for authenticated user (id, filename, originalFilename, mimetype, size, uploadDate, status)
  - DELETE `/media/:id` endpoint with JWT authentication
  - Ownership validation before deletion (403 if user doesn't own file)
  - Deletes both physical file from storage and database record
  - Graceful handling if physical file missing (logs error, continues with DB deletion)
  - Unit tests for media service (deleteFileById, error handling)
  - E2E tests for both endpoints (auth required, ownership validation, 404/403 errors)
  - Tests use unique timestamps to avoid user conflicts in parallel test execution
- **Frontend**:
  - Dashboard page at `/dashboard` route with grid layout
  - Card-based file display with file type icons (audio/video)
  - File metadata: originalFilename, size (formatted), upload date (formatted), status badge, MIME type
  - Color-coded status badges (green for uploaded, yellow for processing, blue for completed, red for failed)
  - File type icons using @iconify/react (mdi:music, mdi:video, mdi:file)
  - "View Details" button opens modal with full file metadata
  - Details modal shows: file ID, storage filename, size, upload date, status, MIME type
  - "Delete" button with confirmation modal
  - Confirmation modal with warning icon and file name
  - Dynamic UI updates after deletion (fetches updated file list)
  - Empty state with icon and "Upload Your First File" CTA
  - Refresh button to manually reload file list
  - Dashboard link in Navbar for authenticated users
  - Protected route (redirects to login if not authenticated)
  - Error handling with toast notifications
  - Loading states during data fetch and deletion
  - Responsive grid layout (1 column mobile, 2 tablet, 3 desktop)
  - Gradient background with TailwindCSS

### US-05: See File Upload Current Status ✅
- **Backend**:
  - MediaFile schema extended with status enum (uploading, ready, processing, completed, error)
  - Progress field (0-100) for tracking transcription/processing progress
  - Error message field for storing error details
  - PATCH `/media/:id/status` endpoint with JWT authentication for status updates
  - Status transition validation (only valid enum values accepted)
  - Ownership validation before status updates (403 if user doesn't own file)
  - WebSocket gateway (Socket.IO) on `/media` namespace for real-time updates
  - JWT authentication for WebSocket connections via handshake
  - User-scoped WebSocket connections (users only receive updates for their own files)
  - Real-time event emission on status changes (`fileStatusUpdate` event)
  - Real-time progress updates (`fileProgress` event)
  - File upload sets initial status to 'ready' with 100% progress
  - Unit tests for status update methods (updateFileStatus, updateFileProgress)
  - E2E tests for status endpoint (all status transitions, auth, ownership, validation)
- **Frontend**:
  - Socket.IO client integration for real-time updates
  - Custom `useFileStatus` hook for WebSocket connection management
  - Automatic connection/disconnection based on authentication
  - Real-time file status updates without page refresh
  - Dashboard displays connection status indicator (green dot when connected)
  - Status badges with icons and colors for each state:
    - uploading: purple with spinner icon
    - ready: green with no icon
    - processing: yellow with spinning cog icon + progress percentage
    - completed: blue with checkmark icon
    - error: red with alert icon
  - Progress bar visualization in file details modal
  - Error message display for files in error state
  - Upload page already has progress tracking (inherited from US-03)
  - Toast notifications for completed files and errors
  - Smooth UI updates via React state management
- **Testing**:
  - Test script (`test-us-05.sh`) for end-to-end status transitions
  - Manual testing instructions for browser-based real-time updates
  - All tests passing (unit, E2E, integration)
- **API Examples**:
  ```bash
  # Update file status to processing
  curl -X PATCH http://localhost:3001/media/{fileId}/status \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"processing","progress":50}'
  
  # Update file status to completed
  curl -X PATCH http://localhost:3001/media/{fileId}/status \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"completed","progress":100}'
  
  # Update file status to error
  curl -X PATCH http://localhost:3001/media/{fileId}/status \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"error","errorMessage":"Transcription failed"}'
  ```
