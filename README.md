# Folklore & Character Archive

A full-stack web application for cataloguing folklore figures, mythological characters, and their associated origins. Built with React (Vite) on the frontend and Node.js/Express with PostgreSQL on the backend.

**Author:** Jake Vaccaro ([NaverJJV](https://github.com/NaverJJV))

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the App](#running-the-app)
- [Using the App](#using-the-app)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)

---

## Features

- Browse a grid of folklore and mythological characters
- Add new characters with a collapsible form
- Edit and delete existing characters
- Search characters by name or alias
- Sort characters by name, alias, or origin
- Manage an Origins Library — view, edit, and delete historical eras and settings
- Error banners for blocked actions (e.g. deleting an origin that still has characters assigned)

---

## Tech Stack

**Frontend**
- React 19 (Vite)
- React Router v7
- Plain CSS (component-scoped files)

**Backend**
- Node.js with Express 5
- PostgreSQL (via `pg`)
- `dotenv` for environment config
- `nodemon` for dev hot-reloading

**Tooling**
- `concurrently` for running frontend and backend together from the root

---

## Project Structure

```
FolkloreCharacterArchive/
├── folklore-archive-backend/
│   ├── server.js          # Express server & all API routes
│   ├── seed.js            # Database seed script
│   ├── package.json
│   └── .env               # (you create this — see setup below)
│
├── folklore-archive-frontend/
│   └── src/
│       ├── App.jsx / App.css
│       ├── AddCharacterForm.jsx / .css
│       ├── CharacterCard.jsx / .css
│       ├── OriginsManager.jsx / .css
│       ├── OriginRow.jsx / .css
│       └── main.jsx / index.css
│
└── package.json           # Root-level scripts using concurrently
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [PostgreSQL](https://www.postgresql.org/) (running locally or via a hosted service)
- npm

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/NaverJJV/FolkloreCharacterArchive.git
cd FolkloreCharacterArchive
```

### 2. Install all dependencies

Install root-level tools (concurrently):
```bash
npm install
```

Install backend dependencies:
```bash
cd folklore-archive-backend
npm install
cd ..
```

Install frontend dependencies:
```bash
cd folklore-archive-frontend
npm install
cd ..
```

### 3. Configure the backend environment

Create a `.env` file inside `folklore-archive-backend/`:

```bash
touch folklore-archive-backend/.env
```

Add the following, filling in your PostgreSQL credentials:

```env
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=FolkloreCharacterArchiveDB
DB_PASSWORD=your_postgres_password
DB_PORT=5432
PORT=3000
```

### 4. Create the database

In your PostgreSQL client (e.g. psql or pgAdmin), create the database:

```sql
CREATE DATABASE "FolkloreCharacterArchiveDB";
```

### 5. Seed the database

From the `folklore-archive-backend/` directory, run the seed script to create tables and insert sample data:

```bash
cd folklore-archive-backend
npm run seed
```

This will:
- Drop any existing tables
- Create `origins`, `characters`, `stories`, and `character_stories` tables
- Insert three sample origins and three sample characters

---

## Running the App

From the **root directory**, run both servers simultaneously:

```bash
npm run dev
```

This uses `concurrently` to start:
- **Backend** at `http://localhost:3000`
- **Frontend** at `http://localhost:5173` (or the next available port)

To run them separately:

```bash
# Backend only
npm run start:backend

# Frontend only
npm run start:frontend
```

---

## Using the App

### Character Archive (Home `/`)

- **Add a character** — click the `+ Add New Figure` bar to expand the form. Fill in the name, alias, origin, and core traits, then click **Save to Archive**. The form auto-collapses on success.
- **Search** — type into the search bar to filter by name or alias in real time.
- **Sort** — use the Sort By dropdown and the A-Z / Z-A toggle to reorder the grid.
- **View details** — click **Show Details** on any card to expand origin and core traits.
- **Edit a character** — click **Edit** to enter inline edit mode directly on the card.
- **Delete a character** — click **Delete** and confirm the prompt.

### Origins Library (`/origins`)

- Accessible via the **Manage Origins Library** nav link on the home page.
- Lists all origins with their historical era and description.
- **Edit** an origin's name, era, and description inline.
- **Delete** an origin — blocked with an error banner if any characters are still assigned to it.
- Use the **← Back to Character Archive** link to return home.

---

## API Reference

All endpoints are served from `http://localhost:3000`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/characters` | Get all characters (basic) |
| GET | `/api/characters-detailed` | Get all characters with origin name joined |
| POST | `/api/characters` | Add a new character |
| PUT | `/api/characters/:id` | Update an existing character |
| DELETE | `/api/characters/:id` | Delete a character |
| GET | `/api/origins` | Get all origins (alphabetical) |
| PUT | `/api/origins/:id` | Update an origin |
| DELETE | `/api/origins/:id` | Delete an origin (blocked if characters assigned) |

**POST / PUT `/api/characters` — Request Body:**
```json
{
  "name": "John Henry",
  "alias": "The Steel-Driving Man",
  "description": "Strength, determination",
  "origin_name": "Post-Civil War America"
}
```
> If the `origin_name` doesn't match an existing origin, a new one is automatically created.

---

## Database Schema

```sql
origins (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  historical_era  VARCHAR(255),
  description     TEXT
)

characters (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  alias       VARCHAR(255),
  description TEXT,
  origin_id   INTEGER REFERENCES origins(id) ON DELETE SET NULL
)

stories (
  id                SERIAL PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  synopsis          TEXT,
  publication_date  DATE
)

character_stories (
  character_id  INTEGER REFERENCES characters(id) ON DELETE CASCADE,
  story_id      INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  role          VARCHAR(100),
  PRIMARY KEY (character_id, story_id)
)
```
