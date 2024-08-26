const { client } = require("./client");
const { faker } = require("@faker-js/faker");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT = process.env.JWT || "shhhhhhhhh";

// AUTHENTICATION
const authenticate = async ({ username, password }) => {
  const SQL = `
    SELECT id, password
    FROM users
    WHERE username=$1;
  `;
  const response = await client.query(SQL, [username]);
  if (
    !response.rows.length ||
    (await bcrypt.compare(password, response.rows[0].password)) == false
  ) {
    const error = Error("incorrect username or password");
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id }, JWT);
  return { token };
};
const findUserByToken = async (token) => {
  let id;
  try {
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
  } catch (ex) {
    const err = Error("not authorized");
    err.status = 401;
    throw err;
  }
  const SQL = `
    SELECT id, username, email
    FROM users
    WHERE id=$1
  `;
  const response = await client.query(SQL, [id]);
  if (!response.rows.length) {
    const err = Error("not authorized");
    err.status = 401;
    throw err;
  }
  return response.rows[0];
};

// USERS
const fetchUsers = async () => {
  const SQL = `
    SELECT *
    FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
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
  return response.rows[0];
};

// PRODUCTS
const fetchProducts = async () => {
  const SQL = `
    SELECT *
    FROM products;
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
  return response.rows[0];
};

// REVIEWS
const fetchReviewsByProduct = async (product_id) => {
  const SQL = `
    SELECT *
    FROM reviews
    WHERE product_id = $1;
  `;
  const response = await client.query(SQL, [product_id]);
  return response.rows;
};
const fetchReviewsByUser = async ({ user_id }) => {
  const SQL = `
    SELECT *
    FROM reviews
    WHERE user_id = $1;
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};
const createReview = async ({ user_id, product_id, rating, details }) => {
  const SQL = `
    INSERT INTO reviews(id, user_id, product_id, rating, details)
    VALUES($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    user_id,
    product_id,
    rating,
    details,
  ]);
  return response.rows[0];
};
const updateReview = async ({ review_id, user_id, rating, details }) => {
  const SQL_CHECK = `
    SELECT id FROM reviews WHERE id=$1 AND user_id=$2;
  `;
  const checkResponse = await client.query(SQL_CHECK, [review_id, user_id]);

  if (!checkResponse.rows.length) {
    const error = new Error("Review not found or unauthorized");
    error.status = 404;
    throw error;
  }

  const SQL_UPDATE = `
    UPDATE reviews
    SET rating=$1, details=$2, updated_at=now()
    WHERE id=$3
    RETURNING *;
  `;
  const response = await client.query(SQL_UPDATE, [rating, details, review_id]);

  return response.rows[0];
};
const deleteReview = async ({ review_id, user_id }) => {
  const SQL_CHECK = `
    SELECT id
    FROM reviews
    WHERE id=$1 AND user_id=$2;
  `;
  const checkResponse = await client.query(SQL_CHECK, [review_id, user_id]);

  if (!checkResponse.rows.length) {
    const error = new Error("Review not found or unauthorized");
    error.status = 404;
    throw error;
  }

  const SQL_DELETE = `
    DELETE FROM reviews
    WHERE id=$1
    RETURNING *;
  `;
  const response = await client.query(SQL_DELETE, [review_id]);

  return response.rows[0];
};

