# Textifying Speaking

## Description

*Textifying Speaking* is a local full-stack web application that automates the transcription of audio and video files, offering the option to generate summaries of the obtained transcriptions. This tool is ideal for students, professionals, and anyone who needs to convert multimedia content into text and obtain summaries from them.

## Features

### 🔐 User Authentication
- **User Registration (US-01)**: Secure user registration with email and password
  - Username validation (3-30 characters)
  - Email format validation
  - Password strength enforcement (minimum 8 characters)
  - Secure password hashing using bcrypt
  - Duplicate email/username detection
  - Success modal with navigation options
- **User Login (US-02)**: Secure JWT-based authentication
  - Email and password validation
  - Bcrypt password verification
  - JWT token generation (1-hour expiration)
  - Client-side token storage
  - Invalid credentials handling
  - Success notification with automatic redirect

### 📁 File Management
- **Media File Upload (US-03)**: Upload audio/video files for transcription
  - Supported formats: MP3, WAV, MP4, M4A
  - Maximum file size: 100MB
  - Drag-and-drop interface
  - Real-time upload progress tracking
  - Client-side file validation
  - Server-side file type and size validation
  - JWT-protected endpoint (authentication required)
  - Multipart form data support with Axios

- **Dashboard & File Management (US-04)**: View and manage uploaded files
  - List all user's uploaded files in a responsive grid layout
  - File cards display: filename, type, size, upload date, status
  - Color-coded status badges (uploaded, processing, completed, failed)
  - File type icons for audio/video files
  - View detailed file information in modal
  - Delete files with confirmation prompt
  - Ownership validation (users can only delete their own files)
  - Dynamic UI updates after deletion
  - Empty state with upload CTA
  - JWT-protected endpoints (authentication required)

- **Real-Time File Status Updates (US-05)**: Monitor file processing in real-time
  - WebSocket-based real-time status updates using Socket.IO
  - Status indicators: uploading, ready, processing, completed, error
  - Progress tracking (0-100%) for files being processed
  - Connection status indicator in dashboard
  - Automatic UI updates without page refresh
  - Status badges with animated icons:
    - Uploading: Purple with spinner
    - Ready: Green
    - Processing: Yellow with spinning cog + progress percentage
    - Completed: Blue with checkmark
    - Error: Red with alert icon
  - Progress bar visualization in file details modal
  - Error message display for failed operations
  - Toast notifications for completed files and errors
  - JWT-secured WebSocket connections
  - User-scoped updates (only see your own file updates)
  - Status update API endpoint for testing/integration

- **Audio/Video Transcription (US-06)**: Transcribe media files to text
  - One-click transcription initiation from dashboard
  - "Transcribe" button for files in 'ready' status
  - Async transcription processing (non-blocking)
  - HuggingFace Whisper (medium) model for speech recognition
  - Python-based transcription service (Flask + Transformers)
  - Real-time status updates via WebSocket
  - Status progression: ready → processing → completed/error
  - Transcribed text stored in database
  - View transcribed text in modal with copy-to-clipboard
  - File ownership validation (users can only transcribe their own files)
  - File type validation (audio/video only)
  - Duplicate transcription prevention
  - Error handling with descriptive messages
  - Support for multiple audio formats (MP3, WAV, M4A, MP4)
  - GPU acceleration support when available
  - Containerized transcription service with Docker
  - JWT-protected transcription endpoint

- **Background Real-time Transcription Progress (US-07)**: Process transcriptions asynchronously with real-time feedback
  - BullMQ job queue for background transcription processing
  - Redis as message broker for distributed job queue
  - Non-blocking transcription (returns immediately after job enqueue)
  - Background worker processes jobs with configurable concurrency (2 jobs simultaneously)
  - Automatic retry mechanism (up to 3 attempts with exponential backoff)
  - Real-time progress updates every 5% (5%, 10%, 15%, ..., 90%, 95%, 100%)
  - WebSocket broadcasts of progress to authenticated users
  - Google Drive-style floating progress indicator in UI:
    - Fixed bottom-right corner position
    - Shows all files currently processing
    - Real-time progress bars with percentage
    - Auto-hides when no files processing
  - Enhanced toast notifications with rich content:
    - Transcription started (info with spinner icon)
    - Transcription completed (success with checkmark)
    - Transcription failed (error with details)
  - User can navigate freely while transcription runs in background
  - Failed jobs retained for debugging and monitoring
  - Dashboard updates automatically without page refresh
  - Scalable architecture for handling multiple concurrent transcriptions

