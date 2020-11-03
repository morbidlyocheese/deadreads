const csrf = require("csurf");
const { check } = require("express-validator");
const db = require("../db/models");

const csrfProtection = csrf({ cookie: true });

const asyncHandler = (handler) => (req, res, next) =>
  handler(req, res, next).catch(next);

const userValidators = [
  check("username")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a valid username."),
  check("email")
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage("Please provide a valid email.")
    .custom((value) => {
      return db.User.findOne({ where: { email: value } }).then(
        (user) => {
          if (user) {
            return Promise.reject(
              "The provided Email Address is already in use by another account"
            );
          }
        }
      );
    }),
  check("password")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a valid password."),
  check("confirmPassword")
    .exists({ checkFalsy: true })
    .withMessage("Passwords must match.")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Confirm Password does not match Password");
      }
      return true;
    }),
  check("gender").exists({ checkFalsy: true }),
  check("birthdate").exists({ checkFalsy: true }),
];

const loginValidators = [
  check('username')
    .exists({ checkFalsy: true })
    .withMessage('PLease provide a valid username.'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('PLease provide a valid password.'),
];

module.exports = { csrfProtection, asyncHandler, userValidators, loginValidators };
