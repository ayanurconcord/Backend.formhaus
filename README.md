# FORMHAUS Backend

A dynamic API and admin CMS for the FORMHAUS.STUDIO website.

## Stack
- Express.js
- JWT Authentication
- Multer uploads
- JSON file-based datastore for local development

## Local setup

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:4000`.

## Environment

Create or edit `.env`:

```env
PORT=4000
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:3000
```

## Local development admin account

A fresh local JSON datastore seeds a convenience admin account:

- Email: `admin@formhaus.studio`
- Password: `admin123`

**Local development only.** Do not use these credentials in production. Production deployments must use a strong, unique `JWT_SECRET`, and the default JSON datastore is not durable on serverless hosting. A persistent database and production admin provisioning flow are still required before relying on the CMS in production.

## Admin dashboard

Open:

`http://localhost:4000/admin`

## Core endpoints

Public:
- `GET /api/health`
- `GET /api/site`

Authentication:
- `POST /api/auth/login`

Admin protected routes:
- `GET /api/admin/dashboard`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`
- `GET /api/admin/navigation`
- `POST /api/admin/navigation`
- `GET /api/admin/services`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `DELETE /api/admin/services/:id`
- `GET /api/admin/projects`
- `POST /api/admin/projects`
- `PUT /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id`
- `GET /api/admin/homepage`
- `PUT /api/admin/homepage`
- `GET /api/admin/media`
- `POST /api/admin/media/upload`
- `GET /api/admin/about`
- `PUT /api/admin/about`

## Deployment

- Host this app on a separate backend domain like `api.formhaus.studio`.
- Set `NEXT_PUBLIC_API_URL` on the frontend to the production backend origin.
