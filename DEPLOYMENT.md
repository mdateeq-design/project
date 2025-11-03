# Deployment Guide for Render

## Issues Fixed

1. ✅ **MongoDB Connection**: Added better error handling and connection options
2. ✅ **Socket.io Production**: Fixed client to auto-detect server URL
3. ✅ **Port Configuration**: Server now uses `process.env.PORT` for Render

## Environment Variables Setup

### For Local Development

Create a `.env` file in the project root with:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
PORT=3005
NODE_ENV=development
```

### For Render Deployment

1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** section
4. Add these environment variables:

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
NODE_ENV=production
```

**NOTE**: Render automatically sets the `PORT` variable, so don't add it manually.

## Fixing MongoDB Authentication Error

The error "bad auth : authentication failed" usually means:

### 1. URL-encode Special Characters in Password

If your MongoDB password contains special characters, you MUST URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `/` becomes `%2F`
- `?` becomes `%3F`
- `&` becomes `%26`
- `=` becomes `%3D`
- `+` becomes `%2B`
- ` ` (space) becomes `%20`

**Example:**
- Password: `MyP@ssw0rd#123`
- URL-encoded: `MyP%40ssw0rd%23123`
- Connection string: `mongodb+srv://username:MyP%40ssw0rd%23123@cluster.mongodb.net/database_name`

### 2. Verify MongoDB Atlas Settings

1. **Check IP Whitelist**:
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` to allow all IPs (or your Render service IP)
   - For local testing, add your current IP address

2. **Check Database User**:
   - Go to MongoDB Atlas → Database Access
   - Verify username and password are correct
   - Ensure user has read/write permissions

3. **Get Connection String**:
   - Go to MongoDB Atlas → Database → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your URL-encoded password
   - Replace `<database_name>` with your actual database name

### 3. Test Connection Locally

1. Create `.env` file with your MongoDB URI
2. Run `npm start`
3. Check console for "Connected to MongoDB successfully"
4. If you see authentication error, check password encoding

## Render Deployment Steps

1. **Push code to GitHub/GitLab/Bitbucket**

2. **Create New Web Service on Render**:
   - Connect your repository
   - Build Command: `npm install` (or leave empty, Render auto-detects)
   - Start Command: `npm start`

3. **Set Environment Variables** (in Render dashboard):
   ```
   MONGO_URI=your_mongodb_connection_string
   NODE_ENV=production
   ```

4. **Deploy**: Render will automatically deploy your app

5. **Test Socket.io Connection**:
   - Open your deployed app URL
   - Open browser DevTools → Console
   - You should see Socket.io connection established
   - No connection errors should appear

## Troubleshooting

### Socket.io Connection Failed

If Socket.io fails to connect on Render:

1. **Check Server Logs** in Render dashboard - look for errors
2. **Verify Environment Variables** are set correctly
3. **Check MongoDB Connection** - server must connect to MongoDB successfully
4. **Verify PORT** - Render sets this automatically, don't override it

### MongoDB Connection Fails on Render but Works Locally

1. **Check IP Whitelist** - Add `0.0.0.0/0` to MongoDB Atlas Network Access
2. **Verify Password Encoding** - Special characters must be URL-encoded
3. **Check Environment Variable** - Ensure `MONGO_URI` is set correctly in Render
4. **Check MongoDB Atlas Cluster** - Ensure it's not paused (free tier pauses after inactivity)

## Testing

### Local Testing
```bash
npm start
# Server should start on http://localhost:3005
# Socket.io should connect automatically
```

### Production Testing
1. Deploy to Render
2. Visit your Render app URL
3. Open browser console
4. Verify Socket.io connection (no errors)
5. Test login/signup functionality
6. Test creating/joining rooms

