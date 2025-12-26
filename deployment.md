# Deployment Guide: React-Express App to Vercel + Railway

## Overview
This guide walks you through deploying your Next.js client to Vercel and Express server to Railway with PostgreSQL database provisioning for future use.

## Current State

### Client (Next.js)
- **Framework**: Next.js 16.1.1 with React 19.2.3
- **Current Port**: localhost:3000
- **API Connection**: Proxied through Next.js (`/api/*`) to the backend via `BACKEND_URL`

### Server (Express)
- **Framework**: Express 5.2.1
- **Current Port**: localhost:8080
- **CORS**: Only allows `http://localhost:3000`

---

## Step-by-Step Deployment Instructions

### Phase 1: Prepare Server for Railway

#### 1.1 Update server/index.js

**Rationale:** Railway assigns dynamic ports in production, and the client URL will change from localhost to Vercel's domain. Using environment variables makes the server adaptable to different environments without code changes, enabling seamless deployment.

Change the port configuration to use environment variables:

```javascript
require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 8080;

const clientUrlEnv = process.env.CLIENT_URL;
const allowedOrigins =
  clientUrlEnv && clientUrlEnv !== "*"
    ? clientUrlEnv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!clientUrlEnv || clientUrlEnv === "*") return callback(null, true);
      if (allowedOrigins?.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  })
);

app.get('/api/home', (req, res) => {
    res.json({
        message: "Hello World!",
        people: ["Harry", "Jack", "Mary"]
    });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
```

#### 1.2 Create server/.env

**Rationale:** Local development needs different configuration values than production. This file stores development environment variables, allowing you to test the environment-variable-based configuration locally before deploying.

Create a `.env` file in the `server/` directory:

```
PORT=8080
CLIENT_URL=http://localhost:3000
```

#### 1.3 Create server/.env.example

**Rationale:** This template documents what environment variables the server expects without exposing actual values. It helps collaborators set up their own local environment and serves as documentation for production deployment.

Create a `.env.example` file as a template:

```
PORT=8080
CLIENT_URL=http://localhost:3000
DATABASE_URL=
```

#### 1.4 Update server/.gitignore

**Rationale:** Prevents sensitive data (like database credentials and API keys) from being committed to version control. This is critical for security and ensures production secrets remain private.

Create or update `.gitignore` in the `server/` directory to include:

```
node_modules/
.env
```

---

### Phase 2: Deploy Server to Railway

#### 2.1 Initialize Git Repository (if not already done)

**Rationale:** Both Railway and Vercel deploy from Git repositories. Version control enables deployment automation, rollback capabilities, and collaboration. This establishes the foundation for continuous deployment.

```bash
cd /path/to/react-express-app
git init
git add .
git commit -m "Initial commit - prepare for deployment"
```

#### 2.2 Create GitHub Repository

**Rationale:** GitHub acts as the central repository that both Railway and Vercel will pull from. It enables automatic deployments when code is pushed and provides a single source of truth for your codebase.

1. Go to GitHub and create a new repository
2. Push your code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

#### 2.3 Deploy to Railway

**Rationale:** Railway hosts the backend server, providing a production environment with automatic HTTPS, persistent uptime, and scalability. The monorepo structure requires specifying the `server` directory as the root.

