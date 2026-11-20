const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  sequelize,
  Product,
  Category,
  ProductImage,
  ProductOption
} = require('../models');

const ALLOWED_PRODUCT_FIELDS = [
  'id',
  'enabled',
  'name',
  'slug',
  'use_in_menu',
  'stock',
  'description',
  'price',
  'price_with_discount',
  'category_ids',
  'images',
  'options'
];

const parseRadius = (radius) => {
  if (radius === undefined || radius === null) return 0;
  const numeric = parseInt(String(radius).replace(/px/gi, '').trim(), 10);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const normalizeOptionValues = (option) => {
  const raw = option.values !== undefined ? option.values : option.value;
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).join(',');
  }
  if (typeof raw === 'string') {
    return raw;
  }
  return '';
};

const saveImageContent = (content, type = 'image/png') => {
  if (!content) return '';
  if (content.startsWith('http://') || content.startsWith('https://') || content.startsWith('/media/')) {
    return content;
  }

  const mediaDir = path.join(__dirname, '../../public/media');
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  const base64Data = content.replace(/^data:image\/\w+;base64,/, '');
  const extension = (type.split('/')[1] || 'png').replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(mediaDir, fileName);

  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  return `/media/${fileName}`;
};

const formatProductResponse = (productInstance, requestedFields = null) => {
  const plain = productInstance.get({ plain: true });

  const formatted = {
    id: plain.id,
    enabled: Boolean(plain.enabled),
    name: plain.name,
    slug: plain.slug,
    stock: plain.stock,
    description: plain.description,
    price: plain.price,
    price_with_discount: plain.price_with_discount,
    category_ids: (plain.categories || []).map((cat) => cat.id),
    images: (plain.images || []).map((img) => ({
      id: img.id,
      content: img.path
    })),
    options: (plain.options || []).map((opt) => ({
      id: opt.id,
      title: opt.title,
      shape: opt.shape,
      radius: opt.radius,
      type: opt.type,
      values: opt.values ? opt.values.split(',').map((v) => v.trim()) : []
    }))
  };

  if (requestedFields && requestedFields.length > 0) {
    const filtered = {};
    requestedFields.forEach((field) => {
      if (field in formatted) {
        filtered[field] = formatted[field];
      }
    });
    return filtered;
  }

  return formatted;
};

const searchProducts = async (query) => {
  const {
    limit,
    page,
    fields,
    match,
    category_ids,
    'price-range': priceRange,
    option
  } = query;

  const parsedLimit = limit !== undefined ? Number(limit) : 12;
  const parsedPage = page !== undefined ? Number(page) : 1;

  if (!Number.isInteger(parsedLimit) || parsedLimit === 0 || parsedLimit < -1) {
    const error = new Error('Parâmetro limit inválido.');
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(parsedPage) || parsedPage < 1) {
    const error = new Error('Parâmetro page inválido.');
    error.statusCode = 400;
    throw error;
  }

  let requestedFields = null;
  if (fields !== undefined) {
    requestedFields = String(fields)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (
      requestedFields.length === 0 ||
      requestedFields.some((field) => !ALLOWED_PRODUCT_FIELDS.includes(field))
    ) {
      const error = new Error('Parâmetro fields inválido.');
      error.statusCode = 400;
      throw error;
    }
  }

  const where = {};

  if (match !== undefined && String(match).trim() !== '') {
    const term = `%${String(match).trim()}%`;
    where[Op.or] = [
      { name: { [Op.like]: term } },
      { description: { [Op.like]: term } }
    ];
  }

  if (priceRange !== undefined && String(priceRange).trim() !== '') {
    const parts = String(priceRange).split('-').map(Number);
    if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1]) || parts[0] > parts[1]) {
      const error = new Error('Parâmetro price-range inválido.');
      error.statusCode = 400;
      throw error;
    }
    where.price = { [Op.between]: [parts[0], parts[1]] };
  }

  const categoryInclude = {
    model: Category,
    as: 'categories',
    attributes: ['id'],
    through: { attributes: [] }
  };

  if (category_ids !== undefined && String(category_ids).trim() !== '') {
    const ids = String(category_ids)
      .split(',')
      .map((id) => Number(id.trim()));

    if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
      const error = new Error('Parâmetro category_ids inválido.');
      error.statusCode = 400;
      throw error;
    }

    categoryInclude.where = { id: { [Op.in]: ids } };
    categoryInclude.required = true;
  }

  const products = await Product.findAll({
    where,
    include: [
      categoryInclude,
      { model: ProductImage, as: 'images' },
      { model: ProductOption, as: 'options' }
    ],
    order: [['id', 'ASC']]
  });

  let filteredProducts = products;

  if (option && typeof option === 'object') {
    const optionEntries = Object.entries(option);
    filteredProducts = filteredProducts.filter((prod) => {
      const prodOptions = prod.options || [];
      return optionEntries.every(([optId, rawValues]) => {
        const expectedValues = String(rawValues)
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);

        const targetOption = prodOptions.find((o) => String(o.id) === String(optId));
        if (!targetOption) return false;

        const availableValues = targetOption.values
          ? targetOption.values.split(',').map((v) => v.trim())
          : [];

        return expectedValues.some((val) => availableValues.includes(val));
      });
    });
  }

  const total = filteredProducts.length;
  const paginated =
    parsedLimit === -1
      ? filteredProducts
      : filteredProducts.slice((parsedPage - 1) * parsedLimit, parsedPage * parsedLimit);

  return {
    data: paginated.map((item) => formatProductResponse(item, requestedFields)),
    total,
    limit: parsedLimit,
    page: parsedPage
  };
};

