# 🚀 Deployment Guide - Multi-Tenant SaaS Notes Application

This guide will walk you through deploying your Multi-Tenant SaaS Notes Application to Vercel.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- Node.js 18+ installed locally (for testing)

## 🏗️ Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Create a new GitHub repository**
2. **Upload these files to your repository**:
   ```
   ├── api/
   │   └── index.js          # Backend API
   ├── public/
   │   └── index.html        # Frontend
   ├── package.json          # Dependencies
   ├── vercel.json          # Deployment config
   ├── README.md            # Documentation
   ├── .env.example         # Environment template
   └── test-endpoints.js    # Testing script
   ```

3. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit: Multi-tenant SaaS Notes App"
   git push origin main
   ```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "New Project"**

3. **Import your GitHub repository**

4. **Configure the deployment**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: Leave empty or use `npm run build`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add: `JWT_SECRET` = `your-super-secret-jwt-key-change-in-production-12345`
   - Click "Add"

6. **Click "Deploy"**

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project? `N`
   - What's your project's name? `saas-notes-app`
   - In which directory is your code located? `./`

5. **Set environment variables**:
   ```bash
   vercel env add JWT_SECRET
   # Enter: your-super-secret-jwt-key-change-in-production-12345
   # Select: Production
   ```

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Step 3: Verify Deployment

1. **Check the health endpoint**:
   ```bash
   curl https://your-app-name.vercel.app/health
   ```
   
   Expected response: `{"status":"ok"}`

2. **Test the frontend**:
   - Open your Vercel URL in a browser
   - You should see the SaaS Notes login page

3. **Test authentication**:
   - Select "admin@acme.test" from the dropdown
   - Password is: `password`
   - Click Login - you should see the dashboard

### Step 4: Run Comprehensive Tests

Use the provided testing script to validate all functionality:

1. **Run the test script**:
   ```bash
   node test-endpoints.js https://your-app-name.vercel.app
   ```

2. **Verify all tests pass**:
   ```
   ✅ Health endpoint working
   ✅ Authentication with all test accounts
   ✅ Tenant isolation enforced
   ✅ Role-based access control
   ✅ Subscription limits and upgrades
   ✅ Complete CRUD operations
   ✅ CORS headers configured
   ✅ Error handling implemented
   ✅ Frontend accessible
   ```

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `JWT_SECRET` | Secret key for JWT token signing | Yes | `your-super-secret-jwt-key-12345` |
| `NODE_ENV` | Node environment | No | `production` |

### Vercel Configuration

The `vercel.json` file is pre-configured with:
- **Serverless functions** for the API
- **Static file serving** for the frontend
- **Proper routing** between API and frontend
- **Environment variable injection**

### CORS Configuration

CORS is enabled for all origins to allow:
- Dashboard access from any domain
- Automated testing scripts
- Cross-origin API requests

## 🧪 Testing Your Deployment

### Manual Testing

1. **Test all user accounts**:
   - `admin@acme.test` (Admin, Acme)
   - `user@acme.test` (Member, Acme)
   - `admin@globex.test` (Admin, Globex)
   - `user@globex.test` (Member, Globex)
   - Password for all: `password`

2. **Test tenant isolation**:
   - Create notes as Acme user
   - Login as Globex user
   - Verify Acme notes are not visible

3. **Test subscription limits**:
   - Create 3 notes on Free plan
   - Try creating 4th note (should fail)
   - Upgrade to Pro (Admin only)
   - Create unlimited notes

### Automated Testing

The provided test script (`test-endpoints.js`) will validate:
- All API endpoints
- Authentication flows
- Tenant isolation
- Role-based access
- Subscription management
- CRUD operations
- Error handling

## 🐛 Troubleshooting

### Common Issues

1. **500 Internal Server Error**:
   - Check environment variables are set
   - View Vercel function logs
   - Ensure JWT_SECRET is configured

2. **CORS Errors**:
   - Verify CORS is enabled in the backend
   - Check browser console for detailed errors

3. **Authentication Issues**:
   - Verify JWT_SECRET matches between requests
   - Check token expiration (24 hours)

4. **Database Issues**:
   - Data is stored in memory (resets on deployment)
   - This is expected for the demo application

### Debugging

1. **View Vercel Logs**:
   ```bash
   vercel logs your-app-name
   ```

2. **Check Function Logs**:
   - Go to Vercel Dashboard
   - Select your project
   - Click "Functions" tab
   - View real-time logs

3. **Test Locally**:
   ```bash
   npm install
   npm start
   # Test on http://localhost:3000
   ```

## 🔄 Updates and Redeployments

### Automatic Deployments

- **Every git push** to the main branch triggers automatic deployment
- **Preview deployments** are created for pull requests
- **Production deployments** happen on pushes to main branch

### Manual Redeployment

1. **Via Dashboard**: Click "Redeploy" on your project page
2. **Via CLI**: Run `vercel --prod` in your project directory

### Environment Variable Updates

1. **Via Dashboard**: 
   - Go to Project Settings → Environment Variables
   - Update values and redeploy

2. **Via CLI**:
   ```bash
   vercel env rm JWT_SECRET production
   vercel env add JWT_SECRET production
   vercel --prod
   ```

## 📊 Performance Optimization

### Current Setup

- **Serverless functions** for automatic scaling
- **Static file serving** via Vercel's CDN
- **In-memory database** for fast access
- **Rate limiting** to prevent abuse

### Production Considerations

For a production deployment, consider:

1. **Database Migration**:
   - Move to PostgreSQL or MongoDB
   - Use Vercel's database integrations

2. **Caching**:
   - Add Redis for session storage
   - Cache frequent API responses

3. **Monitoring**:
   - Set up error tracking (Sentry)
   - Monitor performance metrics

4. **Security**:
   - Rotate JWT secrets regularly
   - Add request validation middleware
   - Implement proper logging

## 🎯 Submission Checklist

Before submitting your deployment:

- ✅ **Health endpoint** responds with `{"status":"ok"}`
- ✅ **All test accounts** can login successfully
- ✅ **Tenant isolation** is enforced (cross-tenant data access blocked)
- ✅ **Role restrictions** work (Members can't upgrade, Admins can)
- ✅ **Free plan limits** enforced (3 notes max)
- ✅ **Pro upgrade** removes limits immediately
- ✅ **CRUD operations** work for all authenticated users
- ✅ **Frontend accessible** and functional
- ✅ **CORS enabled** for cross-origin requests
- ✅ **Error handling** returns appropriate HTTP status codes

## 📞 Support

If you encounter issues:

1. **Check the logs** in Vercel dashboard
2. **Run the test script** to identify specific failures
3. **Verify environment variables** are set correctly
4. **Test locally** to isolate deployment issues

## 🏆 Success!

Once deployed and tested, your Multi-Tenant SaaS Notes Application will be:

- ✅ **Fully functional** with all required features
- ✅ **Production-ready** with proper error handling
- ✅ **Scalable** on Vercel's serverless infrastructure
- ✅ **Secure** with JWT authentication and tenant isolation
- ✅ **Testable** with comprehensive validation scripts

Your application URL will be: `https://your-project-name.vercel.app`

**Congratulations on deploying your Multi-Tenant SaaS Application! 🎉**
