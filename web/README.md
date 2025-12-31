# Process Tracker Web Frontend

Next.js frontend application for tracking job application processes and stages.

## Features

- **Authentication**: Email/password login and registration
- **Process Management**: Create, view, edit, and delete job application processes
- **Stage Tracking**: Add, edit, and delete stages for each process
- **Timeline Visualization**: Visual timeline view of process stages
- **Sharing**: Public sharing of processes via shareable links
- **Dashboard**: Overview of all processes with statistics

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- FastAPI backend running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
web/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── processes/         # Process pages
│   └── share/             # Public share pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── processes/        # Process-related components
│   ├── stages/           # Stage-related components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API client
└── types/                # TypeScript type definitions
```

## Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **TailwindCSS**: Styling
- **React Query**: Server state management
- **Axios**: HTTP client
- **Lucide React**: Icons

## API Integration

The frontend communicates with the FastAPI backend at `NEXT_PUBLIC_API_URL`. All API calls are handled through the `lib/api.ts` client.

## Building for Production

```bash
npm run build
npm start
```

