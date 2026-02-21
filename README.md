# Neon-Pong

Local development and deployment instructions

Local run

- Copy `.env.example` to `.env` and fill `JWT_SECRET` (and `MONGO_URI` if using Atlas).
- Install dependencies: `npm install`
- Start server: `node server.js` (or `npm start`)
- Open http://localhost:3000/ in your browser. Use `/register.html` and `/login.html` to create accounts.

Notes about MongoDB Atlas

- If you want to use MongoDB Atlas instead of the local fallback, set `MONGO_URI` to your Atlas connection string in Render or `.env`.
- Make sure to whitelist Render's IPs or temporarily allow access from anywhere (0.0.0.0/0) in Atlas Network Access.

Render deployment

1. Connect your GitHub repository in Render and create a new Web Service.
2. Use the default `npm install` build command and `node server.js` start command. A `render.yaml` is included in the repo.
3. In the Render dashboard, add the following environment variables:
   - `MONGO_URI` — your Atlas connection string
   - `JWT_SECRET` — a strong random secret (used to sign JWTs)
   - `PORT` — optional (Render sets this automatically)
4. Deploy and wait for the service to start. Check logs for DB connection success.

Local fallback

- The server includes a local JSON fallback at `data/local_users.json` which is used when MongoDB is unreachable. This allows registration/login to work locally without Atlas.

Creating test accounts

- You can create test accounts via the UI (`/register.html`) or using the `/register` endpoint.

Security

- Keep `JWT_SECRET` secret and never commit real credentials.

Contact

- For deployment help, provide Atlas access or set the required environment variables in Render and I can continue.
