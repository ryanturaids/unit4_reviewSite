const request = require("supertest");
const {
  client,
  createTables,
  createUser,
  createProduct,
} = require("./db/models");
const express = require("express");
const routes = require("./routes");

// Create the app instance for testing
const app = express();
app.use(express.json());
app.use("/api", routes);

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
    await createUser({
      username: "janesmith",
      email: "janesmith@example.com",
      password: "password456",
    });
    await createProduct({
      name: "Test Product 1",
      details: "Test product 1 description.",
    });
    await createProduct({
      name: "Test Product 2",
    });
    await createProduct({
      name: "Test Product 3",
      details: "Test product 3 description.",
    });
  });
  afterAll(async () => {
    await client.end();
  });

  // USERS
  describe("GET /api/users", () => {
    let response;
    beforeAll(async () => {
      response = await request(app).get("/api/users");
    });
    it("should return status 200", () => {
      expect(response.statusCode).toBe(200);
    });
    it("should return at least one user", () => {
      expect(response.body.length).toBeGreaterThan(0);
    });
    it("should return user with a first and last name", () => {
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("first_name", "John");
      expect(response.body[0]).toHaveProperty("last_name", "Doe");
      expect(response.body[0]).toHaveProperty("username", "johndoe");
      expect(response.body[0]).toHaveProperty("email", "johndoe@example.com");
    });
    it("should return user with no first and last name", () => {
      expect(response.body[1]).toHaveProperty("id");
      expect(response.body[1]).toHaveProperty("first_name", null);
      expect(response.body[1]).toHaveProperty("last_name", null);
      expect(response.body[1]).toHaveProperty("username", "janesmith");
      expect(response.body[1]).toHaveProperty("email", "janesmith@example.com");
    });
  });
  describe("POST /api/users", () => {
    let response;
    const newUser = {
      firstName: "Alice",
      lastName: "Wonderland",
      username: "alicew",
      email: "alice@example.com",
      password: "password789",
    };
    beforeAll(async () => {
      response = await request(app).post("/api/users").send(newUser);
    });
    it("should return status 201", () => {
      expect(response.statusCode).toBe(201);
    });
    it("should return created user with a unique id", async () => {
      const users = await request(app).get("/api/users");
      const isDuplicate =
        users.body.filter((user) => user.id === response.body.id).length > 1
          ? true
          : false;
      expect(isDuplicate).toBe(false);
    });
    it("should not return user's password", () => {
      expect(response.body.password).not.toBe(newUser.password);
    });
  });

  // PRODUCTS
  describe("GET /api/products", () => {
    let response;
    beforeAll(async () => {
      response = await request(app).get("/api/products");
    });
    it("should return status 200", () => {
      expect(response.statusCode).toBe(200);
    });
    it("should return at least one product", () => {
      expect(response.body.length).toBeGreaterThan(0);
    });
    it("should return product with both name and description", () => {
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("name", "Test Product 1");
      expect(response.body[0]).toHaveProperty(
        "details",
        "Test product 1 description."
      );
    });
    it("should return product with only a name", () => {
      expect(response.body[1]).toHaveProperty("id");
      expect(response.body[1]).toHaveProperty("name", "Test Product 2");
      expect(response.body[1]).toHaveProperty("details", null);
    });
  });
  describe("POST /api/products", () => {
    let resGoodProduct,
      resGoodProductNoDetails,
      resBadProductNoName,
      resBadProductNull;
    const [
      productGood,
      productGoodNoDetails,
      productBadNoName,
      productBadNull,
    ] = [
      {
        name: "Test Product 4",
        details: "Test Product 4 description.",
      },
      {
        name: "Test Product 5",
      },
      {
        details: "Test Product 6 description.",
      },
      {},
    ];
    beforeAll(async () => {
      [
        resGoodProduct,
        resGoodProductNoDetails,
        resBadProductNoName,
        resBadProductNull,
      ] = await Promise.all([
        request(app).post("/api/products").send(productGood),
        request(app).post("/api/products").send(productGoodNoDetails),
        request(app).post("/api/products").send(productBadNoName),
        request(app).post("/api/products").send(productBadNull),
      ]);
    });
    it("name and description should return status 201", () => {
      expect(resGoodProduct.statusCode).toBe(201);
    });
    it("name and NO description should return status 201", () => {
      expect(resGoodProductNoDetails.statusCode).toBe(201);
    });
    it("description and NO should return status 500", () => {
      expect(resBadProductNoName.statusCode).toBe(500);
    });
    it("no info should return status 500", () => {
      expect(resBadProductNull.statusCode).toBe(500);
    });
  });

  // REVIEWS
  // COMMENTS
  // AUTHENTICATION
  describe("POST /api/auth/login", () => {
    let resGoodInfo, resBadInfo, resBadUsername, resBadPassword;
    const [userGoodInfo, userBadInfo, userBadUsername, userBadPassword] = [
      {
        username: "johndoe",
        password: "password123",
      },
      {
        username: "incorrectusername",
        password: "incorrectpassword",
      },
      {
        username: "incorrectusername",
        password: "password123",
      },
      {
        username: "johndoe",
        password: "incorrectpassword",
      },
    ];
    beforeAll(async () => {
      [resGoodInfo, resBadInfo, resBadUsername, resBadPassword] =
        await Promise.all([
          request(app).post("/api/auth/login").send(userGoodInfo),
          request(app).post("/api/auth/login").send(userBadInfo),
          request(app).post("/api/auth/login").send(userBadUsername),
          request(app).post("/api/auth/login").send(userBadPassword),
        ]);
    });

    it("correct username and password should return status 200", () => {
      expect(resGoodInfo.statusCode).toBe(200);
    });
    it("incorrect username and password returns status 401", () => {
      expect(resBadInfo.statusCode).toBe(401);
    });
    it("incorrect username correct password returns status 401", () => {
      expect(resBadUsername.statusCode).toBe(401);
    });
    it("correct username incorrect password returns status 401", () => {
      expect(resBadPassword.statusCode).toBe(401);
    });
  });
});
