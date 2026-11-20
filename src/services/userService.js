const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const getUserById = async (id) => {
  return User.findByPk(id, {
    attributes: ['id', 'firstname', 'surname', 'email']
  });
};

const getUserByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

const createUser = async ({ firstname, surname, email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstname,
    surname,
    email,
    password: hashedPassword
  });

  return {
    id: user.id,
    firstname: user.firstname,
    surname: user.surname,
    email: user.email
  };
};

const updateUser = async (id, { firstname, surname, email }) => {
  const user = await User.findByPk(id);
  if (!user) {
    return null;
  }

  await user.update({ firstname, surname, email });
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    return false;
  }

  await user.destroy();
  return true;
};

const authenticateUser = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return null;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return token;
};

module.exports = {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  authenticateUser
};