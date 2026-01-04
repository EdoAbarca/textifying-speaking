# Copilot Instructions for Textifying Speaking

## Project Overview
Textifying Speaking is a web application for audio/video transcription and summarization with user authentication. Built as a containerized full-stack application with:
- **Backend**: NestJS 10.x (TypeScript) on port 3001
- **Frontend**: React 19 + Vite 7 (JavaScript/JSX) with TailwindCSS 4 on port 5173
- **Database**: MongoDB 7.0 on port 27017 with Mongoose ODM
- **Cache/Queue**: Redis 7.0 on port 6379 for BullMQ job queue
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
    media/        # Media upload, status & transcription module
      schemas/    # MongoDB schemas (MediaFile)
        media-file.schema.ts
      filters/    # Exception filters
        multer-exception.filter.ts
      media.controller.ts
      media.service.ts
      media.service.spec.ts
      media.gateway.ts # WebSocket gateway for real-time updates
      media.module.ts
      transcription.processor.ts # BullMQ processor for async transcription
      transcription.processor.spec.ts # Unit tests for processor
      summarization.processor.ts # BullMQ processor for async summarization
      summarization.processor.spec.ts # Unit tests for processor
    app.module.ts # Main module with MongoDB, BullMQ & Config
    main.ts       # Entry point with ValidationPipe
  test/           # E2E tests
    auth-register.e2e-spec.ts
    auth-login.e2e-spec.ts
    media-upload.e2e-spec.ts
    media-list.e2e-spec.ts
    media-delete.e2e-spec.ts
    media-status.e2e-spec.ts
    media-transcribe.e2e-spec.ts
  uploads/        # Uploaded files storage
ts-front/         # React frontend (JSX, not TypeScript)
  src/
    components/   # Shared components
      Navbar.jsx  # Navigation with auth-aware UI, upload & dashboard buttons
      FloatingProgressIndicator.jsx # Google Drive-style progress indicator
    hooks/        # Custom React hooks
      useFileStatus.js # WebSocket hook for real-time status updates
    pages/        # Page components
      Register.jsx
      Login.jsx
      Dashboard.jsx # File list with transcription buttons & real-time updates
      Upload.jsx  # File upload page
      HealthCheck.jsx
    store/        # Zustand state management
      authStore.js # Auth state (user, token, actions)
    App.jsx       # Routes with ToastContainer & Navbar
    assets/       # Static resources
ts-transcription/ # Python transcription service
  app.py          # Flask app with Whisper model (lazy loading)
  requirements.txt # Python dependencies (flask, torch, transformers, accelerate)
  Dockerfile      # Python 3.11-slim with FFmpeg
  README.md       # Service documentation
ts-summarization/ # Python summarization service
  app.py          # Flask app with mT5 multilingual model (lazy loading)
  requirements.txt # Python dependencies (flask, torch, transformers, accelerate, sentencepiece)
  Dockerfile      # Python 3.11-slim
  README.md       # Service documentation