const getProductById = async (id) => {
  const product = await Product.findByPk(id, {
    include: [
      { model: Category, as: 'categories', attributes: ['id'], through: { attributes: [] } },
      { model: ProductImage, as: 'images' },
      { model: ProductOption, as: 'options' }
    ]
  });

  if (!product) {
    return null;
  }

  return formatProductResponse(product);
};

const createProduct = async (payload) => {
  const {
    enabled = false,
    name,
    slug,
    use_in_menu = false,
    stock = 0,
    description = '',
    price,
    price_with_discount,
    category_ids = [],
    images = [],
    options = []
  } = payload;

  return sequelize.transaction(async (transaction) => {
    const product = await Product.create(
      {
        enabled,
        name,
        slug,
        use_in_menu,
        stock,
        description,
        price,
        price_with_discount
      },
      { transaction }
    );

    if (Array.isArray(category_ids) && category_ids.length > 0) {
      await product.setCategories(category_ids, { transaction });
    }

    if (Array.isArray(images) && images.length > 0) {
      const imageRecords = images.map((img) => ({
        product_id: product.id,
        enabled: true,
        path: saveImageContent(img.content, img.type)
      }));
      await ProductImage.bulkCreate(imageRecords, { transaction });
    }

    if (Array.isArray(options) && options.length > 0) {
      const optionRecords = options.map((opt) => ({
        product_id: product.id,
        title: opt.title,
        shape: opt.shape || 'square',
        radius: parseRadius(opt.radius),
        type: opt.type || 'text',
        values: normalizeOptionValues(opt)
      }));
      await ProductOption.bulkCreate(optionRecords, { transaction });
    }

    return product;
  });
};

const updateProduct = async (id, payload) => {
  const product = await Product.findByPk(id);
  if (!product) {
    return null;
  }

  const {
    enabled,
    name,
    slug,
    use_in_menu,
    stock,
    description,
    price,
    price_with_discount,
    category_ids,
    images,
    options
  } = payload;

  await sequelize.transaction(async (transaction) => {
    await product.update(
      {
        enabled: enabled !== undefined ? enabled : product.enabled,
        name: name !== undefined ? name : product.name,
        slug: slug !== undefined ? slug : product.slug,
        use_in_menu: use_in_menu !== undefined ? use_in_menu : product.use_in_menu,
        stock: stock !== undefined ? stock : product.stock,
        description: description !== undefined ? description : product.description,
        price: price !== undefined ? price : product.price,
        price_with_discount:
          price_with_discount !== undefined ? price_with_discount : product.price_with_discount
      },
      { transaction }
    );

    if (Array.isArray(category_ids)) {
      await product.setCategories(category_ids, { transaction });
    }

    if (Array.isArray(images)) {
      for (const img of images) {
        if (img.id && img.deleted) {
          await ProductImage.destroy({
            where: { id: img.id, product_id: product.id },
            transaction
          });
        } else if (img.id && img.content) {
          await ProductImage.update(
            { path: saveImageContent(img.content, img.type) },
            { where: { id: img.id, product_id: product.id }, transaction }
          );
        } else if (!img.id && img.content) {
          await ProductImage.create(
            {
              product_id: product.id,
              enabled: true,
              path: saveImageContent(img.content, img.type)
            },
            { transaction }
          );
        }
      }
    }

    if (Array.isArray(options)) {
      for (const opt of options) {
        if (opt.id && opt.deleted) {
          await ProductOption.destroy({
            where: { id: opt.id, product_id: product.id },
            transaction
          });
        } else if (opt.id) {
          const updateData = {};
          if (opt.title !== undefined) updateData.title = opt.title;
          if (opt.shape !== undefined) updateData.shape = opt.shape;
          if (opt.radius !== undefined) updateData.radius = parseRadius(opt.radius);
          if (opt.type !== undefined) updateData.type = opt.type;
          if (opt.values !== undefined || opt.value !== undefined) {
            updateData.values = normalizeOptionValues(opt);
          }

          await ProductOption.update(updateData, {
            where: { id: opt.id, product_id: product.id },
            transaction
          });
        } else {
          await ProductOption.create(
            {
              product_id: product.id,
              title: opt.title,
              shape: opt.shape || 'square',
              radius: parseRadius(opt.radius),
              type: opt.type || 'text',
              values: normalizeOptionValues(opt)
            },
            { transaction }
          );
        }
      }
    }
  });

  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) {
    return false;
  }

  await product.destroy();
  return true;
};

module.exports = {
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};