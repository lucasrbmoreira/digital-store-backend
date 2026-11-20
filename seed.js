require('dotenv').config();
const bcrypt = require('bcrypt');
const {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  ProductOption
} = require('./src/models');

const seed = async () => {
  try {
    await sequelize.sync({ force: true });

    const hashedPassword = await bcrypt.hash('123@123', 10);
    await User.create({
      firstname: 'Admin',
      surname: 'Store',
      email: 'admin@digitalstore.com',
      password: hashedPassword
    });

    const categories = await Category.bulkCreate([
      { name: 'Tênis', slug: 'tenis', use_in_menu: true },
      { name: 'Camisetas', slug: 'camisetas', use_in_menu: true },
      { name: 'Calças', slug: 'calcas', use_in_menu: true },
      { name: 'Headphones', slug: 'headphones', use_in_menu: true }
    ]);

    const product1 = await Product.create({
      enabled: true,
      name: 'K-Swiss V8 - Masculino',
      slug: 'k-swiss-v8-masculino',
      use_in_menu: true,
      stock: 15,
      description: 'Tênis casual confortável para uso diário e corridas leves.',
      price: 200,
      price_with_discount: 149.9
    });

    await product1.setCategories([categories[0].id]);

    await ProductImage.bulkCreate([
      {
        product_id: product1.id,
        enabled: true,
        path: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'
      }
    ]);

    await ProductOption.bulkCreate([
      {
        product_id: product1.id,
        title: 'Tamanho',
        shape: 'square',
        radius: 4,
        type: 'text',
        values: '39,40,41,42'
      },
      {
        product_id: product1.id,
        title: 'Cor',
        shape: 'circle',
        radius: 0,
        type: 'color',
        values: '#E11D48,#1E293B,#FFFFFF'
      }
    ]);

    const product2 = await Product.create({
      enabled: true,
      name: 'Camiseta Básica Oversized',
      slug: 'camiseta-basica-oversized',
      use_in_menu: true,
      stock: 30,
      description: 'Camiseta 100% algodão com modelagem ampla.',
      price: 89.9,
      price_with_discount: 69.9
    });

    await product2.setCategories([categories[1].id]);

    await ProductImage.bulkCreate([
      {
        product_id: product2.id,
        enabled: true,
        path: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'
      }
    ]);

    await ProductOption.bulkCreate([
      {
        product_id: product2.id,
        title: 'Tamanho',
        shape: 'square',
        radius: 4,
        type: 'text',
        values: 'P,M,G,GG'
      }
    ]);

    console.log('Banco populado com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao popular banco:', error);
    process.exit(1);
  }
};

seed();