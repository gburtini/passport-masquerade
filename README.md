# passport-masquerade

This provides a middleware to allow administrators (or other users - your implementation defines the permissions) to masquerade as other users, for example, to implement a "god view."

From a design perspective, masquerading could be done two fundamental ways:

- Swap `req.user` with the temporary user and store some `req.realUser`. This means code that touches your user elsewhere does not need to be modified.
- Add a `req.appliedUser` type field and check all uses against it. This has the advantage of not contaminating your authentication flow.

This library chooses the first method. Note that this means you likely have to adjust any function that needs to know the genuine user.

Masqueraded users have an additional field called `masqueradingFrom` that contains the original user. This may be used, for example, to show some front end indication that you're masquerading.

# Dependencies

A passport `session` implementation must be available.

# Opinionated Usage

There's a `helpers` object that provides an approach to the integration. See [helpers.js](helpers.js).

```js
const passportMasquerade = require("passport-masquerade");
const { middleware, helpers } = passportMasquerade({
  getUserById: id => ({
    id,
    name: "Fake User"
  }),
  canUserMasquerade: (user, requestedId) => {
    // `user` is the current real user.
    // `requestedId` is who the uesr is asking to masquerade as.
    return true;
  }
});

// ...

passport.use(middleware);
passport.deserializeUser(helpers.deserializeUser);
passport.serializeUser(helpers.serializeUser);

// ...

router.post("/masquerade/clear", helpers.unmasqueradeEndpoint);
router.post("/masquerade/:id", helpers.masqueradeEndpoint);
```

The helpers are opinionated, requiring, for example, fields like `:id`, full user objects and JSON response blobs. As such, the raw functionality is exposed as follows.

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

router.post("/masquerade/clear", (req, res) => {
    clearMasquerading(req);
});

router.post("/masquerade/:id", (req, res) => {
  if (allowedToMasquerade(getRealUser(req.user))) {
    setMasquerading(req, someOtherUser);
  }
};
```

As appropriate for your use case, you can mix-and-match the opinionated `helpers` implementation and the less opinionated raw functions.

# Gotchas

## Adjusting Serialize User

At the end of a request, passport will call `serializeUser` with the masqueraded user. To handle this, we provide the `getRealUser` method to ensure you don't persist a masqueraded state.

```js
passport.serializeUser((potentiallyMasqueradedUser, done) => {
  const user = getRealUser(potentiallyMasqueradedUser);

  done(null, user.id);
});
```

The helper version of `serializeUser` handles this for you. If you were to persist your masqueraded user, you will lose your underlying real user session and the behavior should be considered undefined. Open to PRs that improve detection of this behavior to ease developer surprise.

## Deserialized users should be (mutable) objects.

This is normally the case, though if you are storing a simple string or ID as a deserialized user, we throw an error.

Specifically, they need to support tacking on the `masqueradedFrom` key. Open to PRs that generalize this behavior to support other `user` styles.

If you cannot return a valid user from a requested deserialization, you should throw.

# License

Copyright 2019 Giuseppe Burtini. MIT License.
