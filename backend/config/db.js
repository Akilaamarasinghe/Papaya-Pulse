const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    // Set DNS to use Google's DNS to fix Windows DNS resolution issues
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    
    console.log('🔄 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    if (error.message.includes('querySrv') || error.message.includes('ENOTFOUND')) {
      console.error('\n🔧 DNS Resolution Issue Detected!');
      console.error('Try these solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Flush DNS cache: ipconfig /flushdns');
      console.error('3. Add to MongoDB Atlas Network Access: 0.0.0.0/0');
      console.error('4. Try using VPN if corporate network blocks MongoDB');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
