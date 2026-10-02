const express = require('express');

const Product = require('../models/Product');

const router = express.Router();

/*
  GET /api/products

  Public product catalog.

  Supports:
  ?category=cars
  ?location=Abuja
  ?search=Toyota
  ?minPrice=1000000
  ?maxPrice=50000000
  ?sort=price-asc
  ?sort=price-desc
  ?sort=newest
*/
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      location,
      search,
      minPrice,
      maxPrice,
      sort
    } = req.query;

    const query = {
      availability: {
        $ne: 'sold'
      }
    };

    /*
      Category
    */
    if (category) {
      query.category = category;
    }

    /*
      Location
    */
    if (location) {
      query.location = location;
    }

    /*
      Search by product name
    */
    if (search) {
      query.name = {
        $regex: search,
        $options: 'i'
      };
    }

    /*
      Price range
    */
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};

      if (minPrice !== undefined && minPrice !== '') {
        const minimum = Number(minPrice);

        if (Number.isFinite(minimum)) {
          query.price.$gte = minimum;
        }
      }

      if (maxPrice !== undefined && maxPrice !== '') {
        const maximum = Number(maxPrice);

        if (Number.isFinite(maximum)) {
          query.price.$lte = maximum;
        }
      }

      /*
        Remove empty price object.
      */
      if (!Object.keys(query.price).length) {
        delete query.price;
      }
    }

    /*
      Sorting
    */
    let sortOption = {
      createdAt: -1
    };

    if (sort === 'price-asc') {
      sortOption = {
        price: 1
      };
    }

    if (sort === 'price-desc') {
      sortOption = {
        price: -1
      };
    }

    if (sort === 'newest') {
      sortOption = {
        createdAt: -1
      };
    }

    const products = await Product.find(query)
      .sort(sortOption);

    res.json({
      success: true,
      products
    });
  } catch (error) {
    next(error);
  }
});


/*
  GET /api/products/:id

  Get one product.
*/
router.get('/:id', async (req, res, next) => {
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

    res.json({
      success: true,
      product
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
