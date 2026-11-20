const productService = require('../services/productService');

const search = async (req, res) => {
  try {
    const result = await productService.searchProducts(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao buscar produto.' });
  }
};

const create = async (req, res) => {
  try {
    const { name, slug, price, price_with_discount } = req.body;

    if (
      !name ||
      !slug ||
      typeof price !== 'number' ||
      typeof price_with_discount !== 'number'
    ) {
      return res.status(400).json({
        message: 'Os campos name, slug, price e price_with_discount são obrigatórios.'
      });
    }

    const created = await productService.createProduct(req.body);
    return res.status(201).json({ id: created.id, name: created.name, slug: created.slug });
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao cadastrar produto.' });
  }
};

const update = async (req, res) => {
  try {
    const { name, slug, price, price_with_discount } = req.body;

    if (
      (name !== undefined && typeof name !== 'string') ||
      (slug !== undefined && typeof slug !== 'string') ||
      (price !== undefined && typeof price !== 'number') ||
      (price_with_discount !== undefined && typeof price_with_discount !== 'number')
    ) {
      return res.status(400).json({ message: 'Dados inválidos para atualização.' });
    }

    const updated = await productService.updateProduct(req.params.id, req.body);

    if (!updated) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao atualizar produto.' });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao deletar produto.' });
  }
};

module.exports = {
  search,
  getById,
  create,
  update,
  remove
};