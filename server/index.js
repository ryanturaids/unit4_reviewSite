const {
  client,
  createTables,
  createUser,
  fetchUsers,
  createProduct,
  fetchProducts,
} = require("./db");
const { faker } = require("@faker-js/faker");
const express = require("express");
const app = express();
const port = "3000";

app.use(express.json());

app.get("/api/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (error) {
    next(error);
  }
});
app.get("/api/products", async (req, res, next) => {
  try {
    res.send(await fetchProducts());
  } catch (error) {
    next(error);
  }
});

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

const init = async () => {
  await client.connect();
  console.log("database connection established");
  createTables();
  console.log("tables created");
  seedUsers(50);
  console.log("users seeded");
  seedProducts(100);
  console.log("products seeded");
  app.listen(port, () => {
    console.log("server running");
  });
};

init();
