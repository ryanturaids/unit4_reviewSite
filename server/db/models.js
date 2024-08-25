const { client } = require("./client");
const { faker } = require("@faker-js/faker");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT = process.env.JWT || "shhhhhhhhh";

const createTables = async () => {
  const SQL = `
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS comments CASCADE;
    CREATE TABLE users(
      id UUID PRIMARY KEY NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(100) NOT NULL,
      password VARCHAR(255),
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE TABLE products(
      id UUID PRIMARY KEY NOT NULL,
      name VARCHAR(50) NOT NULL,
      details VARCHAR(255),
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now()
    );
    CREATE TABLE reviews(
      id UUID PRIMARY KEY NOT NULL,
      user_id UUID REFERENCES users(id) NOT NULL,
      product_id UUID REFERENCES products(id) NOT NULL,
      CONSTRAINT unique_review UNIQUE (user_id, product_id),
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now(),
      rating INTEGER NOT NULL CHECK (rating IN (1, 2, 3, 4, 5)),
      details VARCHAR(255)
    );
    CREATE TABLE comments(
      id UUID PRIMARY KEY NOT NULL,
      user_id UUID REFERENCES users(id) NOT NULL,
      review_id UUID REFERENCES reviews(id) NOT NULL,
      text VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now()
    );
  `;
  await client.query(SQL);
};

const createUser = async ({
  username,
  email,
  password,
  firstName,
  lastName,
}) => {
  const SQL = `
    INSERT INTO users(id, username, email, password, first_name, last_name)
    VALUES($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    username,
    email,
    await bcrypt.hash(password, 5),
    firstName,
    lastName,
  ]);
};
const fetchUsers = async () => {
  const SQL = `
    SELECT *
    FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const createProduct = async ({ name, details }) => {
  const SQL = `
  INSERT INTO products(id, name, details)
  VALUES($1, $2, $3)
  RETURNING *;
`;
  const response = await client.query(SQL, [uuid.v4(), name, details]);
};
const fetchProducts = async () => {
  const SQL = `
    SELECT *
    FROM products;
`;
  const response = await client.query(SQL);
  return response.rows;
};

const seedUsers = (quantity) => {
  for (let i = 0; i < quantity; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.userName({
      firstName: firstName,
      lastName: lastName,
    });
    const email = faker.internet.exampleEmail({
      firstName: firstName,
      lastName: lastName,
    });
    const password = faker.internet.password();
    createUser({
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      password: password,
    });
  }
};
const seedProducts = (quantity) => {
  for (let i = 0; i < quantity; i++) {
    const productName = faker.commerce.productName();
    const productDescription = faker.commerce.productDescription();
    createProduct({
      name: productName,
      details: productDescription,
    });
  }
};

module.exports = {
  client,
  createTables,
  createUser,
  fetchUsers,
  createProduct,
  fetchProducts,
  seedUsers,
  seedProducts,
};
