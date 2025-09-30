# MongoDB Atlas Connection Troubleshooting

## 🚨 Current Error: ECONNREFUSED

The error `querySrv ECONNREFUSED _mongodb._tcp.prism.w7uf2iz.mongodb.net` indicates a connection issue.

## 🔧 Step-by-Step Fix

### 1. Check MongoDB Atlas Dashboard
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Select your project

### 2. Verify Cluster Status
1. Go to **Clusters** in the left sidebar
2. Check if your cluster shows **"Running"** status
3. If it shows **"Paused"**, click **"Resume"** to start it
4. Wait for the cluster to fully start (green status)

### 3. Check Network Access
1. Go to **Network Access** in the left sidebar
2. Click **"Add IP Address"**
3. Either:
   - Add your current IP address (recommended)
   - Add `0.0.0.0/0` to allow all IPs (for testing only)
4. Click **"Confirm"**

### 4. Verify Database User
1. Go to **Database Access** in the left sidebar
2. Check if your user exists and has **"Read and write"** permissions
3. If not, create a new user or update permissions

### 5. Get Correct Connection String
1. Go to **Clusters** → Click **"Connect"**
2. Select **"Connect your application"**
3. Choose **"Node.js"** as driver
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `rail_prism`

### 6. Update Environment File
Update `backend/.env` with the correct connection string:

```bash
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/rail_prism?retryWrites=true&w=majority
```

### 7. Test Connection
Run the test script to verify:

```bash
node test-mongodb.js
```

## 🎯 Common Issues & Solutions

### Issue: Cluster is Paused
**Solution**: Resume the cluster in Atlas dashboard

### Issue: IP Not Whitelisted
**Solution**: Add your IP to Network Access

### Issue: Wrong Password
**Solution**: Reset password in Database Access

### Issue: Database Name Missing
**Solution**: Add `/rail_prism` to the connection string

### Issue: User Permissions
**Solution**: Ensure user has "Read and write" permissions

## 📞 Still Having Issues?

1. **Check Atlas Status**: https://status.mongodb.com/
2. **Atlas Documentation**: https://docs.atlas.mongodb.com/
3. **Community Support**: https://community.mongodb.com/

## ✅ Success Indicators

When working correctly, you should see:
- Cluster status: **Running** (green)
- Network Access: **Your IP listed**
- Database Access: **User with Read/Write permissions**
- Test script: **"Successfully connected to MongoDB!"**