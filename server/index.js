const { client, createTables, seedDatabase } = require("./db/models");
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
  console.log("database seeded");
  app.listen(port, () => {
    console.log("server running");
  });
};

init();
