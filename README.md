# United Alliances Sales CRM

A robust, internal Sales CRM tailored for the Ahmedabad Sales Team. This platform offers dedicated dashboards for different roles (Admin, SDR, LeadGen, HR), lead tracking, call logging, and pipeline management.

## 🚀 Setup Instructions

This project is built using:
- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript, Mongoose
- **Database**: MongoDB

### 1. Prerequisites
- Node.js (v18+)
- Local MongoDB running on port 27017, or a MongoDB Atlas URI.

### 2. Installation
Clone the repository and install dependencies:
```sh
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following variables:

```env
# Server Configuration
PORT=3000
INTERNAL_PORT=3001
NODE_ENV=development
APP_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/insurelead

# Security
JWT_SECRET=super_secret_jwt_key
JWT_REFRESH_SECRET=super_secret_refresh_key

# Email
RESEND_API_KEY=your_resend_api_key
SMTP_FROM=noreply@ualliances.com
```

### 4. Database Seeding
To populate the database with realistic test data (including Indian/Ahmedabad personas and companies), run:
```sh
npm run seed
```

### 5. Running the Application
Start the development server using:
```sh
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend will start on the configured `INTERNAL_PORT` (e.g., `3001`).

---

## 👥 Adding a New Sales Rep via Terminal

Since this is a local setup, you can add new users (Sales Reps) directly via terminal.

1. Ensure the database is running and you have `ts-node` or `tsx` available to execute scripts against the DB.
2. An admin can create an account directly in MongoDB, for example using the node REPL or a quick script:

Create a file named `addUser.ts`:
```typescript
import mongoose from 'mongoose';
import User from './server/models/User';
import { env } from './server/config/env';

async function addUser() {
  await mongoose.connect(env.MONGODB_URI);
  
  await User.create({
    name: 'New Sales Rep',
    email: 'newrep@ualliances.com',
    password: 'Password123!', // Password will be hashed automatically by the model pre-save hook
    role: 'sdr',
    avatar: 'NR',
    leadsAssigned: 0,
    callsMade: 0,
    followUpsCompleted: 0,
    followUpsPending: 0,
    conversionRate: 0,
    revenueClosed: 0
  });

  console.log('User created successfully');
  process.exit(0);
}

addUser();
```

Then run it:
```sh
npx tsx addUser.ts
```

Alternatively, `Admin` users can manage the sales team via the Admin Dashboard.

## 🔐 Role-Based Access
- **Admin**: Full access. View analytics, manage all users, assign leads.
- **SDR (Sales Development Rep)**: Manages their pipeline, tracks calls, registers activities and conversions.
- **LeadGen**: Add and qualify leads. Pass qualified leads to the SDR team.
- **HR**: Track employee performance and internal sales tracking.
