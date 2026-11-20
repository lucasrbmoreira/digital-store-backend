Digital Store - Back-end API
API RESTful desenvolvida em Node.js e Express para gerenciamento de um e-commerce, incluindo autenticação via JWT, controle de categorias, cadastro de produtos com múltiplas imagens e variações, e testes automatizados de integração.

Tecnologias Utilizadas
Node.js e Express

MySQL e Sequelize (ORM)

JSON Web Token (JWT) e Bcrypt

Dotenv e CORS

Jest e Supertest

Arquitetura do Banco de Dados
O banco relacional digital_store é organizado em 6 tabelas gerenciadas pelo Sequelize:

users: armazena cadastros de usuários e senhas criptografadas para autenticação.

categories: gerencia os departamentos da loja e define a exibição no menu principal (use_in_menu).

products: registra dados de catálogo, estoque, preço original e preço promocional.

product_images: armazena múltiplas imagens vinculadas a cada produto.

product_options: armazena variações de tamanho e cor (square, circle, text, color).

product_categories: tabela intermediária que resolve a relação muitos-para-muitos entre produtos e categorias.

Pré-requisitos
Node.js (v18 ou superior)

Serviço MySQL ativo (XAMPP, MariaDB ou MySQL Server)

Instalação e Execução
Instale as dependências do projeto:

npm install

Crie um arquivo .env na raiz do projeto com as seguintes variáveis:

PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=digital_store
DB_USER=root
DB_PASS=
JWT_SECRET=sua_chave_secreta_aqui

Com o serviço MySQL ativo, crie o banco de dados:

CREATE DATABASE IF NOT EXISTS digital_store;

Popule o banco de dados com categorias e produtos iniciais:

node seed.js

Inicie o servidor em modo de desenvolvimento:

npm run dev

A API ficará disponível em http://localhost:3000.

Testes Automatizados
Para executar os testes de integração das rotas:

npm test
Observação: a suíte de testes recria as tabelas do banco (force: true). Caso queira restaurar os produtos iniciais após rodar os testes, execute node seed.js novamente.

Principais Endpoints
Usuários:

POST /v1/user - Cadastra um novo usuário.

POST /v1/user/token - Autentica credenciais e retorna o token JWT.

GET /v1/user/:id - Retorna os dados públicos do usuário.

PUT /v1/user/:id - Atualiza dados do usuário (requer token).

DELETE /v1/user/:id - Remove o usuário (requer token).

Categorias:

GET /v1/category/search - Lista categorias com paginação e filtro use_in_menu.

GET /v1/category/:id - Detalha uma categoria específica.

POST /v1/category - Cria uma nova categoria (requer token).

PUT /v1/category/:id - Atualiza uma categoria (requer token).

DELETE /v1/category/:id - Remove uma categoria (requer token).

Produtos:

GET /v1/product/search - Busca produtos com filtros por termo (match), categoria (category_ids), preço e paginação.

GET /v1/product/:id - Retorna detalhes completos do produto, imagens, opções e categorias.

POST /v1/product - Cadastra um novo produto com imagens e variações (requer token).

PUT /v1/product/:id - Atualiza dados, imagens e opções do produto (requer token).

DELETE /v1/product/:id - Exclui o produto e seus vínculos (requer token).