const request = require("supertest");
const {
  client,
  createTables,
  createUser,
  createProduct,
  createReview,
  fetchUsers,
  fetchProducts,
  fetchReviewsByProduct,
  createComment,
} = require("./db/models");
const express = require("express");
const routes = require("./routes");

const jwt = require("jsonwebtoken");
const JWT = process.env.JWT || "shhhhhhhhh";

function createToken(user, secret) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  const token = jwt.sign(payload, secret);

  return token;
}

// Create the app instance for testing
const app = express();
app.use(express.json());
app.use("/api", routes);

describe("API Endpoints", () => {
  let userList, productList, reviewList0;

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
    userList = await fetchUsers();
    productList = await fetchProducts();
    await createReview({
      user_id: userList[0].id,
      product_id: productList[0].id,
      rating: 3,
      details: "review 1 description",
    });
    await createReview({
      user_id: userList[0].id,
      product_id: productList[1].id,
      rating: 1,
      details: "review 2 description",
    });
    await createReview({
      user_id: userList[1].id,
      product_id: productList[0].id,
      rating: 5,
      details: "review 3 description",
    });
    await createReview({
      user_id: userList[1].id,
      product_id: productList[2].id,
      rating: 2,
      details: "review 4 description",
    });
    reviewList0 = await fetchReviewsByProduct(productList[0].id);
    await createComment({
      user_id: userList[0].id,
      review_id: reviewList0[0].id,
      text: "comment 1 description",
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
  describe("GET /api/products/:product_id/reviews", () => {
    beforeAll(async () => {
      response = await request(app).get(
        `/api/products/${productList[0].id}/reviews`
      );
    });
    it("should return status 200", () => {
      expect(response.statusCode).toBe(200);
    });
    it("should return at least one review if there are reviews", () => {
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
  describe("GET /api/users/:user_id/reviews", () => {
    beforeAll(async () => {
      const token = createToken(userList[0], JWT);
      response = await request(app)
        .get(`/api/users/${userList[0].id}/reviews`)
        .set("Authorization", `Bearer ${token}`);
    });
    it("should return status 200", () => {
      expect(response.statusCode).toBe(200);
    });
    it("should return at least one review if the user has reviews", () => {
      expect(response.body.length).toBeGreaterThan(0);
    });
    it("should return reviews with correct properties", () => {
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("user_id", userList[0].id);
      expect(response.body[0]).toHaveProperty("product_id");
      expect(response.body[0]).toHaveProperty("rating");
      expect(response.body[0]).toHaveProperty("details");
    });
  });
  describe("POST /api/products/:product_id/reviews", () => {
    let response, token;
    const newReview = {
      rating: 4,
      details: "This is a new review for Test Product 2",
    };

    beforeAll(async () => {
      token = createToken(userList[1], JWT);
      response = await request(app)
        .post(`/api/products/${productList[1].id}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send(newReview);
    });

    it("should return status 201", () => {
      expect(response.statusCode).toBe(201);
    });

    it("should return created review with a unique id", () => {
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("user_id", userList[1].id);
      expect(response.body).toHaveProperty("product_id", productList[1].id);
      expect(response.body).toHaveProperty("rating", newReview.rating);
      expect(response.body).toHaveProperty("details", newReview.details);
    });
  });
  describe("PUT /api/users/:user_id/reviews/:review_id", () => {
    let response, token;
    const updatedReview = {
      rating: 5,
      details: "Updated review details for Test Product 1",
    };

    beforeAll(async () => {
      token = createToken(userList[0], JWT);
      response = await request(app)
        .put(`/api/users/${userList[0].id}/reviews/${reviewList0[0].id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updatedReview);
    });

    it("should return status 200", () => {
      expect(response.statusCode).toBe(200);
    });

    it("should return updated review with correct properties", () => {
      expect(response.body).toHaveProperty("id", reviewList0[0].id);
      expect(response.body).toHaveProperty("user_id", userList[0].id);
      expect(response.body).toHaveProperty("product_id", productList[0].id);
      expect(response.body).toHaveProperty("rating", updatedReview.rating);
      expect(response.body).toHaveProperty("details", updatedReview.details);
    });
  });
  describe("DELETE /api/users/:user_id/reviews/:review_id", () => {
    let response, token;

    let reviewList1;
    beforeAll(async () => {
      await createReview({
        user_id: userList[0].id,
        product_id: productList[2].id,
        rating: 3,
        details: "review for product 2 description",
      });
      reviewList1 = await fetchReviewsByProduct(productList[2].id);

      token = createToken(userList[0], JWT);
      response = await request(app)
        .delete(`/api/users/${userList[0].id}/reviews/${reviewList1[1].id}`)
        .set("Authorization", `Bearer ${token}`);
    });

    it("should return status 204", () => {
      expect(response.statusCode).toBe(204);
    });

    it("should not return a body", () => {
      expect(response.body).toEqual({});
    });

    it("should actually delete the review", async () => {
      const reviews = await request(app)
        .get(`/api/products/${productList[2].id}/reviews`)
        .set("Authorization", `Bearer ${token}`);
      const isReviewDeleted = reviews.body.every(
        (review) => review.id !== reviewList1[1].id
      );
      expect(isReviewDeleted).toBe(true);
    });
  });
  // COMMENTS
  describe("GET /api/reviews/:review_id/comments", () => {
    let response;
    beforeAll(async () => {
      response = await request(app).get(
        `/api/reviews/${reviewList0[0].id}/comments`
      );
    });

    it("should return status 200", () => {
      expect(response.statusCode).toBe(200);
    });

    it("should return at least one comment if there are comments", () => {
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return comments with correct properties", () => {
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("user_id");
      expect(response.body[0]).toHaveProperty("review_id");
      expect(response.body[0]).toHaveProperty("text");
    });
  });
  describe("GET /api/users/:user_id/comments", () => {
    let response, token;
    beforeAll(async () => {
      token = createToken(userList[0], JWT);
      response = await request(app)
        .get(`/api/users/${userList[0].id}/comments`)
        .set("Authorization", `Bearer ${token}`);
    });

    it("should return status 200", () => {
      expect(response.statusCode).toBe(200);
    });

    it("should return at least one comment if the user has comments", () => {
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("should return comments with correct properties", () => {
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("user_id", userList[0].id);
      expect(response.body[0]).toHaveProperty("review_id");
      expect(response.body[0]).toHaveProperty("text");
    });
  });
  describe("POST /api/reviews/:review_id/comments", () => {
    let response, token;
    const newComment = {
      text: "This is a new comment for the review",
    };

    beforeAll(async () => {
      token = createToken(userList[1], JWT);
      response = await request(app)
        .post(`/api/reviews/${reviewList0[0].id}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send(newComment);
    });

    it("should return status 201", () => {
      expect(response.statusCode).toBe(201);
    });

    it("should return created comment with correct properties", () => {
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("user_id", userList[1].id);
      expect(response.body).toHaveProperty("review_id", reviewList0[0].id);
      expect(response.body).toHaveProperty("text", newComment.text);
    });
  });
  describe("PUT /api/comments/:comment_id", () => {
    let response, token;
    const updatedComment = {
      text: "Updated comment text",
    };

    beforeAll(async () => {
      token = createToken(userList[0], JWT);
      const comments = await request(app)
        .get(`/api/users/${userList[0].id}/comments`)
        .set("Authorization", `Bearer ${token}`);
      const commentId = comments.body[0].id;
      response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updatedComment);
    });

    it("should return status 200", () => {
      expect(response.statusCode).toBe(200);
    });

    it("should return updated comment with correct properties", () => {
      expect(response.body).toHaveProperty("text", updatedComment.text);
    });
  });
  describe("DELETE /api/comments/:comment_id", () => {
    let response, token;
    let commentId;

    beforeAll(async () => {
      token = createToken(userList[0], JWT);
      const comments = await request(app)
        .get(`/api/users/${userList[0].id}/comments`)
        .set("Authorization", `Bearer ${token}`);
      commentId = comments.body[0].id;
      response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${token}`);
    });

    it("should return status 204", () => {
      expect(response.statusCode).toBe(204);
    });

    it("should actually delete the comment", async () => {
      const comments = await request(app)
        .get(`/api/users/${userList[0].id}/comments`)
        .set("Authorization", `Bearer ${token}`);
      const isCommentDeleted = comments.body.every(
        (comment) => comment.id !== commentId
      );
      expect(isCommentDeleted).toBe(true);
    });
  });

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
  describe("GET /api/auth/me", () => {
    let response, token;

    beforeAll(async () => {
      token = createToken(userList[0], JWT);
      response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
    });

    it("should return status 200", () => {
      expect(response.statusCode).toBe(200);
    });

    it("should return user details", () => {
      expect(response.body).toHaveProperty("id", userList[0].id);
      expect(response.body).toHaveProperty("username", "johndoe");
      expect(response.body).toHaveProperty("email", "johndoe@example.com");
    });
  });
});