- **View Transcription (US-08)**: Access and review transcribed text
  - Dedicated GET `/media/:id/transcription` endpoint for secure access
  - View transcribed text in responsive modal dialog
  - Copy-to-clipboard functionality for easy text extraction
  - Displays file metadata (filename, file ID) with transcription
  - Status-aware responses:
    - Completed: Returns full transcription text
    - Processing: Shows progress and "in progress" message
    - Error: Displays error message from failed transcription
    - Ready/Uploading: Indicates transcription hasn't started
  - Ownership validation (users can only view their own transcriptions)
  - Real-time UI updates when transcription completes via WebSocket
  - Scrollable container for long transcriptions
  - Whitespace-preserved text formatting
  - Error handling for missing or incomplete transcriptions
  - JWT-protected endpoint ensuring data privacy
  - Integrates with existing Dashboard file cards
  - "View Text" button appears for completed files with transcription

- **Summarize Transcription (US-09)**: Generate AI-powered summaries of completed transcriptions
  - Dedicated POST `/media/:id/summarize` endpoint with JWT authentication
  - Uses mT5_multilingual_XLSum model for multilingual abstractive text summarization
  - Supports 45+ languages for comprehensive international coverage
  - Asynchronous processing via BullMQ job queue (non-blocking API responses)
  - Real-time WebSocket updates for summarization progress and completion
  - Dashboard features:
    - "Summarize" button for completed files with transcriptions
    - "View Summary" button displays after successful summarization
    - Summary modal shows both summary and original transcription
    - Copy-to-clipboard for both summary and transcription
    - Color-coded UI (purple theme) to distinguish from transcription
  - Validation and error handling:
    - Only files with completed transcriptions can be summarized
    - File ownership validation (403 if unauthorized)
    - Prevents duplicate summarization when already processing
    - Descriptive error messages for failures
  - Progress tracking:
    - Files tracked with summaryStatus field (pending, processing, completed, error)
    - Real-time toast notifications (start, completion, error)
    - FloatingProgressIndicator shows summarization progress
    - Visual indicators with animated icons
  - Background processing:
    - Automatic chunking for texts longer than 512 words
    - Configurable summary length (30-150 tokens)
    - Retry mechanism (up to 3 attempts with exponential backoff)
    - Failed jobs retained for debugging
  - Data persistence:
    - Summary stored in MongoDB (summaryText field)
    - Error messages captured (summaryErrorMessage field)
    - Summary status tracked separately from transcription status
  - Independent service architecture:
    - Python Flask service on port 5001
    - GPU acceleration support via CUDA
    - Scalable and isolated from transcription service
  - WebSocket events for real-time updates:
    - summaryStatusUpdate broadcasts to user when status changes
    - Automatic UI synchronization without page refresh


## Tech Stack

### Backend
- **Framework**: NestJS 10.x (TypeScript)
- **Database**: MongoDB with Mongoose ODM
- **Cache/Queue**: Redis 7.0 for BullMQ job queue
- **Job Queue**: BullMQ with @nestjs/bullmq for background job processing
- **Authentication**: bcrypt for password hashing, JWT for session management
- **File Upload**: Multer for multipart form data handling
- **Real-Time Communication**: Socket.IO with @nestjs/websockets & @nestjs/platform-socket.io
- **HTTP Client**: axios for service-to-service communication
- **Validation**: class-validator & class-transformer
- **Configuration**: @nestjs/config for environment variables
- **Testing**: Jest for unit and E2E tests

### Transcription Service
- **Language**: Python 3.11
- **Framework**: Flask 3.0
- **AI Model**: OpenAI Whisper (medium) via HuggingFace Transformers
- **ML Libraries**: PyTorch, Transformers, Accelerate
- **Audio Processing**: FFmpeg
- **Container**: Python 3.11-slim Docker image

