const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST /api/users - Create user profile
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { uid, email, name, role, district } = req.body;

    // Check if user already exists
    let user = await User.findOne({ uid });
    if (user) {
      return res.status(200).json(user);
    }

    // Create new user
    user = new User({
      uid,
      email,
      name,
      role,
      district,
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user profile' });
  }
});

// GET /api/users/me - Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { name },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/upload-profile-photo - Upload profile photo
router.post('/upload-profile-photo', authMiddleware, upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('User:', req.user?.uid);
    console.log('File:', req.file ? 'Present' : 'Missing');
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Convert image to base64 for storage in MongoDB
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    console.log('Base64 image length:', base64Image.length);

    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { profilePhoto: base64Image },
      { new: true }
    );

    if (!user) {
      console.error('User not found:', req.user.uid);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile photo saved successfully');
    
    res.json({ 
      message: 'Profile photo uploaded successfully',
      profilePhoto: user.profilePhoto 
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to upload profile photo',
      details: error.message 
    });
  }
});

module.exports = router;
