# Library Management System API Documentation

## Base URL
```http
http://localhost:3000/api
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```http
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

Request Body:
```json
{
  "email": "string",
  "password": "string",
  "role": "admin | professor | student | parent",
  "name": "string",
  "profile": {
    // For students
    "student_id": "string",
    "grade": "string",
    "parent_id": "string",
    
    // For professors
    "employee_id": "string",
    "department": "string",
    "subjects": "string[]"
  }
}
```

Response: `201 Created`
```json
{
  "message": "User registered successfully"
}
```

#### Login
```http
POST /auth/login
```

Request Body:
```json
{
  "email": "string",
  "password": "string"
}
```

Response: `200 OK`
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "role": "string",
    "name": "string"
  }
}
```

### User Management

#### Get User Profile
```http
GET /users/profile
```

Response: `200 OK`
```json
{
  "id": "string",
  "email": "string",
  "role": "string",
  "name": "string",
  "status": "string",
  "created_at": "timestamp",
  "profile": {
    // Role-specific profile data
  },
  "activity_logs": [
    {
      "action": "string",
      "details": "object",
      "created_at": "timestamp"
    }
  ]
}
```

#### Update Profile
```http
PUT /users/profile
```

Request Body:
```json
{
  "name": "string",
  "grade": "string",      // For students
  "department": "string", // For professors
  "subjects": "string[]"  // For professors
}
```

Response: `200 OK`
```json
{
  // Updated user profile
}
```

#### Get Activity Logs
```http
GET /users/activity-logs
```

Response: `200 OK`
```json
[
  {
    "action": "string",
    "details": "object",
    "created_at": "timestamp"
  }
]
```

### Books

#### Get All Books
```http
GET /books
```

Query Parameters:
- `search` (optional): Full-text search across title, ISBN, and publisher
- `genre` (optional): Filter by genre name
- `author` (optional): Filter by author name
- `available` (optional): Filter by availability (true/false)
- `sortBy` (optional): Sort results by field (title, publication_year, borrow_count)
- `sortOrder` (optional): Sort direction (asc/desc)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)

Response: `200 OK`
```json
{
  "books": [
    {
      "id": "uuid",
      "title": "string",
      "author": "string",
      "isbn": "string",
      "publisher": "string",
      "publication_year": "number",
      "authors": "string (comma-separated)",
      "genres": "string (comma-separated)",
      "total_copies": "number",
      "available_copies": "number",
      "borrow_count": "number",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "totalPages": "number"
  }
}
```

#### Get Single Book
```http
GET /books/:id
```

Response: `200 OK`
```json
{
  "id": "uuid",
  "title": "string",
  "author": "string",
  "isbn": "string",
  "publisher": "string",
  "publication_year": "number",
  "authors": "string (comma-separated)",
  "genres": "string (comma-separated)",
  "total_copies": "number",
  "available_copies": "number",
  "borrow_count": "number",
  "created_at": "timestamp",
  "copies": [
    {
      "id": "uuid",
      "status": "string",
      "condition": "string",
      "location": "string"
    }
  ],
  "loanHistory": [
    {
      "id": "uuid",
      "member_name": "string",
      "loan_date": "timestamp",
      "due_date": "timestamp",
      "return_date": "timestamp",
      "status": "string"
    }
  ]
}
```

### Reservations

#### Get All Reservations (Admin/Librarian only)
```http
GET /reservations
```

Response: `200 OK`
```json
[
  {
    "id": "uuid",
    "book_id": "uuid",
    "book_title": "string",
    "member_id": "uuid",
    "member_name": "string",
    "member_email": "string",
    "reservation_date": "timestamp",
    "status": "string",
    "expiry_date": "timestamp"
  }
]
```

#### Get Book Waiting List
```http
GET /reservations/book/:bookId
```

Response: `200 OK`
```json
[
  {
    "id": "uuid",
    "member_name": "string",
    "member_email": "string",
    "reservation_date": "timestamp",
    "status": "string",
    "expiry_date": "timestamp"
  }
]
```

#### Create Reservation
```http
POST /reservations
```

Request Body:
```json
{
  "book_id": "uuid",
  "member_id": "uuid"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "book_id": "uuid",
  "book_title": "string",
  "member_id": "uuid",
  "member_name": "string",
  "member_email": "string",
  "reservation_date": "timestamp",
  "status": "pending",
  "expiry_date": "timestamp"
}
```

#### Cancel Reservation
```http
POST /reservations/:id/cancel
```

Response: `200 OK`
```json
{
  "id": "uuid",
  "book_id": "uuid",
  "book_title": "string",
  "member_id": "uuid",
  "member_name": "string",
  "member_email": "string",
  "reservation_date": "timestamp",
  "status": "cancelled",
  "expiry_date": "timestamp"
}
```

### Courses

#### Get All Courses
```http
GET /courses
```

Query Parameters:
- `department` (optional): Filter by department
- `status` (optional): Filter by status (active/inactive)

Response: `200 OK`
```json
[
  {
    "id": "uuid",
    "code": "string",
    "title": "string",
    "description": "string",
    "department": "string",
    "credits": "number",
    "total_sections": "number",
    "total_students": "number",
    "status": "string",
    "created_at": "timestamp"
  }
]
```

#### Get Course Details
```http
GET /courses/:id
```

Response: `200 OK`
```json
{
  "id": "uuid",
  "code": "string",
  "title": "string",
  "description": "string",
  "department": "string",
  "credits": "number",
  "status": "string",
  "created_at": "timestamp",
  "sections": [
    {
      "id": "uuid",
      "professor_name": "string",
      "semester": "string",
      "year": "number",
      "enrolled_students": "number",
      "max_students": "number",
      "status": "string"
    }
  ]
}
```

#### Create Course (Admin only)
```http
POST /courses
```

Request Body:
```json
{
  "code": "string",
  "title": "string",
  "description": "string",
  "department": "string",
  "credits": "number"
}
```

Response: `201 Created`
```json
{
  // Course object
}
```

#### Create Course Section
```http
POST /courses/:id/sections
```

Request Body:
```json
{
  "professor_id": "uuid",
  "semester": "Fall | Spring | Summer",
  "year": "number",
  "max_students": "number"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "course_id": "uuid",
  "professor_id": "uuid",
  "professor_name": "string",
  "semester": "string",
  "year": "number",
  "max_students": "number",
  "current_students": "number",
  "status": "string"
}
```

#### Add Course Material
```http
POST /sections/:sectionId/materials
```

Request Body:
```json
{
  "title": "string",
  "type": "syllabus | assignment | lecture | reading | video",
  "content_url": "string",
  "description": "string",
  "due_date": "timestamp"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "section_id": "uuid",
  "title": "string",
  "type": "string",
  "content_url": "string",
  "description": "string",
  "due_date": "timestamp",
  "created_at": "timestamp"
}
```

#### Add Course Schedule
```http
POST /sections/:sectionId/schedule
```

Request Body:
```json
{
  "day_of_week": "number (0-6)",
  "start_time": "string (HH:mm)",
  "end_time": "string (HH:mm)",
  "room": "string",
  "type": "lecture | lab | exam | office_hours"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "section_id": "uuid",
  "day_of_week": "number",
  "start_time": "string",
  "end_time": "string",
  "room": "string",
  "type": "string",
  "created_at": "timestamp"
}
```

#### Enroll Student
```http
POST /sections/:sectionId/enroll
```

Request Body:
```json
{
  "student_id": "uuid"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "student_name": "string",
  "section_id": "uuid",
  "course_code": "string",
  "course_title": "string",
  "status": "string",
  "created_at": "timestamp"
}
```

#### Record Attendance
```http
POST /schedule/:scheduleId/attendance
```

Request Body:
```json
{
  "student_id": "uuid",
  "status": "present | absent | late | excused",
  "note": "string"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "schedule_id": "uuid",
  "student_id": "uuid",
  "student_name": "string",
  "status": "string",
  "note": "string",
  "created_at": "timestamp"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "errors": [
    {
      "msg": "string",
      "param": "string",
      "location": "string"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests, please try again later"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!"
}
```