### Summarization Service
- **Language**: Python 3.11
- **Framework**: Flask 3.0
- **AI Model**: mT5_multilingual_XLSum via HuggingFace Transformers (45+ languages)
- **ML Libraries**: PyTorch, Transformers, Accelerate, SentencePiece
- **Container**: Python 3.11-slim Docker image

### Frontend
- **Framework**: React 19 + Vite 7
- **Routing**: React Router DOM 7
- **Styling**: TailwindCSS 4
- **HTTP Client**: Axios for API requests & file uploads
- **Real-Time Communication**: Socket.IO client (socket.io-client)
- **Form Validation**: Yup for schema-based validation
- **State Management**: Zustand with persist middleware
- **Notifications**: React Toastify
- **Icons**: Iconify React

### DevOps
- **Containerization**: Docker & Docker Compose
- **Services**: Frontend (port 5173), Backend (port 3001), Transcription (port 5000), MongoDB (port 27017)
- **Build Tool**: Makefile for common tasks

## Quick Start

### Prerequisites
- Docker and Docker Compose V2
- Make (optional, for using Makefile commands)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd textifying-speaking

# Build and start all services
make quickstart
# OR
docker compose up --build -d

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# Transcription: http://localhost:5000
# MongoDB: mongodb://localhost:27017
# Redis: redis://localhost:6379
```

### Using Makefile

```bash
# View all available commands
make help

# Build containers
make build

# Start services
make up

# Stop services
make down

# View logs
make logs
make logs-backend
make logs-frontend
make logs-transcription
make logs-redis

# Run tests
make test-backend

# Access container shells
make shell-backend
make shell-frontend
make shell-transcription
make shell-redis
make redis-cli
make db-shell

# Clean up (removes volumes)
make clean
```

## API Documentation

### Authentication Endpoints

#### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2025-11-19T20:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors (invalid email, weak password, etc.)
- `409 Conflict`: Email or username already exists

**Validation Rules:**
- `username`: Required, 3-30 characters
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters

#### POST `/auth/login`
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors (missing fields, invalid email format)
- `401 Unauthorized`: Invalid credentials (wrong email or password)

**Validation Rules:**
- `email`: Required, valid email format
- `password`: Required

**JWT Token:**
- Expiration: 1 hour
- Payload includes: user ID (`sub`), email, username
- Store in `localStorage` on client-side for subsequent authenticated requests

### Media Endpoints

#### POST `/media/upload`
Upload an audio or video file for transcription.

**Authentication:** Required (Bearer JWT token)

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with file field

**Example (curl):**
```bash
curl -X POST http://localhost:3001/media/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/audio.mp3"
```

**Success Response (201):**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "507f1f77bcf86cd799439011",
    "filename": "file-1637258400000-123456789.mp3",
    "originalFilename": "audio.mp3",
    "mimetype": "audio/mpeg",
    "size": 2048576,
    "uploadDate": "2025-11-19T20:00:00.000Z",
    "status": "uploaded"
  }
}
```

**Error Responses:**
- `400 Bad Request`: No file uploaded, invalid file type, or file too large
- `401 Unauthorized`: Missing or invalid JWT token

**Validation Rules:**
- Allowed MIME types: `audio/mpeg`, `audio/wav`, `audio/x-wav`, `video/mp4`, `audio/mp4`, `audio/x-m4a`
- Maximum file size: 100MB
- Allowed extensions: `.mp3`, `.wav`, `.mp4`, `.m4a`

**Storage:**
- Files stored in: `MEDIA_STORAGE_PATH` (default: `./uploads`)
- Filename format: `file-{timestamp}-{random}.{ext}`
- Metadata stored in MongoDB

#### GET `/media`
List all uploaded files for the authenticated user.

**Authentication:** Required (Bearer JWT token)

