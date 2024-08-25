const pg = require("pg");
const client = new pg.Client(
  process.env.NODE_ENV === "test"
    ? process.env.DATABASE_URL_TEST ||
      "postgres://localhost/acme_review_db_test"
    : process.env.DATABASE_URL || "postgres://localhost/acme_review_db"
);

module.exports = { client };
