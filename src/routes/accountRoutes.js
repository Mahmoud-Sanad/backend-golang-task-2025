const express = require("express");
const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/routeUtils");
const {
  createAccount,
  listAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  loginAccount,
  registerAccount
  , getMe, updateMe
} = require("../handlers/accountHandler");
const { canAccess, isLoggedIn } = require("../middlewares/authMiddleware");

function accountRoutes() {
  const router = express.Router();

  router.post(
    "/login",
    catchAsync(loginAccount)
  );
  router.post("/register", catchAsync(registerAccount));
  router.use(isLoggedIn);
  router.route("/me").get(catchAsync(getMe)).post(catchAsync(updateMe));
  router.post(
    "/",
    canAccess("ADMIN"),
    catchAsync(createAccount)
  );

  router.get(
    "/",
    canAccess("ADMIN"),
    catchAsync(listAccounts)
  );

  router.get(
    "/:id",
    canAccess("ADMIN"),
    catchAsync(getAccount)
  );

  router.put(
    "/:id",
    canAccess("ADMIN"),
    catchAsync(updateAccount)
  );

  router.delete(
    "/:id",
    canAccess("ADMIN"),
    catchAsync(deleteAccount)
  );

  return router;
}

module.exports = accountRoutes;