**Example (curl):**
```bash
curl -X GET http://localhost:3001/media \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "files": [
    {
      "id": "507f1f77bcf86cd799439011",
      "filename": "file-1637258400000-123456789.mp3",
      "originalFilename": "audio.mp3",
      "mimetype": "audio/mpeg",
      "size": 2048576,
      "uploadDate": "2025-11-19T20:00:00.000Z",
      "status": "uploaded"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token

**Response Fields:**
- `id`: Unique file identifier
- `filename`: Stored filename on server
- `originalFilename`: Original filename uploaded by user
- `mimetype`: File MIME type
- `size`: File size in bytes
- `uploadDate`: Upload timestamp (ISO 8601)
- `status`: Processing status (`uploaded`, `processing`, `completed`, `failed`)

#### DELETE `/media/:id`
Delete a specific file by ID.

**Authentication:** Required (Bearer JWT token)

**Path Parameters:**
- `id`: File ID (MongoDB ObjectId)

**Example (curl):**
```bash
curl -X DELETE http://localhost:3001/media/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "message": "File deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not own the file
- `404 Not Found`: File not found

**Behavior:**
- Validates file ownership before deletion
- Deletes both physical file from storage and database record
- If physical file is missing, continues with database deletion (logs error)

#### PATCH `/media/:id/status`
Update the processing status of a file.

**Authentication:** Required (Bearer JWT token)

