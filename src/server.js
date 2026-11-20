require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Servidor em execução na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao conectar com a base de dados:', error);
    process.exit(1);
  }
};

startServer();