// COMMENTS
const fetchCommentsByReview = async ({ review_id }) => {
  const SQL = `
    SELECT *
    FROM comments
    WHERE review_id = $1;
  `;
  const response = await client.query(SQL, [review_id]);
  return response.rows;
};
const fetchCommentsByUser = async ({ user_id }) => {
  const SQL = `
    SELECT *
    FROM comments
    WHERE user_id = $1;
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};
const createComment = async ({ user_id, review_id, text }) => {
  const SQL = `
    INSERT INTO comments(id, user_id, review_id, text)
    VALUES($1, $2, $3, $4)
    RETURNING *;
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    user_id,
    review_id,
    text,
  ]);
  return response.rows[0];
};
const updateComment = async ({ comment_id, user_id, text }) => {
  const findSQL = `
    SELECT * FROM comments WHERE id = $1 AND user_id = $2;
  `;
  const findResponse = await client.query(findSQL, [comment_id, user_id]);

  if (!findResponse.rows.length) {
    const error = new Error("Not authorized to update this comment");
    error.status = 403;
    throw error;
  }

  const SQL = `
    UPDATE comments
    SET text = $1, updated_at = now()
    WHERE id = $2
    RETURNING *;
  `;
  const response = await client.query(SQL, [text, comment_id]);
  return response.rows[0];
};
const deleteComment = async ({ comment_id, user_id }) => {
  const findSQL = `
    SELECT * FROM comments WHERE id = $1 AND user_id = $2;
  `;
  const findResponse = await client.query(findSQL, [comment_id, user_id]);

  if (!findResponse.rows.length) {
    const error = new Error("Not authorized to delete this comment");
    error.status = 403;
    throw error;
  }

  const SQL = `
    DELETE FROM comments WHERE id = $1
    RETURNING *;
  `;
  const response = await client.query(SQL, [comment_id]);
  return response.rows[0];
};

// INITIALIZATION
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
const seedUsers = async (quantity) => {
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
    await createUser({
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      password: password,
    });
  }
};
const seedProducts = async (quantity) => {
  for (let i = 0; i < quantity; i++) {
    const productName = faker.commerce.productName();
    const productDescription = faker.commerce.productDescription();
    await createProduct({
      name: productName,
      details: productDescription,
    });
  }
};
const seedReview = async (product_id, user_id) => {
  await createReview({
    product_id,
    user_id,
    rating: Math.floor(Math.random() * 5) + 1,
    details: faker.lorem.sentence(),
  });
};
const seedComment = async (review_id, user_id) => {
  await createComment({
    review_id: review_id,
    user_id: user_id,
    text: faker.lorem.sentence(),
  });
};
const seedDatabase = async () => {
  await seedUsers(20);
  const users = await fetchUsers();
  await seedProducts(30);
  const products = await fetchProducts();
  await seedReview(products[0].id, users[0].id);
  await seedReview(products[1].id, users[0].id);
  await seedReview(products[2].id, users[0].id);
  await seedReview(products[0].id, users[1].id);
  await seedReview(products[1].id, users[1].id);
  await seedReview(products[2].id, users[1].id);
  await seedReview(products[0].id, users[2].id);
  await seedReview(products[1].id, users[2].id);
  await seedReview(products[2].id, users[2].id);
  await seedReview(products[0].id, users[3].id);
  await seedReview(products[1].id, users[3].id);
  await seedReview(products[2].id, users[3].id);
  const reviews1 = await fetchReviewsByProduct(products[0].id);
  const reviews2 = await fetchReviewsByProduct(products[1].id);
  const reviews3 = await fetchReviewsByProduct(products[2].id);
  await seedComment(reviews1[0].id, users[4].id);
  await seedComment(reviews1[1].id, users[5].id);
  await seedComment(reviews1[2].id, users[6].id);
  await seedComment(reviews1[3].id, users[7].id);
  await seedComment(reviews2[0].id, users[4].id);
  await seedComment(reviews2[1].id, users[5].id);
  await seedComment(reviews2[2].id, users[6].id);
  await seedComment(reviews2[3].id, users[7].id);
  await seedComment(reviews3[0].id, users[4].id);
  await seedComment(reviews3[1].id, users[5].id);
  await seedComment(reviews3[2].id, users[6].id);
  await seedComment(reviews3[3].id, users[7].id);
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
  authenticate,
  findUserByToken,
  createReview,
  updateReview,
  deleteReview,
  fetchReviewsByProduct,
  fetchReviewsByUser,
  fetchCommentsByReview,
  fetchCommentsByUser,
  createComment,
  updateComment,
  deleteComment,
  seedDatabase,
};
