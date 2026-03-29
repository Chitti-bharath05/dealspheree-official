# Deployment Guide for DealSphere

Follow these steps to take your project from your computer to your live domain **`dealspheree.in`**.

## Step 1: Backend Deployment (API)
Host your Node.js server first so the frontend has a place to send data.

1.  **Select a Host**: Create a free account on [Render.com](https://render.com) or [Railway.app](https://railway.app).
2.  **Connect GitHub**: Connect your GitHub repository to the hosting service.
3.  **Configure Service**:
    -   **Root Directory**: `backend`
    -   **Build Command**: `npm install`
    -   **Start Command**: `node server.js`
4.  **Environment Variables**: Add your `MONGO_URI` and any others from your local `.env`. 
5.  **Get your URL**: Once deployed, you'll get a URL like `https://dealsphere-api.onrender.com`.

## Step 2: Frontend Configuration
Update the app to point to your new live API.

1.  Open `mall-offers-app/src/services/apiClient.js`.
2.  Change `PROD_API_URL` from `'https://YOUR_BACKEND_URL/api'` to your new Render URL.
3.  Save the file.

## Step 3: Frontend Deployment (Web)
Host your user interface on Vercel for the best speed.

1.  **Select a Host**: Create a free account on [Vercel.com](https://vercel.com).
2.  **Connect GitHub**: Select your repository.
3.  **Configure Project**:
    -   **Framework Preset**: Other (or Create React App)
    -   **Root Directory**: `mall-offers-app`
    -   **Build Command**: `npx expo export --platform web`
    -   **Output Directory**: `dist`
4.  **Deploy**: Click "Deploy" and wait for the "Congratulations" screen.

## Step 4: Connecting `dealspheree.in`
The final step to making it official.

1.  In your **Vercel Dashboard**, go to **Settings** > **Domains**.
2.  Type `dealspheree.in` and click **Add**.
3.  Vercel will show you two DNS records (usually an **A record** and a **CNAME**).
4.  Log in to your domain registrar (GoDaddy, etc.) and paste these into the **DNS Management** section.
5.  Wait up to 24 hours (usually 10 minutes) for the world to see your new site!

---

> [!TIP]
> **Need help?** If you get stuck on any of these steps, send me a message and I will help you troubleshoot it! 
