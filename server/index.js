const {
  client,
  createTables,
  seedUsers,
  seedProducts,
  createUser,
  fetchUsers,
  seedDatabase,
} = require("./db/models");
const express = require("express");
const app = express();
const routes = require("./routes");
const port = "3000";

app.use(express.json());
app.use("/api", routes);

const init = async () => {
  await client.connect();
  console.log("database connection established");
  createTables();
  console.log("tables created");
  seedDatabase();
  // seedUsers(50);
  // createUser({
  //   username: "Thomas",
  //   password: "iloveplanes",
  //   email: "baristadude@gmail.com",
  // });
  // console.log("users seeded");
  // seedProducts(100);
  // console.log("products seeded");
  app.listen(port, () => {
    console.log("server running");
  });
};

init();
