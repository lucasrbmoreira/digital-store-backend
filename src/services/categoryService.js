const { Category } = require('../models');

const ALLOWED_FIELDS = ['id', 'name', 'slug', 'use_in_menu'];

const searchCategories = async ({ limit, page, fields, use_in_menu }) => {
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

  let attributes = ALLOWED_FIELDS;
  if (fields !== undefined) {
    const requestedFields = String(fields)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (
      requestedFields.length === 0 ||
      requestedFields.some((field) => !ALLOWED_FIELDS.includes(field))
    ) {
      const error = new Error('Parâmetro fields inválido.');
      error.statusCode = 400;
      throw error;
    }

    attributes = requestedFields;
  }

  const where = {};
  if (use_in_menu !== undefined) {
    if (use_in_menu === 'true' || use_in_menu === true || use_in_menu === '1') {
      where.use_in_menu = true;
    } else if (use_in_menu === 'false' || use_in_menu === false || use_in_menu === '0') {
      where.use_in_menu = false;
    } else {
      const error = new Error('Parâmetro use_in_menu inválido.');
      error.statusCode = 400;
      throw error;
    }
  }

  const queryOptions = {
    where,
    attributes,
    order: [['id', 'ASC']]
  };

  if (parsedLimit !== -1) {
    queryOptions.limit = parsedLimit;
    queryOptions.offset = (parsedPage - 1) * parsedLimit;
  }

  const { count, rows } = await Category.findAndCountAll(queryOptions);

  return {
    data: rows,
    total: count,
    limit: parsedLimit,
    page: parsedPage
  };
};

const getCategoryById = async (id) => {
  return Category.findByPk(id, {
    attributes: ALLOWED_FIELDS
  });
};

const createCategory = async ({ name, slug, use_in_menu }) => {
  const category = await Category.create({
    name,
    slug,
    use_in_menu: use_in_menu ?? false
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    use_in_menu: category.use_in_menu
  };
};

const updateCategory = async (id, { name, slug, use_in_menu }) => {
  const category = await Category.findByPk(id);
  if (!category) {
    return null;
  }

  await category.update({
    name,
    slug,
    use_in_menu: use_in_menu !== undefined ? use_in_menu : category.use_in_menu
  });

  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) {
    return false;
  }

  await category.destroy();
  return true;
};

module.exports = {
  searchCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};