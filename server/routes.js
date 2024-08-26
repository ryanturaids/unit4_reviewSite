const express = require("express");
const router = express.Router();
const {
  fetchUsers,
  createUser,
  fetchProducts,
  createProduct,
  authenticate,
  findUserByToken,
  createReview,
  updateReview,
  deleteReview,
  fetchReviewsByProduct,
  fetchReviewsByUser,
  createComment,
  updateComment,
  deleteComment,
  fetchCommentsByReview,
  fetchCommentsByUser,
} = require("./db/models");

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    req.user = await findUserByToken(token);
    next();
  } catch (error) {
    next(error);
  }
};

// AUTHENTICATION
router.post("/auth/login", async (req, res, next) => {
  try {
    res.send(await authenticate(req.body));
  } catch (error) {
    next(error);
  }
});
router.get("/auth/me", isLoggedIn, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

// USERS
router.get("/users", async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (error) {
    next(error);
  }
});
router.post("/users", async (req, res, next) => {
  try {
    const newUser = await createUser(req.body);
    if (newUser) {
      res.status(201).json(newUser);
    } else {
      res.status(400).json({ error: "Failed to create user" });
    }
  } catch (error) {
    next(error);
  }
});

// PRODUCTS
router.get("/products", async (req, res, next) => {
  try {
    res.send(await fetchProducts());
  } catch (error) {
    next(error);
  }
});
router.post("/products", async (req, res, next) => {
  try {
    const newProduct = await createProduct(req.body);
    if (newProduct) {
      res.status(201).json(newProduct);
    } else {
      res.status(400).json({ error: "Failed to create product" });
    }
  } catch (error) {
    next(error);
  }
});

// REVIEWS
router.get("/products/:product_id/reviews", async (req, res, next) => {
  try {
    const product_id = req.params.product_id;
    const reviews = await fetchReviewsByProduct(product_id);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});
router.get("/users/:user_id/reviews", isLoggedIn, async (req, res, next) => {
  try {
    const user_id = req.user.id;

    if (req.params.user_id !== user_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const reviews = await fetchReviewsByUser({ user_id });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});
router.post(
  "/products/:product_id/reviews",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const user_id = req.user.id;
      const product_id = req.params.product_id;
      const { rating, details } = req.body;

      const newReview = await createReview({
        user_id,
        product_id,
        rating,
        details,
      });
      if (newReview) {
        res.status(201).json(newReview);
      } else {
        res.status(400).json({ error: "Failed to create review" });
      }
    } catch (error) {
      next(error);
    }
  }
);
router.put(
  "/users/:user_id/reviews/:review_id",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const user_id = req.user.id;
      const review_id = req.params.review_id;
      const { rating, details } = req.body;

      if (req.params.user_id !== user_id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updatedReview = await updateReview({
        review_id,
        user_id,
        rating,
        details,
      });
      res.json(updatedReview);
    } catch (error) {
      next(error);
    }
  }
);
router.delete(
  "/users/:user_id/reviews/:review_id",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const user_id = req.user.id;
      const review_id = req.params.review_id;

      if (req.params.user_id !== user_id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await deleteReview({ review_id, user_id });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// COMMENTS
router.get("/reviews/:review_id/comments", async (req, res, next) => {
  try {
    const { review_id } = req.params;
    const comments = await fetchCommentsByReview({ review_id });
    res.json(comments);
  } catch (error) {
    next(error);
  }
});
router.get("/users/:user_id/comments", isLoggedIn, async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const comments = await fetchCommentsByUser({ user_id });
    res.json(comments);
  } catch (error) {
    next(error);
  }
});
router.post(
  "/reviews/:review_id/comments",
  isLoggedIn,
  async (req, res, next) => {
    try {
      const { text } = req.body;
      const { review_id } = req.params;
      const user_id = req.user.id;

      const newComment = await createComment({ user_id, review_id, text });
      res.status(201).json(newComment);
    } catch (error) {
      next(error);
    }
  }
);
router.put("/comments/:comment_id", isLoggedIn, async (req, res, next) => {
  try {
    const { text } = req.body;
    const { comment_id } = req.params;
    const user_id = req.user.id;

    const updatedComment = await updateComment({ comment_id, user_id, text });
    res.json(updatedComment);
  } catch (error) {
    next(error);
  }
});
router.delete("/comments/:comment_id", isLoggedIn, async (req, res, next) => {
  try {
    const { comment_id } = req.params;
    const user_id = req.user.id;

    await deleteComment({ comment_id, user_id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
