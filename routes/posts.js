const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Post = require('../models/Post');
const { auth, adminAuth } = require('../middleware/auth');

// Multer configuration
const storage = multer.memoryStorage();
 const upload = multer({ storage });

// Create post
router.post('/', adminAuth,  async (req, res) => {
  try {
    const { title, content, categories, tags,image } = req.body;
    

    // Create slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const post = new Post({
      title,
      content,
      image: image ? image : null, 
      author: req.user.id,
      categories: categories ? categories.map(cat => cat.trim()) : [],
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      slug
    });

    const savedPost = await post.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: err.message, });
    console.log(err);
    
  }
});

// Get all posts
router.get('/', async (req, res) => { 
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single post
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findById(req.params.slug)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update post
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, content, categories, tags, status,image } = req.body;
    
    let imageUrl;
    if (req.file) {
      // Convert buffer to base64
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'auto',
        folder: 'blog_images'
      });
      imageUrl = result.secure_url;
    
    if (image) {
      const publicId = post.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }
    }
    const updateData = {
      title,
      content,
      categories:  JSON.parse(categories),
      tags: tags ? tags : [],
      status
    };

    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete image from Cloudinary if exists
    if (post.image) {
      const publicId = post.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 