const express = require('express');

const Category = require('../models/Category');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();


// Public: get categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category
      .find()
      .sort({ name: 1 });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    next(error);
  }
});


// Admin: create category
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      image
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required'
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description?.trim() || '',
      image: image?.trim() || ''
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
});


// Admin: update category
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const {
      name,
      slug,
      description,
      image
    } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        ...(name !== undefined && {
          name: name.trim()
        }),
        ...(slug !== undefined && {
          slug: slug.trim().toLowerCase()
        }),
        ...(description !== undefined && {
          description: description.trim()
        }),
        ...(image !== undefined && {
          image: image.trim()
        })
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
});


// Admin: delete category
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(
      req.params.id
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;