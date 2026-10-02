const express = require('express');

const Product = require('../models/Product');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  uploadToCloudinary,
  deleteFromCloudinary
} = require('../services/cloudinary');

const router = express.Router();

/*
  GET /api/admin/products
*/
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const products = await Product.find()
      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    next(error);
  }
});

/*
  POST /api/admin/products

  Creates a product and uploads images to Cloudinary.
*/
router.post(
  '/',
  requireAdmin,
  upload.array('images', 10),
  async (req, res, next) => {
    try {
      const {
        name,
        category,
        price,
        location,
        quantity,
        availability,
        description
      } = req.body;

      const images = [];

      for (const file of req.files || []) {
        const result = await uploadToCloudinary(file.buffer);

        images.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }

      const product = await Product.create({
        name,
        category,
        price: Number(price),
        location,
        quantity: Number(quantity),
        availability: availability || 'available',
        description: description || '',
        images
      });

      res.status(201).json({
        success: true,
        product
      });
    } catch (error) {
      next(error);
    }
  }
);
/*
  PATCH /api/admin/products/:id

  Updates a product.

  New images are added to existing images.
*/
router.patch(
  '/:id',
  requireAdmin,
  upload.array('images', 10),
  async (req, res, next) => {
    try {
      const product = await Product.findById(
        req.params.id
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const {
        name,
        category,
        price,
        location,
        quantity,
        availability,
        description
      } = req.body;

      if (name !== undefined) {
        product.name = name.trim();
      }

      if (category !== undefined) {
        product.category = category.trim();
      }

      if (price !== undefined) {
        const parsedPrice = Number(price);

        if (
          !Number.isFinite(parsedPrice) ||
          parsedPrice < 0
        ) {
          return res.status(400).json({
            success: false,
            message: 'Invalid price'
          });
        }

        product.price = parsedPrice;
      }

      if (location !== undefined) {
        product.location = location.trim();
      }

      if (quantity !== undefined) {
        const parsedQuantity = Number(quantity);

        if (
          !Number.isFinite(parsedQuantity) ||
          parsedQuantity < 0
        ) {
          return res.status(400).json({
            success: false,
            message: 'Invalid quantity'
          });
        }

        product.quantity = parsedQuantity;
      }

      if (availability !== undefined) {
        product.availability = availability;
      }

      if (description !== undefined) {
        product.description =
          description.trim();
      }

      /*
        Upload any newly added images.
      */
      for (const file of req.files || []) {
        const result = await uploadToCloudinary(
          file.buffer
        );

        product.images.push({
  url: result.secure_url,
  publicId: result.public_id
});
      }

      await product.save();

      res.json({
        success: true,
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
  DELETE /api/admin/products/:id
*/
router.delete(
  '/:id',
  requireAdmin,
  async (req, res, next) => {
    try {
      const product = await Product.findById(
        req.params.id
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      /*
        Delete all product images from Cloudinary.
      */
      for (const image of product.images) {
        if (image.publicId) {
          try {
            await deleteFromCloudinary(
              image.publicId
            );
          } catch (cloudinaryError) {
            console.error(
              'Cloudinary deletion failed:',
              cloudinaryError.message
            );
          }
        }
      }

      /*
        Delete product from MongoDB.
      */
      await Product.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;