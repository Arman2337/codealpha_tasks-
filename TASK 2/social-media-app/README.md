# Social Media Platform

A full-stack social media application built with Express.js, MongoDB, and vanilla JavaScript.

## Features

- User Authentication (Sign up, Login, Logout)
- User Profiles
- Create, Read, Delete Posts
- Like/Unlike Posts
- Comment on Posts
- Follow/Unfollow Users
- Image Upload
- Real-time Feed

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT Authentication
- Multer (for file uploads)
- bcryptjs (for password hashing)

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API for HTTP requests

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/social-media-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

4. Create an `uploads` directory in the backend folder:
   ```bash
   mkdir uploads
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

6. Open the frontend/index.html file in your browser or serve it using a local server.

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user
- POST /api/auth/logout - Logout user

### Users
- GET /api/users/:username - Get user profile
- PATCH /api/users/profile - Update user profile
- POST /api/users/follow/:userId - Follow a user
- POST /api/users/unfollow/:userId - Unfollow a user
- GET /api/users/:userId/followers - Get user's followers
- GET /api/users/:userId/following - Get user's following

### Posts
- POST /api/posts - Create a new post
- GET /api/posts/feed - Get feed posts
- GET /api/posts/user/:userId - Get user's posts
- GET /api/posts/:postId - Get a single post
- DELETE /api/posts/:postId - Delete a post
- POST /api/posts/:postId/like - Like/Unlike a post
- POST /api/posts/:postId/comments - Add a comment
- DELETE /api/posts/:postId/comments/:commentId - Delete a comment

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Protected routes
- Input validation
- File upload restrictions
- Error handling middleware

## Development

The backend server runs on port 5000 by default. The frontend can be served using any static file server.

To start development:
1. Start MongoDB service
2. Run `npm run dev` in the backend directory
3. Open frontend/index.html in your browser

## Production Deployment

For production deployment:
1. Set NODE_ENV to 'production'
2. Use a strong JWT_SECRET
3. Configure proper MongoDB connection string
4. Set up proper CORS settings
5. Use environment variables for sensitive data
6. Implement rate limiting
7. Set up proper logging
8. Use HTTPS
9. Configure proper file upload storage (e.g., AWS S3) 