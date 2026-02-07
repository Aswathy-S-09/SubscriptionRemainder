# Subscribely - Subscription Management App

A full-stack subscription management application built with React, Node.js, Express, and MongoDB.

## Features

- **Secure Authentication**: JWT-based login/signup with password hashing
- **Google OAuth**: Sign in with Google accounts
- **Subscription Management**: Add, edit, delete, and track subscriptions
- **Dashboard**: View subscription statistics and upcoming renewals
- **Professional Landing Page**: About, Services, and Contact sections
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18
- Lucide React (icons)
- CSS3 with custom styling
- Google Identity Services

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS and security middleware

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd full-stack
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/subscribely
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

Start the backend server:
   ```bash
npm run dev
   ```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

   ```bash
cd .. # Go back to root directory
   npm install
   ```

Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Start the frontend development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000` to authorized JavaScript origins
6. Copy the Client ID to your `.env` file

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Subscriptions
- `GET /api/subscriptions` - Get user subscriptions
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `GET /api/subscriptions/stats` - Get subscription statistics

## Database Schema

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  provider: String (local/google),
  googleId: String,
  isActive: Boolean,
  lastLogin: Date
}
```

### Subscription Model
```javascript
{
  user: ObjectId (ref: User),
  serviceName: String,
  plan: String,
  planDuration: Number,
  price: Number,
  totalAmount: Number,
  renewalDate: Date,
  serviceLogo: String,
  serviceColor: String,
  serviceUrl: String,
  isActive: Boolean,
  status: String (active/expired/cancelled)
}
```

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Input validation and sanitization
- Helmet.js security headers

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use MongoDB Atlas for database
3. Set strong JWT_SECRET
4. Configure CORS for your domain
5. Deploy to Heroku, Vercel, or AWS

### Frontend
1. Set `REACT_APP_API_URL` to your production API
2. Update Google OAuth settings for production domain
3. Build and deploy to Netlify, Vercel, or AWS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@subscribely.app or create an issue in the repository.