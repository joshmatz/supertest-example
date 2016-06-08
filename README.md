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

describe('API tests', function() {
  it('should have return version number', function(done) {
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

Fantastic job! 

Now, let's see if it works. Run: `npm test`. You should get this:

```
» npm test

> integration-tests@1.0.0 test /Users/joshmatz/Projects/integration-tests
> mocha '**/*.spec.js'

  API tests
    ✓ should have return version number

  1 passing (41ms)
```

Huzzah! We have tests verifying our API will work.
