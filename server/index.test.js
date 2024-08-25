const request = require("supertest");
const { client, createTables, createUser, createProduct } = require("./db");
const express = require("express");

const app = express();
app.use(express.json());
app.use("/api/users", async (req, res, next) => {
  try {
    res.send(await require("./db").fetchUsers());
  } catch (error) {
    next(error);
  }
});
app.use("/api/products", async (req, res, next) => {
  try {
    res.send(await require("./db").fetchProducts());
  } catch (error) {
    next(error);
  }
});

describe("API Endpoints", () => {
  beforeAll(async () => {
    await client.connect();
    await createTables();
    await createUser({
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
      email: "johndoe@example.com",
      password: "password123",
    });
    await createProduct({
      name: "Test Product",
      details: "This is a test product description.",
    });
  });

  afterAll(async () => {
    await client.end();
  });

  describe("GET /api/users", () => {
    it("should fetch all users", async () => {
      const response = await request(app).get("/api/users");
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("username", "johndoe");
    });
  });

  describe("GET /api/products", () => {
    it("should fetch all products", async () => {
      const response = await request(app).get("/api/products");
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("name", "Test Product");
    });
  });
});
