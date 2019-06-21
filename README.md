# passport-masquerade

This provides a middleware to allow administrators (or other users -- your implementation defines the permissions) to masquerade as other users, for example, to implement a "god view."

From a design perspective, masquerading could be done two fundamental ways:

- Swap `req.user` with the temporary user and store some `req.realUser`. This means code that touches your user elsewhere does not need to be modified.
- Add a `req.appliedUser` type field and check all uses against it. This has the advantage of not contaminating your authentication flow.

This library chooses the first method. Note that this means you likely have to adjust any function that needs to know the genuine user.

Masqueraded users have an additional field called `masqueradingFrom` that contains the original user. This may be used, for example, to show some front end indication that you're masquerading.

# Opinionated Usage

There's a `helpers` object that provides mock versions of all the integration you need. See [helpers.js](helpers.js).

```js
const passportMasquerade = require("passport-masquerade");
const {
  middleware,
  helpers
} = passportMasquerade({
    getUserById: (id) => return {
        id,
        name: "Fake User"
    },
    canUserMasquerade: (user, requestedId) => {
        return true;
    }
});

// ...

passport.use(middleware)
passport.deserializeUser(helpers.deserializeUser);
passport.serializeUser(helpers.serializeUser);

// ...

router.post("/masquerade/:id", helpers.masqueradeEndpoint);

```

The helpers are very opinionated, requiring, for example, fields like ":id", full user objects and JSON response blobs. As such, the raw functionality is exposed as follows.

# Raw Usage

```js
const passportMasquerade = require("passport-masquerade");
const {
  middleware,
  setMasquerading,
  clearMasquerading,
  getRealUser
} = passportMasquerade({
  serializeMasquerade: i => i,
  deserializeMasquerade: i => i
});

passport.use(middleware);

// ...

router.post("/masquerade/:id", (req, res) => {
  if (allowedToMasquerade(getRealUser(req.user))) {
    setMasquerading(req, someOtherUser);
  }
};

router.post("/masquerade/clear", (req, res) => {
    clearMasquerading(req);
})
```

# Gotchas

## Adjusting Serialize User

Because we've overwritten req.user, at the end of a request, passport calls serializeUser with the masqueraded user. To handle this, we provide the `getRealUser` method to ensure you don't persist a masquerade state.

```js
passport.serializeUser((potentiallyMasqueradedUser, done) => {
  const user = getRealUser(potentiallyMasqueradedUser);

  done(null, user.id);
});
```

The helper version of serializeUser handles this for you.

# License

Copyright 2019 Giuseppe Burtini. MIT License.
