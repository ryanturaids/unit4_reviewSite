const {
  client,
  createTables,
  createUser,
  fetchUsers,
  createProduct,
  fetchProducts,
  seedUsers,
  seedProducts,
} = require("./db/models");
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
