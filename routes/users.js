var express = require("express");
var router = express.Router();
const { csrfProtection, asyncHandler } = require("./utils");
const { userValidators, loginValidators } = require("./utils");
const db = require("../db/models");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { loginUser, logoutUser, requireAuth } = require('../auth');

/* GET users listing. */
router.get("/",
requireAuth,
function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/sign-up",
requireAuth,
csrfProtection, 
(req, res) => {
  const user = db.User.build();
  res.render("sign-up-form", {
    title: "New User",
    user,
    csrfToken: req.csrfToken(),
  });
});

router.post(
  "/sign-up",
  csrfProtection,
  userValidators,
  requireAuth,
  asyncHandler(async (req, res) => {
    const { username, email, birthdate, gender, fullName, password } = req.body;
    console.log(username, email, birthdate);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.User.create({
      username,
      email,
      birthdate,
      gender,
      fullName,
      hashedPassword,
    });

    const validatorErrors = validationResult(req);
    if (validatorErrors.isEmpty()) {
      loginUser(req, res, user);
      return req.session.save(() => {
        res.redirect('/');
      });
    } else {
      const errors = validatorErrors.array().map((error) => error.msg);
      res.render("sign-up-form", {
        title: "New User",
        user,
        errors,
        csrfToken: req.csrfToken(),
      });
    }
  })
);

router.get('/login',
requireAuth,
csrfProtection, 
(req, res) => {
  res.render('log-in-form', { title: 'Login', csrfToken: req.csrfToken() });
});

router.post('/login',
requireAuth,
 csrfProtection, loginValidators, asyncHandler(async (req, res) => {
  const {
    username,
    password
  } = req.body;

  let errors = [];

  const validatorErrors = validationResult(req);

  if (validatorErrors.isEmpty()) {
    const user = await db.User.findOne({ 
      where: {
        username
      }
    });
    if(user!== null) {
      const passwordMatched = await bcrypt.compare(password, user.hashedPassword.toString());
      if(passwordMatched) {
        loginUser(req, res, user);
        return req.session.save(() => {
          res.redirect('/');
        });
      }
    }
    errors.push('Login failed for the provided username and password.');
  } else {
    errors = validatorErrors.array().map((error) => error.msg);
  }
    res.render('user-login', {
      title: 'Login',
      username,
      errors,
      csrfToken: req.csrfToken(),
    });
}));

router.post('/logout',
requireAuth,
(req, res) => {
  logoutUser(req, res);
  res.redirect('/');
});


router.post("/");
module.exports = router;