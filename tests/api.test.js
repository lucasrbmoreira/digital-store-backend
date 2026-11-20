const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

let authToken = '';
let createdUserId = null;
let createdCategoryId = null;
let createdProductId = null;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('API Digital Store - Fluxo Completo', () => {
  test('POST /v1/user deve criar um utilizador e retornar 201', async () => {
    const res = await request(app).post('/v1/user').send({
      firstname: 'João',
      surname: 'Silva',
      email: 'joao@mail.com',
      password: '123@123',
      confirmPassword: '123@123'
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    createdUserId = res.body.id;
  });

  test('POST /v1/user/token deve autenticar e retornar o token JWT com status 200', async () => {
    const res = await request(app).post('/v1/user/token').send({
      email: 'joao@mail.com',
      password: '123@123'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  test('GET /v1/user/:id deve retornar os dados do utilizador sem a senha', async () => {
    const res = await request(app).get(`/v1/user/${createdUserId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('joao@mail.com');
    expect(res.body.password).toBeUndefined();
  });

  test('POST /v1/category sem token deve retornar 400 Bad Request', async () => {
    const res = await request(app).post('/v1/category').send({
      name: 'Shoes',
      slug: 'shoes',
      use_in_menu: true
    });

    expect(res.statusCode).toBe(400);
  });

  test('POST /v1/category com token deve criar categoria e retornar 201', async () => {
    const res = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Shoes',
        slug: 'shoes',
        use_in_menu: true
      });

    expect(res.statusCode).toBe(201);
    createdCategoryId = res.body.id;
  });

  test('GET /v1/category/search deve listar categorias paginadas com status 200', async () => {
    const res = await request(app).get('/v1/category/search?use_in_menu=true');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBe(1);
  });

  test('POST /v1/product com token deve criar produto com imagens e opções', async () => {
    const res = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        enabled: true,
        name: 'Produto 01',
        slug: 'produto-01',
        stock: 10,
        description: 'Descrição do produto 01',
        price: 119.9,
        price_with_discount: 99.9,
        category_ids: [createdCategoryId],
        images: [
          {
            type: 'image/png',
            content: 'https://store.com/media/product-01/image-01.png'
          }
        ],
        options: [
          {
            title: 'Tamanho',
            shape: 'square',
            radius: '4px',
            type: 'text',
            value: ['PP', 'GG', 'M']
          }
        ]
      });

    expect(res.statusCode).toBe(201);
    createdProductId = res.body.id;
  });

  test('GET /v1/product/:id deve retornar detalhes completos do produto', async () => {
    const res = await request(app).get(`/v1/product/${createdProductId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Produto 01');
    expect(res.body.category_ids).toContain(createdCategoryId);
    expect(res.body.options[0].values).toEqual(['PP', 'GG', 'M']);
  });

  test('DELETE /v1/product/:id deve remover o produto e retornar 204', async () => {
    const res = await request(app)
      .delete(`/v1/product/${createdProductId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(204);
  });
});