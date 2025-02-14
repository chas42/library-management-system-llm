# Library Management System

A comprehensive educational management system that combines library services with academic management, built with Node.js, Express, and SQLite. The system provides robust functionality for managing books, courses, and user interactions in an educational setting.

## Core Features

### 1. Library Management
- **Book Management**
  - Complete book catalog with metadata
  - Multi-copy tracking system
  - Book availability status
  - ISBN-based book identification
  - Publisher and publication year tracking

- **Loan Management**
  - Book checkout and return processing
  - Due date management
  - Automatic fine calculation for overdue books
  - Loan history tracking
  - Maximum loan limit enforcement

- **Reservation System**
  - Online book reservation
  - Automated waiting list management
  - Priority-based queue system
  - Automatic notification system for availability
  - Reservation expiry management

### 2. User Management & Access Control

- **Multi-Role System**
  - Administrators: Full system access
  - Professors: Course management and library access
  - Students: Limited library and course access
  - Parents: Student progress monitoring

- **User Profiles**
  - Personal information management
  - Role-specific dashboards
  - Activity logging
  - Academic records
  - Security preferences

- **Authentication & Security**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - Session management
  - Password encryption
  - Activity monitoring

### 3. Academic Management

- **Course Management**
  - Course creation and configuration
  - Professor assignment
  - Student enrollment
  - Course materials management
  - Academic calendar integration

- **Class Scheduling**
  - Lecture scheduling
  - Room allocation
  - Exam scheduling
  - Office hours management
  - Schedule conflict prevention

- **Content Management**
  - Syllabus upload and management
  - Digital learning materials
  - Assignment distribution
  - Resource sharing
  - Content version control

- **Attendance System**
  - Real-time attendance tracking
  - Absence notifications
  - Attendance reports
  - Excused absence management
  - Attendance statistics

### 4. Technical Features

- **API Architecture**
  - RESTful API design
  - Modular architecture
  - Comprehensive error handling
  - Request validation
  - Response formatting

- **Performance Optimization**
  - In-memory caching
  - Query optimization
  - Connection pooling
  - Rate limiting
  - Response compression

- **Security Features**
  - Input validation
  - SQL injection prevention
  - XSS protection
  - Rate limiting
  - CORS configuration

## System Architecture

### Database Schema
- **Users & Authentication**
  - Users table with role management
  - Profile information
  - Activity logging
  - Security credentials

- **Library Management**
  - Books catalog
  - Book copies tracking
  - Loans management
  - Reservations system
  - Fine calculation

- **Academic Records**
  - Course information
  - Class schedules
  - Attendance records
  - Course materials
  - Student enrollments

### API Endpoints

#### Authentication
- `POST /api/auth/register`: User registration
- `POST /api/auth/login`: User authentication

#### User Management
- `GET /api/users/profile`: Get user profile
- `PUT /api/users/profile`: Update user profile
- `GET /api/users/activity-logs`: Get user activity history

#### Books & Library
- `GET /api/books`: List all books
- `GET /api/books/:id`: Get book details
- `POST /api/books`: Add new book
- `GET /api/loans`: View all loans
- `POST /api/loans`: Create new loan
- `POST /api/loans/:id/return`: Process book return

#### Reservations
- `GET /api/reservations`: List all reservations
- `GET /api/reservations/book/:bookId`: View book waiting list
- `POST /api/reservations`: Create reservation
- `POST /api/reservations/:id/cancel`: Cancel reservation

#### Course Management
- `GET /api/courses`: List all courses
- `GET /api/courses/:id`: Get course details
- `POST /api/courses`: Create new course
- `POST /api/courses/:id/sections`: Create course section
- `POST /api/sections/:sectionId/materials`: Add course material
- `POST /api/sections/:sectionId/schedule`: Add class schedule
- `POST /api/sections/:sectionId/enroll`: Enroll student
- `POST /api/schedule/:scheduleId/attendance`: Record attendance

## Security Implementation

### Authentication
- JWT-based token authentication
- Secure password hashing with bcrypt
- Token expiration and renewal
- Session management

### Authorization
- Role-based access control
- Resource-level permissions
- Action-based restrictions
- Data visibility controls

### API Protection
- Rate limiting for API endpoints
- Stricter limits for authentication
- Input validation and sanitization
- Error handling without exposure

## Performance Features

### Caching
- In-memory cache implementation
- Cache invalidation strategies
- Selective caching for high-demand routes
- Configurable cache duration

### Database Optimization
- Indexed fields for faster queries
- Efficient join operations
- Connection pooling
- Query optimization

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Configure the following variables:
   - `PORT`: Server port (default: 3000)
   - `JWT_SECRET`: Secret key for JWT signing

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

### Running in Development
```bash
npm run dev
```

### Running in Production
```bash
npm start
```

## License

MIT License