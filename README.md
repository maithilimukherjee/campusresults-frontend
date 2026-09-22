# CampusResults Frontend

A React + Vite web portal for managing academic results and fee payments, with role-based access for Students, Teachers, and Admins.

## Backend Repository 
https://github.com/maithilimukherjee/campus-results-portal.git

## Tech Stack

- **React 19** with React Router v7
- **Vite 8** for bundling and dev server
- **Firebase** for authentication (JWT-based)
- **Axios** for API communication

## Project Structure

```
src/
├── api/            # Axios client with Firebase JWT interceptor
├── components/     # Shared components (Navbar, ProtectedRoute)
├── config/         # Firebase initialization
├── context/        # AuthContext (currentUser, userRole)
└── pages/
    ├── Auth/       # Login, Register
    ├── Student/    # Results viewer, reevaluation, fee payment
    ├── Teacher/    # Teacher dashboard
    └── Admin/      # Admin dashboard
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=https://campus-results-portal.onrender.com
VITE_FIREBASE_API_KEY=<your_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<your_auth_domain>
VITE_FIREBASE_PROJECT_ID=<your_project_id>
```

### 3. Run the dev server

```bash
npm run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Role-Based Routing

| Role | Route |
|------|-------|
| `admin` | `/admin` |
| `teacher` | `/teacher` |
| `student` | `/student` |

Unauthenticated users are redirected to `/login`. Role is resolved from Firebase via `AuthContext`.

## Authentication

All API requests automatically attach a fresh Firebase JWT via an Axios request interceptor (`src/api/axiosClient.js`).
