var express = require('express');
var expressValidator = require('express-validator');
var bodyParser = require('body-parser');

var app = new express();
var authRouter = express.Router();
var users = [];

// Required to get access to `req.body`.
app.use(bodyParser.json());

// Connects expressValidator so it can transform the req object.
app.use(expressValidator({
  customValidators: {
    isExistingUser: function(value) {
      return !!users[value];
    }
  }
}));

// Just to test our server is working
app.get('/api', function(req, res) {
  res.send({
    version: '1.0.0'
  });
});

// Auth routes
authRouter.post('/register', function(req, res) {
  req.checkBody({
    name: {
      isAlpha: true,
      isLength: {
        options: [{ min: 2, max: 50 }],
        errorMessage: 'Name must be between 2 and 50 characters.'
      },
      errorMessage: 'Name must have only alphabetical characters.'
    }
  });

  var errors = req.validationErrors();

  if (errors) {
    return res.status(400).json({
      errors: errors
    });
  }

  var userIndex = users.push(req.body) - 1;

  res.json(users[userIndex]);
});

authRouter.post('/login', function(req, res) {
  req.checkBody({
    userID: {
      isNumeric: true,
      isExistingUser: {
        errorMessage: 'That user does not exist.'
      },
      errorMessage: 'Authentication requires a number.'
    }
  });

  var errors = req.validationErrors();

  if (errors) {
    return res.status(400).json({
      errors: errors
    });
  }

  res.json(users[req.body.userID]);
});

app.use('/api', authRouter);

module.exports = app;
