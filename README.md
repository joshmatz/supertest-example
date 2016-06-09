# Express Integration Testing with SuperTest

Put down that REST Client (or, *gasp*, the browser!) you're using to test that API you're developing and back away slowly! There's a better way! With SuperTest there's no need to verify your API by hand with those tools and using it will give you integration tests for virtually free. Now you can test AND code new features at the same time.

## App Setup

SuperTest can be used with any server available on your local network (or the Internet), but it also has a super power: giving it an Express server directly. The server need not even be running! When developing, we often use tools like [nodemon](https://github.com/remy/nodemon) to automatically restart our node servers. Combine Express with SuperTest and instead of restarting your server you could automatically run your tests to verify your changes. Don't want to run all your tests? Use Mocha's `.only` specifier. There's a lot of flexibility, we just have to set it up.

(I've set up a [GitHub project](https://github.com/joshmatz/supertest-example) with the code if you'd like to skip the explanations.)

### Creating the project and installing dependencies

To get started create a new directory and navigate into it:

`mkdir integration-tests && cd $_`

Run `npm init`. When it asks for a test command, enter `mocha '**/*.spec.js'`. We'll use this later. Feel free to answer other prompts however you'd prefer. Next, install the Express goodies:

`npm i express supertest chai --s`

Excellent work!

### Establishing working tests

We're going to start with a barebones Express server just so we can verify our architecture works like we're intending. To do this we'll create our server and tests in separate files.

Create your server file `touch server.js` and copy and paste this into it:

```
var express = require('express');

var app = new express();

// Just to test our server is working
app.get('/api', function(req, res) {
  res.send({
    version: '1.0.0'
  });
});

module.exports = app;
```

The above code simply pulls in express, creates a new instance of it and gives us an endpoint to access: `/api`. You'll note there's no server being started. That's because it's unnecessary with SuperTest! Realistically you'll use something like `app.listen()` and that will be A-OK to do, it won't interfere with SuperTest. 

Next, create your tests file `touch tests.spec.js` and copy and paste this into it:

```
var app = require('./server');
var chai = require('chai');
var request = require('supertest');

var expect = chai.expect;

describe('API Tests', function() {
  it('should return version number', function(done) {
    request(app)
      .get('/api')
      .end(function(err, res) {
        expect(res.body.version).to.be.ok;
        expect(res.statusCode).to.be.equal(200);
        done();
      });
  });
});
```

Fantastic job! Reviewing the above code, we'll see that we're importing our server, Chai and SuperTest. SuperTest includes its own `.expect()` but I prefer Chai's syntax. The code sets a group of API Tests and creates one test to check if the endpoint `/api` returns a version number. Note that the `done()` function is important to declare these asynchronous tests complete.

Now, let's see if it works. Run: `npm test`. You should get this:

```
» npm test

> integration-tests@1.0.0 test /Users/joshmatz/Projects/integration-tests
> mocha '**/*.spec.js'

  API tests
    ✓ should have return version number

  1 passing (41ms)
```

Huzzah! We have tests verifying our API will work. Next up? Adding some more complex testing.

## Advanced Testing

So we have some integration tests being run against our newly created Express server. That's fine, I guess. But let's get a little more complex by adding some faux-authentication endpoints that validate parameters and return errors under different circumstances. 

To get more complex, let's add the [express-validator](https://github.com/ctavan/express-validator) package. It requires the [Express body-parser](https://github.com/expressjs/body-parser) package, so we'll install and save both: `npm i express-validator bodyparser --save`

### Faux-authentication

All right, to keep it simple — and not add silly complications like passwords — we're going to store a list of users in memory in an array. This array will reset every time our server is started. We'll create an `/api/register` endpoint that pushes a user into the array and we'll create an `/api/login` endpoint that returns us an item from that array. We'll require some validation on these endpoints to ensure a valid user is created upon registration and a valid user is being requested upon login.

Let's get started. First, copy and paste this code right below `var app = new express();` in your `server.js` file: 

```
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
```

This code establishes the `users` array we'll be using, connects the required `bodyParser` (importantly done before `expressValidator`), and then connects `expressValidator` and creates a custom validator method to check if a user exists.

Now that we've got those out of the way, let's add our endpoints below the code we just added:

```
app.post('/api/register', function(req, res) {
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

app.post('/api/login', function(req, res) {
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
```

To recap, we just added two endpoints: `/api/register` and `/api/login`. These two requests will verify that the `req.body.userID` is formatted how we need it. If it's not formatted correctly, we'll return which validation checks failed. If it is formatted correct, we'll return the user.

Next up is the tests to see if this code actually works. Open up your `tests.spec.js` file and add this below our version test:

```
  describe('Registration Tests', function() {
    it('should return the user if the name is valid', function(done) {
      request(app)
      .post('/api/register')
      .send({name: 'JoshMatz'})
      .end(function(err, res) {
        expect(res.body.name).to.be.equal('JoshMatz');
        expect(res.statusCode).to.be.equal(200);
        done();
      });
    });
  });
  
  describe('Login Tests', function() {
    it('should return the user if valid', function(done) {
      request(app)
      .post('/api/login')
      .send({userID: 0})
      .end(function(err, res) {
        expect(res.body.name).to.be.equal('JoshMatz');
        expect(res.statusCode).to.be.equal(200);
        done();
      });
    });
  });
```

This creates tests for our registration and login routes and verifies that the returned data is what we'd expect it to be. Now, when you run `npm test`, you should see something like this:

```
» npm test

> integration-tests@1.0.0 test /Users/joshmatz/Projects/InVision/integration-tests
> mocha '**/*.spec.js'

  API tests
    ✓ should return version number
    Registration Tests
      ✓ should return the user if the name is valid
    Login Tests
      ✓ should return the user if valid

  3 passing (83ms)
```

## Wrapping up

That's it! We've learned how to install SuperTest and connect it to Express so we test against our code quickly and efficiently. You might've noticed that we added validation but we never created tests for it. I'll leave that up to you for a small code challenge. But, if you get stuck, I've included some tests for it in the [GitHub repository](https://github.com/joshmatz/supertest-example). Happy testing!