docker-compose.yml # Orchestrates backend, frontend, transcription, summarization, MongoDB
Makefile          # Development commands
```

## GPU Memory Optimization

Both AI services use **lazy loading** to handle GPU memory constraints:
- **Strategy**: Models load on-demand (first request) instead of at service startup
- **Transcription**: `get_pipeline()` function in `ts-transcription/app.py` loads Whisper model
- **Summarization**: `get_summarizer()` function in `ts-summarization/app.py` loads mT5 model
- **Benefits**: 
  - Services start in seconds (no model loading delay)
  - Lower idle memory consumption
  - Both services coexist on same GPU without conflicts
  - Faster container startup/restart times
- **Verification**: Health endpoint includes `model_loaded: false` initially, then `true` after first request

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
- Frontend depends on backend, backend depends on MongoDB and transcription service
- MongoDB data persisted in `mongodb_data` volume
- Vite dev server bound to `0.0.0.0` for container access
- Backend and frontend use `node:20-alpine` base image
- Transcription service uses `python:3.11-slim` base image
- MongoDB uses official `mongo:7.0` image
- Environment variables configured in `docker-compose.yml`

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
docker logs ts-transcription # Transcription service logs
docker logs ts-mongodb      # MongoDB logs
make shell-backend          # Access backend shell
make shell-frontend         # Access frontend shell
make shell-transcription    # Access transcription shell
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

### US-06: Create Transcription ✅
- **Backend**:
  - MediaFile schema extended with `transcribedText` field for storing transcription results
  - POST `/media/:id/transcribe` endpoint with JWT authentication
  - File ownership validation (403 if user doesn't own file)
  - File type validation (audio/video only: mp3, wav, m4a, mp4)
  - Status validation (rejects if already processing or completed)
  - Async transcription processing (non-blocking, returns immediately)
  - Communication with Python transcription service via axios
  - Multipart form data with form-data for file upload to transcription service
  - Status updates: ready → processing (0%) → completed (100%) or error
  - Transcribed text stored in database on completion
  - Real-time WebSocket updates during transcription process
  - Error handling with descriptive messages
  - 5-minute timeout for transcription requests
  - Unit tests for transcribeFile method (success, errors, validation)
  - E2E tests for transcription endpoint (auth, ownership, file type, status validation)
  - ConfigService integration for TRANSCRIPTION_SERVICE_URL
- **Transcription Service**:
  - Python 3.11-based Flask application on port 5000
  - OpenAI Whisper (small) model via HuggingFace Transformers
  - PyTorch for model inference with GPU acceleration support
  - FFmpeg for audio processing
  - GET `/health` endpoint for service health checks
  - POST `/transcribe` endpoint accepting multipart/form-data
  - Automatic device selection (CUDA if available, CPU otherwise)
  - 30-second audio chunking for long files
  - Batch processing (batch_size=16)
  - Temporary file handling with cleanup
  - Error handling and logging
  - Docker containerized with python:3.11-slim
  - Requirements: flask, torch, transformers, accelerate
- **Frontend**:
  - "Transcribe" button for files in 'ready' status
  - Button disabled during transcription (tracked via state)
  - "View Text" button for completed files with transcribedText
  - Transcription text modal with:
    - File name display
    - Formatted text display with whitespace preservation
    - Copy to clipboard functionality
    - Close button
  - "View Transcribed Text" button in file details modal
  - Real-time status updates via WebSocket during transcription
  - Toast notifications for transcription start, completion, and errors
  - Error handling with user-friendly messages
  - Loading states and disabled buttons during processing
  - Icons: mdi:text-to-speech (Transcribe), mdi:text-box-outline (View Text)
- **Docker & Infrastructure**:
  - Transcription service added to docker-compose.yml
  - Service name: `transcription` (container: ts-transcription)
  - Backend depends on transcription service
  - Network: textifying-speaking-network
  - Environment variable: TRANSCRIPTION_SERVICE_URL=http://transcription:5000
  - Makefile updated with transcription commands:
    - `make logs-transcription` - view transcription service logs
    - `make shell-transcription` - access transcription container
    - `make health` - includes transcription health check
- **Testing**:
  - Backend unit tests pass (transcribeFile method)
  - Backend E2E tests pass (transcription endpoint)
  - Manual testing via curl commands
  - Frontend browser testing workflow
  - Health check endpoint for service monitoring
- **API Examples**:
  ```bash
  # Start transcription
  curl -X POST http://localhost:3001/media/{fileId}/transcribe \
    -H "Authorization: Bearer $TOKEN"
  
  # Check transcription service health
  curl http://localhost:5000/health
  
  # Test transcription service directly
  curl -X POST http://localhost:5000/transcribe \
    -F "file=@/path/to/audio.mp3"
  ```
### US-07: Background Real-time Transcription Progress ✅
- **Backend**:
  - BullMQ job queue integration for asynchronous transcription processing
  - Redis 7-alpine as message broker for job queue (port 6379)
  - TranscriptionProcessor worker for background job processing
    - Concurrency: 2 jobs simultaneously
    - Job retry strategy: up to 3 attempts with exponential backoff (5s delay)
    - Automatic job cleanup on completion
    - Failed jobs retained for debugging
  - POST `/media/:id/transcribe` enqueues jobs instead of blocking
    - Returns immediately with 200 status after job creation
    - Job data includes: fileId, userId, filePath, originalFilename
  - TranscriptionProcessor handles async transcription:
    - Progress updates every 5% (5%, 10%, 15%, ..., 90%, 95%, 100%)
    - Real-time WebSocket broadcasts to user at each progress step
    - Updates database with status and progress
    - Stores transcribed text on completion
    - Error handling with status update to 'error' and error message
  - MediaGateway enhanced with overloaded `emitFileStatusUpdate` methods
    - Supports both object-based and parameter-based invocations
    - Type-safe status updates with optional progress and error message
  - Unit tests for TranscriptionProcessor (success, errors, progress updates)
  - E2E tests adapted for async behavior (wait for completion with timeouts)
  - ConfigService for REDIS_HOST and REDIS_PORT environment variables
- **Frontend**:
  - FloatingProgressIndicator component (Google Drive-style):
    - Fixed bottom-right corner position
    - Shows all files currently processing
    - Real-time progress bars with percentage
    - File type icons and truncated filenames
    - Gradient header with animated spinner
    - Auto-hides when no files processing
    - Maximum height with scroll for multiple files
  - Enhanced toast notifications with rich content:
    - "Transcription started" (info) with spinner icon
    - "Transcription completed" (success) with checkmark icon
    - "Transcription failed" (error) with alert icon and error message
    - Icons and formatted messages in toast content
    - Different auto-close times (3s, 5s, 7s) based on importance
  - Real-time Dashboard updates via WebSocket
    - Status badges with animated icons (spinner, cog, checkmark, alert)
    - Progress percentage display next to status badge
    - Smooth UI transitions without page refresh
  - User can navigate freely while transcription runs in background
- **Docker & Infrastructure**:
  - Redis service added to docker-compose.yml
    - Image: redis:7-alpine
    - Container: ts-redis
    - Port: 6379
    - Persistent storage with redis_data volume
    - AOF (append-only file) persistence enabled
    - Connected to textifying-speaking-network
  - Backend depends on Redis service
  - Environment variables: REDIS_HOST=redis, REDIS_PORT=6379
  - Makefile commands added:
    - `make logs-redis` - view Redis logs
    - `make shell-redis` - access Redis container shell
    - `make redis-cli` - access Redis CLI directly
    - `make health` - includes Redis health check (PING command)
- **Dependencies**:
  - Backend: @nestjs/bull@^10.2.1, @nestjs/bullmq@^10.2.1, bullmq@^5.34.0
  - Redis: Official redis:7-alpine Docker image
- **Architecture Benefits**:
  - Non-blocking API responses (immediate return after job enqueue)
  - Scalable job processing (configurable concurrency)
  - Resilient error handling (automatic retries with backoff)
  - Real-time progress feedback via WebSocket
  - User can continue using app while jobs process
  - Failed jobs retained for debugging and monitoring
- **Testing**:
  - Unit tests for TranscriptionProcessor (success, network errors, service errors)
  - E2E tests verify async behavior (job enqueue returns immediately)
  - Manual testing workflow: upload → transcribe → observe real-time updates → completion
- **API Behavior Changes**:
  - POST `/media/:id/transcribe` now returns immediately (non-blocking)
  - Response format unchanged: `{ message: 'Transcription started', file: { id, status } }`
  - Actual transcription happens asynchronously via job queue
  - Status updates pushed to frontend via WebSocket events

### US-08: See Transcription ✅
- **Backend**:
  - GET `/media/:id/transcription` endpoint for secure transcription access
  - MediaService.getTranscription method with status-aware responses:
    - Returns transcription text for completed files with metadata
    - Returns progress info for processing files
    - Returns error message for failed transcriptions
    - Returns status message for ready/uploading files
  - JWT authentication required (JwtAuthGuard)
  - File ownership validation (403 if user doesn't own file)
  - Type-safe return type with optional fields based on status
  - Handles edge cases:
    - File not found (throws InternalServerErrorException)
    - Completed file without transcription text (throws exception for data inconsistency)
  - Unit tests for MediaService.getTranscription:
    - Successful retrieval for completed file
    - Processing status with progress
    - Error status with message
    - Ready/uploading status
    - File not found error
    - Completed file without text error (7 test cases total)
  - E2E tests for GET `/media/:id/transcription`:
    - Ready file response
    - Unauthorized access (401)
    - Forbidden access to other user's file (403)
    - Non-existent file (404)
    - Processing file with progress
    - Error file with message
    - Completed file with transcription
    - Completed file without transcription (500) (8 test cases total)
  - MongoDB direct updates in E2E tests using ObjectId for accurate testing
  - Test isolation with unique timestamps to avoid user conflicts
- **Frontend**:
  - Dashboard already has complete transcription viewing functionality (from US-06)
  - Transcription modal with:
    - Scrollable container for long text
    - Whitespace-preserved formatting (whitespace-pre-wrap)
    - Copy-to-clipboard button with success toast
    - File metadata display (filename)
    - Clean and readable text presentation
  - "View Text" button for completed files with transcribedText
  - "View Transcribed Text" button in file details modal
  - Real-time updates via WebSocket (transcription appears when completed)
  - Frontend uses GET `/media` endpoint which includes transcribedText
  - New GET `/media/:id/transcription` endpoint available for dedicated transcription retrieval (not currently used by frontend, but ready for future optimization)
- **API Endpoint**:
  - Path: GET `/media/:id/transcription`
  - Authentication: Required (Bearer JWT token)
  - Response structure varies by file status:
    ```typescript
    // Completed file
    { 
      status: 'completed',
      transcription: string,
      fileId: string,
      originalFilename: string
    }
    
    // Processing file
    { 
      status: 'processing',
      progress: number,
      message: 'Transcription is in progress'
    }
    
    // Error file
    { 
      status: 'error',
      message: string
    }
    
    // Ready/uploading file
    { 
      status: 'ready' | 'uploading',
      message: 'Transcription has not been started yet'
    }
    ```
  - Error codes:
    - 401: Unauthorized (missing/invalid token)
    - 403: Forbidden (file owned by another user)
    - 404: Not Found (file doesn't exist)
    - 500: Internal Server Error (completed file without transcription)
- **Testing**:
  - Unit tests: 24 passed (MediaService includes getTranscription tests)
  - E2E tests: 8 passed for transcription endpoint
  - End-to-end test script: test-us-08.sh
    - Tests all file statuses (ready, processing, error, completed)
    - Tests authentication and authorization
    - Tests ownership validation
    - Uses MongoDB direct updates for completed file simulation
  - All tests pass with JWT_SECRET environment variable set
- **Documentation**:
  - README.md updated with:
    - Feature description in "View Transcription (US-08)" section
    - API endpoint documentation with examples
    - Response formats for all file statuses
    - Error codes and behaviors
    - Use cases and best practices
  - .github/copilot-instructions.md updated with full implementation details
- **Integration**:
  - Works seamlessly with existing Dashboard UI
  - No frontend changes required (already has transcription viewing from US-06)
  - Backend provides dedicated, secure endpoint for transcription retrieval
  - Supports future optimizations (e.g., lazy loading transcription text)
  - Maintains data privacy through ownership validation
  - Real-time updates via WebSocket ensure UI stays synchronized
### US-09: Summarize Transcription ✅
- **Backend**:
  - MediaFile schema extended with summary fields:
    - `summaryText` (string): Stores generated summary
    - `summaryStatus` (enum): pending, processing, completed, error
    - `summaryErrorMessage` (string): Error details if summarization fails
  - POST `/media/:id/summarize` endpoint:
    - JWT authentication with JwtAuthGuard
    - File ownership validation (403 if unauthorized)
    - Validates transcription is completed before summarization
    - Validates transcribedText exists
    - Prevents duplicate summarization (rejects if already processing)
    - Enqueues summarization job to BullMQ
    - Returns immediately with 200 status (non-blocking)
  - MediaService.summarizeFile method:
    - Updates summaryStatus to 'processing'
    - Adds job to 'summarization' queue with retry strategy
    - Job configuration: 3 attempts, exponential backoff (5s delay)
  - MediaService.updateSummaryStatus method:
    - Updates summaryStatus, summaryText, summaryErrorMessage
    - Returns updated MediaFileDocument
  - SummarizationProcessor worker:
    - Concurrency: 2 jobs simultaneously
    - Calls Python summarization service via axios
    - Sends transcribedText as JSON payload
    - Updates database with summary on completion
    - Emits WebSocket events for real-time updates
    - Error handling with status update to 'error'
    - Stores error message for debugging
  - MediaGateway.emitSummaryStatusUpdate method:
    - Broadcasts to user's WebSocket connections
    - Event: 'summaryStatusUpdate'
    - Payload: fileId, summaryStatus, summaryText?, summaryErrorMessage?, originalFilename?
  - Unit tests for SummarizationProcessor:
    - Successful summarization
    - File not found error
    - Missing transcribed text error
    - Summarization service error
    - API error response (5 test cases total)
  - E2E tests for POST `/media/:id/summarize`:
    - Successful summarization start (200)
    - Unauthorized access (401)
    - Forbidden access to other user's file (403)
    - Non-existent file (404)
    - File without completed transcription (400)
    - File without transcribed text (400)
    - Already summarizing (400) (7 test cases total)
- **Summarization Service**:
  - Python 3.11 Flask application on port 5001
  - mT5_multilingual_XLSum model via HuggingFace Transformers
  - Supports 45+ languages for multilingual summarization
  - POST `/summarize` endpoint:
    - Accepts JSON with 'text' field
    - Validates text is present and non-empty
    - Returns JSON: { success: true, summary: string, model: string }
  - Automatic chunking for long texts (>512 words)
  - Configurable summary length (30-150 tokens)
  - GPU acceleration support via CUDA
  - Error handling and logging
  - GET `/health` endpoint for service monitoring
  - Docker containerized with python:3.11-slim
  - Dependencies: flask, torch, transformers, accelerate, sentencepiece
- **Frontend**:
  - Dashboard enhancements:
    - State management for summarizingFiles (Set of file IDs)
    - handleSummarizeClick: Calls POST `/media/:id/summarize` endpoint
    - handleViewSummary: Opens summary modal
    - handleCopySummaryToClipboard: Copies summary to clipboard
    - handleSummaryStatusUpdate: Callback for WebSocket events
      - Updates file state with summaryStatus, summaryText, summaryErrorMessage
      - Toast notifications for start, completion, error
      - Removes from summarizingFiles set on completion/error
  - UI components:
    - "Summarize" button for completed files with transcribedText (purple, no summary yet)
    - "View Summary" button for files with summaryText (purple)
    - Summary modal with:
      - File metadata display (originalFilename)
      - Summary section with copy-to-clipboard (purple theme)
      - Original transcription section with copy-to-clipboard (indigo theme)
      - Scrollable containers for long texts
      - Whitespace-preserved formatting
      - Close button
  - Real-time updates:
    - useFileStatus hook extended with onSummaryStatusUpdate callback
    - WebSocket listener for 'summaryStatusUpdate' event
    - FloatingProgressIndicator updated to show summarization (purple gradient)
    - Toast notifications with rich content (icons, file names, error messages)
  - Icons:
    - mdi:file-document-outline (Summarize button)
    - mdi:file-document-check-outline (View Summary button, summary modal)
- **Docker & Infrastructure**:
  - Summarization service added to docker-compose.yml:
    - Service name: `summarization` (container: ts-summarization)
    - Port: 5001
    - Environment: PORT=5001, CUDA_VISIBLE_DEVICES=0
    - GPU support via nvidia driver
    - Network: textifying-speaking-network
  - Backend depends on summarization service
  - Environment variable: SUMMARIZATION_SERVICE_URL=http://summarization:5001
  - Makefile commands added:
    - `make logs-summarization` - view logs
    - `make shell-summarization` - access container
    - `make health` - includes summarization health check
- **Testing**:
  - Backend unit tests: SummarizationProcessor (5 tests)
  - Backend E2E tests: POST `/media/:id/summarize` (7 tests)
  - All tests passing
- **API Examples**:
  ```bash
  # Start summarization
  curl -X POST http://localhost:3001/media/{fileId}/summarize \
    -H "Authorization: Bearer $TOKEN"
  
  # Check summarization service health
  curl http://localhost:5001/health
  
  # Test summarization service directly
  curl -X POST http://localhost:5001/summarize \
    -H "Content-Type: application/json" \
    -d '{"text":"Your transcribed text here..."}'
  ```
- **Architecture Benefits**:
  - Non-blocking API responses (immediate return after job enqueue)
  - Scalable processing (configurable concurrency)
  - Resilient error handling (automatic retries with backoff)
  - Real-time progress feedback via WebSocket
  - Independent service for summarization (isolated from transcription)
  - Failed jobs retained for debugging
- **Integration**:
  - Works seamlessly with existing transcription workflow
  - User can summarize after transcription completes
  - Real-time UI updates without page refresh
  - Summary and transcription displayed together in modal
  - Maintains data privacy through ownership validation
  - Purple theme distinguishes summarization from transcription (blue/indigo)

### US-10: Background Real-time Summary Status ✅
**NOTE**: US-10 is fully implemented within US-09. The background processing and real-time updates described in US-10 were architected and built as part of the US-09 implementation.

- **Backend Architecture**:
  - **BullMQ Job Queue Integration**:
    - Redis 7.0 as message broker on port 6379
    - Separate 'summarization' queue distinct from 'transcription' queue
    - SummarizationProcessor worker with concurrency: 2
    - Job retry strategy: up to 3 attempts with exponential backoff (5s delay)
    - Automatic job cleanup on completion
    - Failed jobs retained for debugging and monitoring
  - **Async Processing Flow**:
    - POST `/media/:id/summarize` enqueues job and returns immediately (non-blocking)
    - Response format: `{ message: 'Summarization started', file: { id, summaryStatus } }`
    - Background worker picks up job from queue
    - Updates database and broadcasts WebSocket events during processing
    - Status transitions: pending → processing → completed/error
  - **Real-time WebSocket Broadcasts**:
    - MediaGateway.emitSummaryStatusUpdate broadcasts to authenticated users
    - User-scoped updates (only receive updates for own files)
    - Event: 'summaryStatusUpdate'
    - Payload includes: fileId, summaryStatus, summaryText?, summaryErrorMessage?, originalFilename?
  - **Status Management**:
    - `summaryStatus` field in MediaFile schema (pending, processing, completed, error)
    - `summaryText` stores the generated summary
    - `summaryErrorMessage` captures error details for user display
    - Separate from transcription status (parallel processing support)
  - **Error Handling & Recovery**:
    - Service errors captured and stored in database
    - WebSocket broadcasts of error status to user
    - Automatic retries via BullMQ (3 attempts)
    - Graceful degradation (failed jobs logged for debugging)
  - **ConfigService Integration**:
    - REDIS_HOST and REDIS_PORT environment variables
    - SUMMARIZATION_SERVICE_URL for Python service communication
    - Configurable timeouts and retry strategies

- **Frontend Real-time Updates**:
  - **FloatingProgressIndicator Component**:
    - Shows all files currently processing (transcription AND summarization)
    - Purple gradient theme for summarization (distinct from blue transcription)
    - Displays: filename (truncated), progress indicator, file type icon
    - Fixed bottom-right corner position (Google Drive style)
    - Auto-hides when no files processing
    - Maximum height with scroll for multiple files
    - Filters files with `summaryStatus === 'processing'`
  - **Dashboard Integration**:
    - `summarizingFiles` Set tracks active summarization jobs
    - `handleSummaryStatusUpdate` callback processes WebSocket events
    - Automatic UI state updates without page refresh
    - Status badges update in real-time with animated icons
    - "Summarize" button disabled while processing (duplicate prevention)
  - **Toast Notifications**:
    - Rich content with icons and file names
    - "Summarization started" (info, 3s auto-close, spinner icon)
    - "Summarization completed" (success, 5s auto-close, checkmark icon)
    - "Summarization failed" (error, 7s auto-close, alert icon with error message)
    - Non-intrusive and dismissible
  - **WebSocket Hook**:
    - `useFileStatus` hook listens to 'summaryStatusUpdate' events
    - Automatic connection/disconnection based on authentication
    - JWT authentication for WebSocket handshake
    - Reconnection logic (5 attempts with 1s delay)
    - Console logging for debugging
  - **User Experience**:
    - User can navigate to any page while summarization runs
    - Progress visible across all pages via floating indicator
    - No page refresh required for status updates
    - Multiple files can be summarized simultaneously
    - Clear visual distinction between transcription and summarization

- **Testing & Verification**:
  - **Unit Tests**:
    - SummarizationProcessor: 5 tests (success, errors, service failures)
    - MediaService: 24 tests including summarizeFile method
    - All tests passing (43/43 total)
  - **E2E Tests**:
    - POST `/media/:id/summarize`: 7 tests (auth, ownership, validation, errors)
    - Tests verify async behavior (immediate return after job enqueue)
  - **Manual Testing**:
    - Upload file → transcribe → summarize workflow
    - Multiple simultaneous summarizations
    - Real-time progress indicator visibility
    - Navigation during processing
    - Error scenarios (service unavailable)
    - WebSocket connection monitoring (browser DevTools)
  - **Monitoring & Debugging**:
    - Redis CLI commands to inspect job queues:
      ```bash
      make redis-cli
      > KEYS *summarization*
      > LLEN bull:summarization:waiting
      > LLEN bull:summarization:active
      > LLEN bull:summarization:completed
      > LLEN bull:summarization:failed
      ```
    - Backend logs: `make logs-backend | grep SummarizationProcessor`
    - Summarization service logs: `make logs-summarization`
    - WebSocket events visible in browser console

- **Infrastructure & Deployment**:
  - **Docker Services**:
    - Redis service: redis:7-alpine (container: ts-redis)
    - Persistent storage with redis_data volume
    - AOF (append-only file) persistence enabled
    - Backend depends on Redis service
  - **Makefile Commands**:
    - `make logs-redis` - view Redis logs
    - `make shell-redis` - access Redis container
    - `make redis-cli` - Redis CLI access
    - `make health` - includes Redis health check (PING command)
  - **Environment Variables**:
    - REDIS_HOST=redis
    - REDIS_PORT=6379
    - SUMMARIZATION_SERVICE_URL=http://summarization:5001

- **Acceptance Criteria Verification**:
  - ✅ Summarization process starts asynchronously (BullMQ job queue)
  - ✅ User can continue using application while processing (non-blocking API)
  - ✅ Real-time status shown in Google Drive-style progress spinner (FloatingProgressIndicator)
  - ✅ Real-time updates via WebSocket (summaryStatusUpdate events)
  - ✅ Toast notifications on completion/failure (rich content with icons)
  - ✅ UI updates automatically without manual refresh (WebSocket integration)
  - ✅ Duplicate job prevention (summarizingFiles Set, disabled button)

- **Architecture Highlights**:
  - Consistent with US-07 transcription background processing architecture
  - Reuses existing WebSocket infrastructure (MediaGateway)
  - Independent processing queues (transcription and summarization can run in parallel)
  - Scalable design (configurable concurrency, horizontal scaling via Redis)
  - Production-ready error handling and monitoring
  - Complete separation of concerns (backend workers, frontend UI, Python service)
