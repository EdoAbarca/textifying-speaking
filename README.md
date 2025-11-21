# Textifying Speaking

## Description

*Textifying Speaking* is a full-stack web application that automates the transcription of audio and video files, offering the option to generate summaries of the obtained transcriptions. This tool is ideal for students, professionals, and anyone who needs to convert multimedia content into text and obtain summaries from them.

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

## Tech Stack

### Backend
- **Framework**: NestJS 10.x (TypeScript)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: bcrypt for password hashing, JWT for session management
- **File Upload**: Multer for multipart form data handling
- **Validation**: class-validator & class-transformer
- **Configuration**: @nestjs/config for environment variables
- **Testing**: Jest for unit and E2E tests

### Frontend
- **Framework**: React 19 + Vite 7
- **Routing**: React Router DOM 7
- **Styling**: TailwindCSS 4
- **HTTP Client**: Axios for API requests & file uploads
- **Form Validation**: Yup for schema-based validation
- **State Management**: Zustand with persist middleware
- **Notifications**: React Toastify
- **Icons**: Iconify React

### DevOps
- **Containerization**: Docker & Docker Compose
- **Services**: Frontend (port 5173), Backend (port 3001), MongoDB (port 27017)
- **Build Tool**: Makefile for common tasks

## Quick Start

### Prerequisites
- Docker and Docker Compose V2
- Node.js 20+ (for local development)
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
# MongoDB: mongodb://localhost:27017
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

# Run tests
make test-backend

# Access container shells
make shell-backend
make shell-frontend
make db-shell

# Clean up (removes volumes)
make clean
```

### Local Development (Without Docker)

```bash
# Install all dependencies
make install
# OR
cd ts-back && npm install
cd ../ts-front && npm install

# Set up environment variables
# Create ts-back/.env file with:
# MONGODB_URI=mongodb://localhost:27017/textifying-speaking
# JWT_SECRET=your-secret-key

# Start backend (in ts-back/)
npm run start:dev

# Start frontend (in ts-front/)
npm run dev
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
│   │   ├── media/           # Media upload module
│   │   │   ├── schemas/     # MongoDB schemas (MediaFile)
│   │   │   ├── media.controller.ts
│   │   │   ├── media.service.ts
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
│   │   │   └── Navbar.jsx   # Navigation with auth UI & Dashboard link
│   │   ├── pages/
│   │   │   ├── Register.jsx # Registration page
│   │   │   ├── Login.jsx    # Login page
│   │   │   ├── Upload.jsx   # File upload page
│   │   │   ├── Dashboard.jsx # File management dashboard
│   │   │   └── HealthCheck.jsx
│   │   ├── store/
│   │   │   └── authStore.js # Zustand auth state
│   │   ├── App.jsx          # Main app component & routes
│   │   └── main.jsx         # Application entry point
│   ├── Dockerfile
│   └── package.json
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
```

### Manual Testing

#### Registration Tests

1. **Registration Success:**
   ```bash
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   ```

2. **Duplicate Email:**
   ```bash
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser2","email":"test@example.com","password":"password123"}'
   ```

3. **Invalid Input:**
   ```bash
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"ab","email":"invalid","password":"short"}'
   ```

#### Login Tests

1. **Login Success:**
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Invalid Credentials:**
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"wrongpassword"}'
   ```

3. **Non-existent User:**
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"nonexistent@example.com","password":"password123"}'
   ```

#### File Upload Tests

1. **Upload Audio File (requires authentication):**
   ```bash
   # First, login and get token
   TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     | jq -r '.accessToken')
   
   # Then upload file
   curl -X POST http://localhost:3001/media/upload \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@/path/to/audio.mp3"
   ```

2. **Upload Without Authentication:**
   ```bash
   curl -X POST http://localhost:3001/media/upload \
     -F "file=@/path/to/audio.mp3"
   ```

3. **Upload Invalid File Type:**
   ```bash
   curl -X POST http://localhost:3001/media/upload \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@/path/to/document.pdf"
   ```

#### Dashboard & File Management Tests

1. **List User Files:**
   ```bash
   # Get authentication token
   TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     | jq -r '.accessToken')

   # List all files for authenticated user
   curl -X GET http://localhost:3001/media \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Delete File:**
   ```bash
   # Delete a specific file (use file ID from list response)
   curl -X DELETE http://localhost:3001/media/507f1f77bcf86cd799439011 \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Delete Another User's File (Should Fail):**
   ```bash
   # Attempt to delete a file owned by another user
   # Should return 403 Forbidden
   curl -X DELETE http://localhost:3001/media/ANOTHER_USER_FILE_ID \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Frontend Dashboard Access:**
   - Navigate to http://localhost:5173/dashboard
   - Login if not authenticated (auto-redirects to /login)
   - View grid of uploaded files with metadata
   - Click "Details" button to see full file information in modal
   - Click "Delete" button to remove a file (shows confirmation modal)
   - Confirm deletion and verify file list updates automatically
   - View empty state with "Upload Your First File" button when no files exist
   - Use "Refresh" button to manually reload file list

## Environment Variables

### Backend (`ts-back/.env`)
```env
MONGODB_URI=mongodb://mongodb:27017/textifying-speaking
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
MEDIA_STORAGE_PATH=./uploads
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
- ✅ Protected routes (authentication required for sensitive operations)
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
