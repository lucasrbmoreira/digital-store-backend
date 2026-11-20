const categoryService = require('../services/categoryService');

const search = async (req, res) => {
  try {
    const result = await categoryService.searchCategories(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    return res.status(200).json(category);
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao buscar categoria.' });
  }
};

const create = async (req, res) => {
  try {
    const { name, slug, use_in_menu } = req.body;

    if (!name || typeof name !== 'string' || !slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Os campos name e slug são obrigatórios.' });
    }

    if (use_in_menu !== undefined && typeof use_in_menu !== 'boolean') {
      return res.status(400).json({ message: 'O campo use_in_menu deve ser booleano.' });
    }

    const category = await categoryService.createCategory({
      name,
      slug,
      use_in_menu
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao cadastrar categoria.' });
  }
};

const update = async (req, res) => {
  try {
    const { name, slug, use_in_menu } = req.body;

    if (!name || typeof name !== 'string' || !slug || typeof slug !== 'string') {
      return res.status(400).json({ message: 'Os campos name e slug são obrigatórios.' });
    }

    if (use_in_menu !== undefined && typeof use_in_menu !== 'boolean') {
      return res.status(400).json({ message: 'O campo use_in_menu deve ser booleano.' });
    }

    const updated = await categoryService.updateCategory(req.params.id, {
      name,
      slug,
      use_in_menu
    });

    if (!updated) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao atualizar categoria.' });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await categoryService.deleteCategory(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao deletar categoria.' });
  }
};

module.exports = {
  search,
  getById,
  create,
  update,
  remove
};