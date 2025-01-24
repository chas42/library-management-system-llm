# library-management-system-llm
This project was developed using Bolt.new with the objective of creating a library management system.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API does not require authentication. All endpoints are publicly accessible.

## Endpoints

### Books

#### Get All Books
```http
GET /books
```

Query Parameters:
- `search` (optional): Search books by title or author

Response: `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "string",
    "author": "string",
    "isbn": "string",
    "quantity": "number",
    "created_at": "timestamp"
  }
]
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
  "quantity": "number",
  "created_at": "timestamp"
}
```

Response: `404 Not Found`
```json
{
  "error": "Book not found"
}
```

#### Add New Book
```http
POST /books
```

Request Body:
```json
{
  "title": "string",
  "author": "string",
  "isbn": "string",
  "quantity": "number"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "title": "string",
  "author": "string",
  "isbn": "string",
  "quantity": "number",
  "created_at": "timestamp"
}
```

### Members

#### Get All Members
```http
GET /members
```

Response: `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "created_at": "timestamp"
  }
]
```

#### Get Single Member with Loans
```http
GET /members/:id
```

Response: `200 OK`
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string",
  "created_at": "timestamp",
  "loans": [
    {
      "id": "uuid",
      "book_id": "uuid",
      "book_title": "string",
      "loan_date": "timestamp",
      "due_date": "timestamp",
      "return_date": "timestamp",
      "status": "string"
    }
  ]
}
```

Response: `404 Not Found`
```json
{
  "error": "Member not found"
}
```

#### Add New Member
```http
POST /members
```

Request Body:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string",
  "created_at": "timestamp"
}
```

### Loans

#### Get All Loans
```http
GET /loans
```

Response: `200 OK`
```json
[
  {
    "id": "uuid",
    "book_id": "uuid",
    "member_id": "uuid",
    "book_title": "string",
    "member_name": "string",
    "loan_date": "timestamp",
    "due_date": "timestamp",
    "return_date": "timestamp",
    "status": "string",
    "created_at": "timestamp"
  }
]
```

#### Create New Loan
```http
POST /loans
```

Request Body:
```json
{
  "book_id": "uuid",
  "member_id": "uuid",
  "due_date": "ISO8601 date string"
}
```

Response: `201 Created`
```json
{
  "id": "uuid",
  "book_id": "uuid",
  "member_id": "uuid",
  "loan_date": "timestamp",
  "due_date": "timestamp",
  "status": "active",
  "created_at": "timestamp"
}
```

Response: `400 Bad Request`
```json
{
  "error": "Book not available"
}
```

#### Return a Book
```http
POST /loans/:id/return
```

Response: `200 OK`
```json
{
  "id": "uuid",
  "book_id": "uuid",
  "member_id": "uuid",
  "loan_date": "timestamp",
  "due_date": "timestamp",
  "return_date": "timestamp",
  "status": "returned",
  "created_at": "timestamp"
}
```

Response: `404 Not Found`
```json
{
  "error": "Loan not found"
}
```

## Error Responses

### Validation Error
```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid value",
      "msg": "error message",
      "path": "field name",
      "location": "body"
    }
  ]
}
```

### Server Error
```json
{
  "error": "Something went wrong!"
}
```

## Status Codes

The API returns the following status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Server Error