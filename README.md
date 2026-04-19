# SmartSeason Backend API

## Overview

The backend for the **SmartSeason Field Monitoring System** – a farm management application that helps track crop progress across multiple fields during a growing season.  
Built with **Node.js**, **Express**, **TypeScript**, **TypeORM** and **PostgreSQL** (Supabase).  

It provides a RESTful API with JWT authentication (httpOnly cookie), role‑based access control (Admin / Agent), and real‑time notifications.

---

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript (with OOP architecture)
- **Framework**: Express
- **ORM**: TypeORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT (httpOnly cookie)
- **Email**: Brevo (formerly Sendinblue)
- **Validation**: class-validator
- **Hashing**: bcryptjs

---

## Project Structure
src/
├── config/ # TypeORM DataSource, environment config
├── entities/ # TypeORM models (User, Role, Field, FieldUpdate, Notification)
├── dtos/ # Data Transfer Objects with validation rules
├── services/ # Business logic (Auth, User, Field, Notification, Dashboard)
├── controllers/ # Request handlers
├── routes/ # API route definitions
├── middlewares/ # Auth, role guard, error handler
├── exceptions/ # Custom error classes
├── utils/ # Helpers (password generator, status calculator, seed)
└── migrations/ # TypeORM migration files


---

## Key Features

### Users & Roles
- Two roles: **Admin** (coordinator) and **Agent** (field agent).
- Admin can create agent accounts; a temporary password is generated and sent by email.
- JWT stored in an **httpOnly cookie** for security.

### Field Management
- Admin can **create**, **edit**, **delete** fields.
- Each field stores: name, crop type, planting date, current stage, and an auto‑generated unique tag (e.g. `FLD-1704067200-4832`).
- Admin can **assign** a field to an agent.

### Field Updates
- Agents (and admins) can **update the stage** (Planted → Growing → Ready → Harvested) and add optional notes.
- Backend validates forward transitions only – no skipping stages.
- Each update is recorded with timestamp and user.

### Status Logic
The field status is **computed on the fly** (not stored) based on:
- `Active` – normal progress, within expected timeframe.
- `At Risk` – more than 30 days since planting without reaching `Ready` or `Harvested`, **or** no update in the last 14 days.
- `Completed` – stage is `Harvested`.

### Dashboards
- **Admin dashboard**: total fields, status breakdown, recent updates, fields per agent.
- **Agent dashboard**: total assigned fields, status breakdown, pending actions (fields needing an update).

### Notifications
- Real‑time notifications when a field stage changes:
  - Agent’s update → all admins are notified.
  - Admin’s update → the assigned agent (if any) is notified.
- Admin can also send **broadcast notifications** to selected users (excluding themselves).

### Authentication & Security
- Passwords hashed with bcrypt.
- Routes protected by authentication and role middleware.
- httpOnly cookie prevents XSS token theft.
- Input validation via class-validator.

---

## API Endpoints

All endpoints are prefixed with `/api/smartseason`

### Auth
| Method | Endpoint            | Description                    | Access      |
|--------|---------------------|--------------------------------|-------------|
| POST   | `/auth/login`       | Login, returns httpOnly cookie | Public      |
| POST   | `/auth/logout`      | Clears cookie                  | Authenticated|
| POST   | `/auth/change-password` | Change own password          | Authenticated|
| GET    | `/auth/me`          | Get current user profile       | Authenticated|

### Users
| Method | Endpoint               | Description                         | Access      |
|--------|------------------------|-------------------------------------|-------------|
| GET    | `/users`               | List all users                      | Admin only  |
| GET    | `/users/:id`           | Get user details (with fields, activity) | Admin or self |
| POST   | `/users`               | Create a new user (agent)           | Admin only  |
| PUT    | `/users/:id`           | Update user                         | Admin only  |
| DELETE | `/users/:id`           | Delete user                         | Admin only  |

### Fields
| Method | Endpoint                    | Description                         | Access                      |
|--------|-----------------------------|-------------------------------------|-----------------------------|
| GET    | `/fields`                   | List fields (all for admin, assigned for agent) | Authenticated |
| GET    | `/fields/:id`               | Get field details (with status and updates) | Admin or assigned agent |
| POST   | `/fields`                   | Create a field                      | Admin only  |
| PUT    | `/fields/:id`               | Update field metadata               | Admin only  |
| POST   | `/fields/:id/assign`        | Assign agent to field               | Admin only  |
| DELETE | `/fields/:id`               | Delete field                        | Admin only  |
| POST   | `/fields/:id/updates`       | Add a stage update (with notes)     | Admin or assigned agent |

### Dashboard
| Method | Endpoint       | Description                     | Access      |
|--------|----------------|---------------------------------|-------------|
| GET    | `/dashboard`   | Role‑specific dashboard data    | Authenticated|

### Notifications
| Method | Endpoint                    | Description                         | Access      |
|--------|-----------------------------|-------------------------------------|-------------|
| GET    | `/notifications`            | Get my notifications                | Authenticated|
| PATCH  | `/notifications/:id/read`   | Mark one as read                    | Authenticated|
| PATCH  | `/notifications/read-all`   | Mark all as read                    | Authenticated|
| DELETE | `/notifications/:id`        | Delete a notification               | Authenticated|
| POST   | `/notifications/send`       | Send broadcast (admin only)         | Admin only  |

---

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd smartseason-backend
2. Install dependencies
    npm install
3. Load based on the .env.example
4. Run migrations(If any)
5. Seed roles
6. Start the server
npm run dev         # development (nodemon)
npm run build       # compile TypeScript
npm start           # production

## Design Decisions & Assumptions
Stateless authentication – JWT in httpOnly cookie for security and simplicity.

Status is computed, not stored – allows flexible logic changes without data migration.

Stage transitions – only forward moves allowed; business rule enforced in service.

Email service – Brevo (free tier) used for sending temporary passwords; assumes API key is provided.

Password generation – simple generator  – can be adjusted.

Risk thresholds – 30 days without reaching Ready/Harvested or 14 days without update. These are configurable in the code.

## Assumptions Made
The backend runs behind a reverse proxy that handles HTTPS; secure cookie flag is set only in production.

Only one default admin is seeded; additional admins can be created by the first admin.

Agents cannot create or delete fields; they can only update assigned fields.

Notifications are not real‑time (polling); frontend fetches on refresh or bell click.

Field updates are only stage changes; other updates (e.g., notes alone) are not supported separately – notes are attached to stage changes.

## Troubleshooting
404 on logout – ensure route is POST /auth/logout (not GET).
Check also the error or status code returned by the server. (Used exceptions so you will get a message based on exceptions!)
