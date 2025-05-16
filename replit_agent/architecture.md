# Architecture Overview

## Overview

This project is a healthcare platform application that provides heart disease prediction capabilities, doctor-patient communication, and health metrics tracking. The system is built as a full-stack web application with a React frontend and Node.js (Express) backend, using PostgreSQL (via Neon Database) for data storage.

The application follows a modern web architecture with a client-server model, where the frontend is built using React and communicates with the backend via RESTful APIs. The application includes features for user authentication, role-based access control (doctors vs. patients), file uploads for medical data, heart disease prediction using a simple machine learning model, and real-time chat between doctors and patients.

## System Architecture

### High-Level Architecture

The system follows a standard three-tier architecture:

1. **Presentation Layer** - React-based SPA (Single Page Application)
2. **Application Layer** - Express.js server with RESTful APIs
3. **Data Layer** - PostgreSQL database (Neon Serverless)

```
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│               │         │               │         │               │
│  React SPA    │ ◄─────► │  Express.js   │ ◄─────► │  PostgreSQL   │
│  (Frontend)   │   HTTP  │  (Backend)    │   SQL   │  (Database)   │
│               │         │               │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
```

### Frontend Architecture

The frontend is built with:
- React for UI components and state management
- React Router (wouter) for client-side routing
- TanStack Query (React Query) for data fetching and caching
- Tailwind CSS with shadcn/ui components for styling
- React Hook Form with Zod for form validation

The frontend code is organized into:
- `/client/src/pages` - Page components for different routes
- `/client/src/components` - Reusable UI components
- `/client/src/lib` - Utility functions and services
- `/client/src/hooks` - Custom React hooks
- `/client/src/context` - React context providers

### Backend Architecture

The backend is built with:
- Express.js as the web framework
- WebSocket for real-time chat functionality
- Drizzle ORM for database operations
- express-session for session management

The backend code is organized into:
- `/server/index.ts` - Entry point and server setup
- `/server/routes.ts` - API route definitions
- `/server/storage.ts` - Database interface
- `/server/db-storage.ts` - Database implementation
- `/server/ml/heart_disease_model.ts` - Simple ML model for heart disease prediction

### Database Schema

The database uses PostgreSQL and is managed via Drizzle ORM. The schema is defined in `/shared/schema.ts` and includes the following main entities:

1. **Users** - Stores user information with role-based differentiation (doctor/patient)
2. **Medical Files** - Stores uploaded medical data files
3. **Predictions** - Stores heart disease prediction results
4. **Messages** - Stores chat messages between users
5. **Conversations** - Manages chat conversations between doctors and patients
6. **Health Metrics** - Stores patient health metrics

## Key Components

### Authentication System

- Uses session-based authentication with express-session
- Session data stored in memory (MemoryStore in development)
- Login/logout/register functionality implemented in AuthContext on the frontend
- User roles (doctor/patient) determine access control

### File Upload and Processing

- Allows uploading CSV files with health data
- Files are stored in the database as base64-encoded strings
- Uploaded files are processed for heart disease prediction

### Heart Disease Prediction

- Simple k-nearest neighbors implementation in `/server/ml/heart_disease_model.ts`
- Processes uploaded CSV files or manual input data
- Returns prediction results with confidence score and explanation

### Real-time Chat

- WebSocket implementation for real-time messaging
- Separate conversations between doctors and patients
- Message status tracking (sent/delivered/read)

### UI Component Library

- Uses shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with a consistent design system
- Dark mode support

## Data Flow

### Authentication Flow

1. User submits login credentials via the login form
2. Server validates credentials and creates a session
3. Session ID is stored in a cookie on the client
4. Subsequent requests include the cookie for authentication
5. Protected routes check for valid session before responding

### File Upload and Prediction Flow

1. User uploads a CSV file or enters health data manually
2. Data is sent to the server via API call
3. Server processes the data using the prediction model
4. Prediction results are stored in the database
5. Results are returned to the client and displayed

### Messaging Flow

1. User selects a conversation or creates a new one
2. Client establishes WebSocket connection with the server
3. Messages are sent via WebSocket for real-time delivery
4. Messages are stored in the database for persistence
5. Message status is updated as messages are delivered/read

## External Dependencies

### Frontend Dependencies

- **@radix-ui/***: UI primitives for building accessible components
- **@tanstack/react-query**: Data fetching and state management
- **react-hook-form** & **zod**: Form handling and validation
- **recharts**: Data visualization library for charts
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Component library based on Tailwind and Radix UI

### Backend Dependencies

- **express**: Web framework for Node.js
- **drizzle-orm**: TypeScript ORM for database operations
- **@neondatabase/serverless**: PostgreSQL driver for Neon serverless database
- **ws**: WebSocket implementation for real-time features
- **express-session**: Session management middleware

## Deployment Strategy

The application is configured for deployment on Replit, as indicated by the `.replit` configuration file. The deployment strategy includes:

1. **Build Process**:
   - Frontend: Vite builds the React application into static assets
   - Backend: esbuild bundles the server code
   - Combined into a single distribution package

2. **Runtime Environment**:
   - Node.js 20 as the runtime environment
   - PostgreSQL 16 for database

3. **Deployment Target**:
   - Google Cloud Engine (GCE) via Replit deployment

4. **Environment Variables**:
   - `DATABASE_URL`: Connection string for PostgreSQL database
   - `NODE_ENV`: Environment indicator (development/production)

5. **Startup Commands**:
   - Development: `npm run dev` - Uses tsx for TypeScript execution
   - Production: `npm run start` - Runs the bundled code

## Security Considerations

1. **Authentication**: Session-based with secure cookies
2. **Data Validation**: All input validated using Zod schemas
3. **Database Security**: Using parameterized queries via Drizzle ORM
4. **Role-based Access Control**: Different permissions for doctors and patients

## Future Expansion Considerations

The architecture supports potential future enhancements:

1. **Improved ML Model**: The current simple KNN model could be replaced with more sophisticated models
2. **Offline Support**: Could be enhanced with service workers for offline functionality
3. **Mobile App**: The component-based architecture would support React Native conversion
4. **Advanced Analytics**: The data schema supports expanding health metrics tracking and analysis