**Path Parameters:**
- `id`: File ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "status": "processing",
  "progress": 50,
  "errorMessage": "Optional error message"
}
```

**Example (curl):**
```bash
curl -X PATCH http://localhost:3001/media/507f1f77bcf86cd799439011/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"processing","progress":50}'
```

**Success Response (200):**
```json
{
  "message": "File status updated successfully",
  "file": {
    "id": "507f1f77bcf86cd799439011",
    "status": "processing",
    "progress": 50
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status value
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not own the file
- `404 Not Found`: File not found

**Valid Status Values:**
- `uploading`: File is being uploaded
- `ready`: File is ready for processing
- `processing`: File is being transcribed
- `completed`: Transcription completed successfully
- `error`: An error occurred during processing

**Behavior:**
- Validates file ownership before updating
- Emits real-time WebSocket update to user
- Updates status, progress, and optional error message

#### POST `/media/:id/transcribe`
Initiate transcription for an audio/video file.

**Authentication:** Required (Bearer JWT token)

**Path Parameters:**
- `id`: File ID (MongoDB ObjectId)

**Example (curl):**
```bash
curl -X POST http://localhost:3001/media/507f1f77bcf86cd799439011/transcribe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "message": "Transcription started",
  "file": {
    "id": "507f1f77bcf86cd799439011",
    "status": "processing"
  }
}
```

**Error Responses:**
- `400 Bad Request`: File is not an audio/video file
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not own the file
- `404 Not Found`: File not found
- `500 Internal Server Error`: File is already processing or completed, transcription service error

**Behavior:**
- Validates file ownership and type (audio/video only)
- Checks file status (rejects if already processing or completed)
- Updates status to `processing` immediately
- Sends file to Python transcription service asynchronously
- Emits real-time WebSocket updates during processing
- On success: stores transcribed text, updates status to `completed`
- On failure: updates status to `error` with error message
- Returns immediately (transcription happens in background)

**Supported MIME Types:**
- `audio/mpeg` (MP3)
- `audio/wav` (WAV)
- `audio/mp4` (M4A)
- `video/mp4` (MP4)
- `audio/x-m4a` (M4A)

**Transcription Service:**
- Uses OpenAI Whisper (small) model via HuggingFace
- Supports GPU acceleration when available
- Timeout: 5 minutes per file
- Automatic chunking for long audio (30-second chunks)

#### GET `/media/:id/transcription`
Retrieve the transcription text for a transcribed file.

**Authentication:** Required (Bearer JWT token)

**Path Parameters:**
- `id`: File ID (MongoDB ObjectId)

**Example (curl):**
```bash
curl -X GET http://localhost:3001/media/507f1f77bcf86cd799439011/transcription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200) - Completed File:**
```json
{
  "status": "completed",
  "transcription": "This is the transcribed text from the audio file...",
  "fileId": "507f1f77bcf86cd799439011",
  "originalFilename": "audio.mp3"
}
```

**Success Response (200) - Processing File:**
```json
{
  "status": "processing",
  "progress": 75,
  "message": "Transcription is in progress"
}
```

**Success Response (200) - Error File:**
```json
{
  "status": "error",
  "message": "Transcription failed: Service unavailable"
}
```

**Success Response (200) - Ready/Uploading File:**
```json
{
  "status": "ready",
  "message": "Transcription has not been started yet"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not own the file
- `404 Not Found`: File not found
- `500 Internal Server Error`: Completed file has no transcription text (data inconsistency)

**Behavior:**
- Validates file ownership before returning transcription
- Returns different responses based on file status:
  - `completed`: Returns full transcription text with file metadata
  - `processing`: Returns progress percentage and status message
  - `error`: Returns error message from failed transcription
  - `ready`/`uploading`: Returns message indicating transcription hasn't started
- Only the file owner can retrieve transcription (enforces data privacy)

**Use Cases:**
- Display transcribed text in UI after completion
- Check transcription status without fetching full file details
- Implement "View Transcription" feature in frontend
- Poll for completion status (though WebSockets are preferred for real-time updates)

**Best Practices:**
- Use WebSocket events for real-time status updates instead of polling this endpoint
- This endpoint is ideal for retrieving transcription after page reload or direct navigation
- Handle all status responses gracefully in UI (show spinner for processing, error message for errors, etc.)


## Project Structure

```
textifying-speaking/
├── ts-back/                  # NestJS Backend
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   │   ├── dto/         # Data Transfer Objects
│   │   │   ├── guards/      # JWT AuthGuard
│   │   │   ├── strategies/  # JWT Strategy
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/           # Users module
│   │   │   ├── schemas/     # MongoDB schemas (User)
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── media/           # Media upload & transcription module
│   │   │   ├── schemas/     # MongoDB schemas (MediaFile)
│   │   │   ├── filters/     # Exception filters
│   │   │   ├── media.controller.ts
│   │   │   ├── media.service.ts
│   │   │   ├── media.gateway.ts  # WebSocket gateway
│   │   │   └── media.module.ts
│   │   ├── app.module.ts    # Main application module
│   │   └── main.ts          # Application entry point
│   ├── test/                # E2E tests
│   ├── uploads/             # Uploaded files storage
│   ├── Dockerfile
│   └── package.json
├── ts-front/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx   # Navigation with auth UI & upload/dashboard links
│   │   ├── hooks/
│   │   │   └── useFileStatus.js  # WebSocket hook for real-time updates
│   │   ├── pages/
│   │   │   ├── Register.jsx # Registration page
│   │   │   ├── Login.jsx    # Login page
│   │   │   ├── Upload.jsx   # File upload page
│   │   │   ├── Dashboard.jsx # File management & transcription dashboard
│   │   │   └── HealthCheck.jsx
│   │   ├── store/
│   │   │   └── authStore.js # Zustand auth state
│   │   ├── App.jsx          # Main app component & routes
│   │   └── main.jsx         # Application entry point
│   ├── Dockerfile
│   └── package.json
├── ts-transcription/         # Python Transcription Service
│   ├── app.py               # Flask application with Whisper model
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile           # Container with PyTorch & Transformers
│   └── README.md            # Service documentation
├── docker-compose.yml        # Docker services configuration
├── Makefile                  # Development commands
└── README.md                 # This file
```

## Testing

### Backend Tests

```bash
# Run all unit tests
make test-backend
# OR
docker exec ts-backend npm test

# Run E2E tests
make test-backend-e2e
# OR
docker exec ts-backend npm run test:e2e

# Run tests with coverage
make test-backend-cov
# OR
docker exec ts-backend npm run test:cov

# Run specific test suites
npm test -- media.service.spec.ts           # MediaService unit tests
npm test -- summarization.processor.spec.ts # Summarization unit tests
npm test -- media-summarize.e2e-spec.ts     # Summarization E2E tests
```

### Frontend Validation

```bash
# Build frontend (validates JSX/imports)
cd ts-front && npm run build

# Run ESLint
cd ts-front && npm run lint
```

### US-09 Testing

Automated test script validates the complete summarization feature:

```bash
# Run comprehensive US-09 tests
./test-us-09.sh
```

This script validates:
- ✅ Backend unit tests (MediaService + SummarizationProcessor)
- ✅ Frontend build (validates JSX/imports)
- ✅ Frontend linting (ESLint)
- ✅ Docker Compose configuration (service presence)

**Test Results Summary:**
- Backend: 43/43 tests passing
  - MediaService: 24 tests
  - SummarizationProcessor: 6 tests
  - Other modules: 13 tests
- Frontend: Builds successfully with no errors
- Frontend: ESLint passes with no warnings

### Manual Testing Workflow

To test the complete summarization workflow with services running:

```bash
# 1. Start all services
make quickstart

# 2. Register a user
curl -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# 3. Login to get token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.accessToken')

# 4. Upload a media file
FILE_ID=$(curl -s -X POST http://localhost:3001/media/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/audio.mp3" \
  | jq -r '.file._id')

# 5. Start transcription
curl -X POST http://localhost:3001/media/$FILE_ID/transcribe \
  -H "Authorization: Bearer $TOKEN"

# 6. Wait for transcription to complete (check status via WebSocket or polling)

# 7. Start summarization
curl -X POST http://localhost:3001/media/$FILE_ID/summarize \
  -H "Authorization: Bearer $TOKEN"

# 8. Check summary status
curl -X GET http://localhost:3001/media \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.[] | select(._id=="'$FILE_ID'") | {summaryStatus, summaryText}'
```

### Browser Testing

1. Open http://localhost:5173 in browser
2. Register/login as user
3. Upload an audio/video file
4. Click 'Transcribe' button
5. Wait for transcription to complete (watch floating progress indicator)
6. Click 'Summarize' button (purple button appears after transcription)
7. Wait for summarization to complete (watch floating progress indicator)
8. Click 'View Summary' button to see modal with summary and transcription
9. Test copy-to-clipboard buttons in modal
10. Verify real-time updates work (status badges update automatically)


## Environment Variables

### Backend (`ts-back/.env`)
```env
MONGODB_URI=mongodb://mongodb:27017/textifying-speaking
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
MEDIA_STORAGE_PATH=./uploads
REDIS_HOST=redis
REDIS_PORT=6379
TRANSCRIPTION_SERVICE_URL=http://transcription:5000
SUMMARIZATION_SERVICE_URL=http://summarization:5001
```

### Transcription Service (`ts-transcription/.env`)
```env
PORT=5000
```

### Summarization Service (`ts-summarization/.env`)
```env
PORT=5001
```

### Docker Compose
Environment variables are configured in `docker-compose.yml` for containerized deployments.

## Security Features

- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ JWT-based authentication with 1-hour token expiration
- ✅ Input validation (client-side and server-side)
- ✅ Email uniqueness enforcement
- ✅ Username uniqueness enforcement
- ✅ File ownership validation (users can only delete their own files)
- ✅ Status update ownership validation (users can only update their own files)
- ✅ Protected routes (authentication required for sensitive operations)
- ✅ JWT-secured WebSocket connections (authentication required for real-time updates)
- ✅ User-scoped WebSocket broadcasts (users only receive updates for their own files)
- ✅ File ownership validation for transcription (users can only transcribe their own files)
- ✅ File type validation for transcription (audio/video only)
- ✅ File ownership validation for summarization (users can only summarize their own files)
- ✅ Transcription completion validation for summarization (prevents summarization of unfinished transcriptions)
- ✅ CORS enabled for frontend communication
- ✅ MongoDB connection security
- ✅ Secure credential verification (constant-time comparison via bcrypt)
- 🔜 Rate limiting (future enhancement)
- 🔜 Email verification (future enhancement)
- 🔜 Refresh tokens (future enhancement)

## Development Notes

- Frontend uses JavaScript (JSX), not TypeScript
- Backend uses TypeScript with strict validation
- MongoDB uses Mongoose ODM for schema definition
- All passwords are hashed before storage
- Docker Compose manages service orchestration
- Hot reload enabled for development mode

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
