const admin = require('../config/firebaseAdmin');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] No authorization header or invalid format');
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('[Auth] Token verified for UID:', decodedToken.uid);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('[Auth] Token verification failed:', error.message);
      return res.status(401).json({ 
        error: 'Unauthorized - Invalid token',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    console.error('[Auth] Auth middleware error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = authMiddleware;
