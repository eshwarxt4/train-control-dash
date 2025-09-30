# MongoDB Setup Guide

## 🌐 Using MongoDB Atlas (Recommended)

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster

### 2. Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a user with read/write permissions
4. Note down the username and password

### 3. Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Add your current IP address or use `0.0.0.0/0` for all IPs (less secure)

### 4. Get Connection String
1. Go to "Clusters" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `rail_prism`

### 5. Update Environment Variables
Update your `backend/.env` file:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rail_prism?retryWrites=true&w=majority
```

## 🔧 Configuration

Update your `backend/.env` file with your MongoDB Atlas connection string:

```bash
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/rail_prism?retryWrites=true&w=majority
```

## 🚀 Quick Start with Atlas

1. **Sign up** at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create cluster** (free tier available)
3. **Create database user** with read/write permissions
4. **Add IP address** to network access
5. **Get connection string** from cluster
6. **Update** `backend/.env` with your connection string
7. **Run** the application

## 🛠️ Quick Setup

Since you're using MongoDB Atlas (cloud database), you only need to:

1. **Get your connection string** from MongoDB Atlas
2. **Update** `backend/.env` with your actual connection string
3. **Run** the application

## 📝 Example Connection Strings

### MongoDB Atlas
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/rail_prism?retryWrites=true&w=majority
```


## 🔍 Troubleshooting

### Connection Issues
- Check if your IP address is whitelisted in Atlas
- Verify username and password are correct
- Ensure the database name is `rail_prism`
- Check if MongoDB service is running (for local setup)

### Database Not Found
- The database will be created automatically when the first document is inserted
- No need to create the database manually

### Authentication Failed
- Double-check username and password
- Ensure the user has read/write permissions
- Verify the connection string format

## 📚 Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Connection String Guide](https://docs.mongodb.com/manual/reference/connection-string/)
- [MongoDB Atlas Free Tier](https://www.mongodb.com/atlas/free)