1. Go to [railway.app](https://railway.app)
2. Sign up or log in
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. **Important**: Set the root directory to `server`
7. Railway will auto-detect Node.js and deploy

#### 2.4 Add PostgreSQL Database

**Rationale:** Provisions a production-ready PostgreSQL database for future use. Railway automatically injects the `DATABASE_URL` environment variable, making database integration straightforward when needed later.

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will provision the database and set `DATABASE_URL` environment variable automatically

#### 2.5 Configure Environment Variables in Railway

**Rationale:** Configures CORS to temporarily allow all origins during setup, preventing connection errors while the client is being deployed. This will be locked down to the specific Vercel URL once it's available.

1. Go to your server service in Railway
2. Click "Variables"
3. Add:
   - `CLIENT_URL` = `*` (temporary), or set it to a comma-separated allowlist of your Vercel URLs
   - `PORT` is automatically set by Railway

#### 2.6 Get Your Railway URL

**Rationale:** The Railway URL is needed to configure the client's API endpoint. Generating a public domain makes the server accessible over the internet, allowing the Vercel-hosted client to communicate with it.

1. Go to "Settings" in your Railway server service
2. Under "Domains", click "Generate Domain"
3. Save this URL (e.g., `https://your-app.up.railway.app`)

---

### Phase 3: Prepare Client for Vercel

#### 3.1 Update client/pages/index.tsx

**Rationale:** Direct browser calls from Vercel → Railway can hit CORS issues. Proxying `/api/*` through Next.js keeps requests same-origin in the browser and avoids CORS.

Update the client to call the proxied endpoint:

```typescript
import React from 'react'

function index() {
  const [message, setMessage] = React.useState("");
  const [people, setPeople] = React.useState([]);

  React.useEffect(() => {
    fetch(`/api/home`).then(
      response => response.json()
    ).then(
      data => {
        setMessage(data.message);
        setPeople(data.people);
      }
    )
  }, [])

  return (
    <div>
      <div>{message}</div>
      {
        people.map((person, index) => (
          <div key={index}>{person}</div>
        ))
      }
    </div>
  )
}

export default index
```

#### 3.2 Create client/.env.local

**Rationale:** Next.js rewrites run on the server, so use a non-public `BACKEND_URL` for local development.

Create a `.env.local` file in the `client/` directory:

```
BACKEND_URL=http://localhost:8080
```

#### 3.3 Create client/.env.example

**Rationale:** Documents required environment variables for the client without exposing production values. Helps collaborators understand what configuration is needed for local development.

Create a `.env.example` file as a template:

```
BACKEND_URL=http://localhost:8080
```

#### 3.4 Update client/.gitignore

**Rationale:** Prevents committing environment-specific files and build artifacts. Keeps the repository clean and ensures local environment variables and Next.js build outputs don't pollute version control.

Create or update `.gitignore` in the `client/` directory to include:

```
node_modules/
.next/
.env.local
out/
```

#### 3.5 Commit Changes

**Rationale:** Saves all configuration changes to Git so they're available when Vercel and Railway pull from the repository. This ensures both platforms have the updated environment-aware code.

```bash
git add .
git commit -m "Configure environment variables for deployment"
git push
```

---

### Phase 4: Deploy Client to Vercel

#### 4.1 Deploy to Vercel

**Rationale:** Vercel specializes in Next.js hosting with automatic optimizations, edge caching, and global CDN. Setting the root directory to `client` ensures Vercel builds only the frontend portion of the monorepo.

1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in (use GitHub for easier integration)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. **Important Configuration**:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `client`
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)

#### 4.2 Configure Environment Variables in Vercel

**Rationale:** Injects the Railway server URL into the client build, replacing the localhost API endpoint with the production backend. This connects the deployed frontend to the deployed backend.

Before deploying, add environment variables:
- `BACKEND_URL` = your Railway origin, e.g. `https://your-app.up.railway.app`

1. In the project configuration, scroll to "Environment Variables"
2. Add:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: Your Railway URL from Phase 2.6 (e.g., `https://your-app.up.railway.app`)
   - Environment: Production, Preview, Development (select all)

#### 4.3 Deploy

**Rationale:** Initiates the build and deployment process. Vercel builds the Next.js app with the configured environment variables and deploys it globally. The Vercel URL will be used to configure CORS on the server.

1. Click "Deploy"
2. Vercel will build and deploy your app
3. Save your Vercel URL (e.g., `https://your-app.vercel.app`)

---

### Phase 5: Connect the Services

#### 5.1 Update Railway Environment Variables

**Rationale:** Locks down CORS to only accept requests from the specific Vercel domain, enhancing security. This replaces the temporary wildcard configuration with the actual production client URL, completing the secure connection between services.

