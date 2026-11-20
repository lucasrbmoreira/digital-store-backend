const userService = require('../services/userService');

const getById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao buscar usuário.' });
  }
};

const create = async (req, res) => {
  try {
    const { firstname, surname, email, password, confirmPassword } = req.body;

    if (!firstname || !surname || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'As senhas não conferem.' });
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já cadastrado.' });
    }

    const newUser = await userService.createUser({
      firstname,
      surname,
      email,
      password
    });

    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao cadastrar usuário.' });
  }
};

const update = async (req, res) => {
  try {
    const { firstname, surname, email } = req.body;

    if (!firstname || !surname || !email) {
      return res.status(400).json({ message: 'Dados inválidos para atualização.' });
    }

    const existingEmail = await userService.getUserByEmail(email);
    if (existingEmail && String(existingEmail.id) !== String(req.params.id)) {
      return res.status(400).json({ message: 'E-mail já está em uso por outro usuário.' });
    }

    const updated = await userService.updateUser(req.params.id, {
      firstname,
      surname,
      email
    });

    if (!updated) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao atualizar usuário.' });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao deletar usuário.' });
  }
};

const generateToken = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    const token = await userService.authenticateUser(email, password);

    if (!token) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(400).json({ message: 'Erro ao gerar token.' });
  }
};

module.exports = {
  getById,
  create,
  update,
  remove,
  generateToken
};