# API CURL Examples

## Authentication

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "professor@example.com",
    "password": "securepass123",
    "role": "professor",
    "name": "John Doe",
    "profile": {
      "employee_id": "EMP123",
      "department": "Computer Science",
      "subjects": ["Programming", "Algorithms"]
    }
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "professor@example.com",
    "password": "securepass123"
  }'
```

## User Management

### Get User Profile
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "department": "Computer Science",
    "subjects": ["Programming", "Data Structures"]
  }'
```

### Get Activity Logs
```bash
curl -X GET http://localhost:3000/api/users/activity-logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Books

### Get All Books
```bash
# Basic query
curl -X GET http://localhost:3000/api/books \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With filters and pagination
curl -X GET "http://localhost:3000/api/books?search=python&genre=programming&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Single Book
```bash
curl -X GET http://localhost:3000/api/books/BOOK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Book
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Programming",
    "isbn": "978-0-123456-78-9",
    "publisher": "Tech Publishing",
    "publication_year": 2024,
    "authors": ["John Doe", "Jane Smith"],
    "genres": ["Programming", "Computer Science"],
    "copies": 5
  }'
```

## Members

### Get All Members
```bash
curl -X GET http://localhost:3000/api/members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Single Member
```bash
curl -X GET http://localhost:3000/api/members/MEMBER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Member
```bash
curl -X POST http://localhost:3000/api/members \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "555-0123"
  }'
```

## Loans

### Get All Loans
```bash
curl -X GET http://localhost:3000/api/loans \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Loan
```bash
curl -X POST http://localhost:3000/api/loans \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "book_copy_id": "BOOK_COPY_ID",
    "member_id": "MEMBER_ID",
    "due_date": "2024-04-14T23:59:59Z"
  }'
```

### Return Book
```bash
curl -X POST http://localhost:3000/api/loans/LOAN_ID/return \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Reservations

### Get All Reservations (Admin/Librarian)
```bash
curl -X GET http://localhost:3000/api/reservations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Book Waiting List
```bash
curl -X GET http://localhost:3000/api/reservations/book/BOOK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Reservation
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": "BOOK_ID",
    "member_id": "MEMBER_ID"
  }'
```

### Cancel Reservation
```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Courses

### Get All Courses
```bash
# Basic query
curl -X GET http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With department filter
curl -X GET "http://localhost:3000/api/courses?department=Computer%20Science" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Course Details
```bash
curl -X GET http://localhost:3000/api/courses/COURSE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Course (Admin only)
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CS101",
    "title": "Introduction to Programming",
    "description": "Basic programming concepts using Python",
    "department": "Computer Science",
    "credits": 3
  }'
```

### Create Course Section
```bash
curl -X POST http://localhost:3000/api/courses/COURSE_ID/sections \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "professor_id": "PROFESSOR_ID",
    "semester": "Fall",
    "year": 2024,
    "max_students": 30
  }'
```

### Add Course Material
```bash
curl -X POST http://localhost:3000/api/sections/SECTION_ID/materials \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Week 1 Lecture Notes",
    "type": "lecture",
    "content_url": "https://example.com/materials/week1.pdf",
    "description": "Introduction to Python basics",
    "due_date": "2024-02-01T00:00:00Z"
  }'
```

### Add Course Schedule
```bash
curl -X POST http://localhost:3000/api/sections/SECTION_ID/schedule \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "day_of_week": 1,
    "start_time": "09:00",
    "end_time": "10:30",
    "room": "CS-101",
    "type": "lecture"
  }'
```

### Enroll Student
```bash
curl -X POST http://localhost:3000/api/sections/SECTION_ID/enroll \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STUDENT_ID"
  }'
```

### Record Attendance
```bash
curl -X POST http://localhost:3000/api/schedule/SCHEDULE_ID/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STUDENT_ID",
    "status": "present",
    "note": "Participated actively in class discussion"
  }'
```

## Notes

1. Replace `YOUR_JWT_TOKEN` with an actual JWT token obtained from the login endpoint
2. Replace IDs (like `BOOK_ID`, `COURSE_ID`, etc.) with actual UUIDs from your system
3. All requests requiring authentication must include the `Authorization` header
4. For POST/PUT requests, ensure the `Content-Type: application/json` header is set
5. URL encode any query parameters when using filters