Now that you have your Vercel URL, update the server's CORS configuration:

1. Go to Railway
2. Navigate to your server service
3. Click "Variables"
4. Update `CLIENT_URL` to your Vercel URL (e.g., `https://your-app.vercel.app`)
5. Railway will automatically redeploy

#### 5.2 Test the Connection

**Rationale:** Verifies end-to-end functionality of the deployed application. This confirms that the client can successfully communicate with the server, CORS is configured correctly, and all environment variables are working as expected.

1. Visit your Vercel URL
2. The page should load and display the data from your Railway server
3. Check Railway logs to verify incoming requests
4. Check Vercel logs for any errors

---

### Phase 6: Database Setup (For Future Use)

Your PostgreSQL database is already provisioned on Railway from Phase 2.4.

#### 6.1 Access Database Connection String

**Rationale:** Retrieves the credentials needed to connect your application to the database. The `DATABASE_URL` is automatically available to your server, ready for when you add database functionality.

1. In Railway, click on your PostgreSQL database
2. Go to "Variables" tab
3. Find `DATABASE_URL` - this is your connection string

#### 6.2 Future Integration

**Rationale:** Provides a roadmap for adding database functionality. Having the database pre-provisioned means you can start persisting data without additional infrastructure setup when your application needs it.

When you're ready to use the database:

1. Install a PostgreSQL client library:
   ```bash
   cd server
   npm install pg
   # OR for an ORM
   npm install prisma
   ```

2. Use the connection string in your code:
   ```javascript
   const { Pool } = require('pg');
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: {
       rejectUnauthorized: false
     }
   });
   ```

---

## Final Results

After completing all phases:

- **Client URL**: `https://your-app.vercel.app`
- **Server URL**: `https://your-app.up.railway.app`
- **Database**: PostgreSQL on Railway (ready for use)
- **Communication**: Both services communicate securely via HTTPS
- **Local Development**: Still works with localhost configuration

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Verify `CLIENT_URL` in Railway matches your exact Vercel URL
2. Make sure there's no trailing slash
3. Check Railway logs for blocked requests

### Environment Variables Not Loading

**Vercel:**
- Make sure variables are prefixed with `NEXT_PUBLIC_`
- Redeploy after adding environment variables

**Railway:**
- Variables are automatically available
- Check the Variables tab to confirm they're set

### Build Failures

**Vercel:**
- Check build logs in Vercel dashboard
- Verify root directory is set to `client`
- Ensure all dependencies are in package.json

**Railway:**
- Check deploy logs in Railway dashboard
- Verify root directory is set to `server`
- Ensure start script exists in package.json

---

## Post-Deployment Best Practices

### 1. Monitor Logs

- **Vercel**: Dashboard → Your Project → Deployments → Logs
- **Railway**: Dashboard → Your Service → Deployments → Logs

### 2. Performance

- Both platforms auto-scale
- Railway: Consider upgrading plan to avoid cold starts
- Vercel: Edge caching is automatic

### 3. Security

- Never commit `.env` files
- Rotate database credentials regularly
- Consider adding authentication before going to production
- Review CORS settings for production

### 4. Continuous Deployment

- Both Vercel and Railway support automatic deployments
- Push to GitHub → Automatically deploys to both platforms
- Use different branches for staging/production if needed

---

## Environment Variables Reference

### Client (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Server (.env)
```
PORT=8080
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Vercel Environment Variables
- `NEXT_PUBLIC_API_URL` = Railway server URL

### Railway Environment Variables
- `PORT` = Auto-set by Railway
- `CLIENT_URL` = Vercel client URL
- `DATABASE_URL` = Auto-set when PostgreSQL is added

---

## Quick Reference Commands

### Local Development

```bash
# Start server
cd server
npm run dev

# Start client
cd client
npm run dev
```

### Deploy Updates

```bash
# Commit and push changes
git add .
git commit -m "Your update message"
git push

# Both Vercel and Railway will auto-deploy
```

---

## Support Links

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com)
