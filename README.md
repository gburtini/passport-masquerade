# passport-masquerade

This provides a middleware to allow administrators (or other users -- your implementation defines the permissions) to masquerade as other users.

Masquerading can be done two fundamental ways:

- Swap `req.user` with the false user and hold some `req.realUser`. This means code that touches your user elsewhere does not need to be modified.
- Add a `req.appliedUser` type field and check all uses against it.

This library chooses the first method. Note that this means you likely have to adjust any function that needs to know the genuine user. For most people, this will just mean adjusting the `serializeUser` method.

# Usage

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
  if (allowedToMasquerade(getRealUser())) {
    setMasquerading(someOtherUser);
  }
};

router.post("/masquerade/clear", (req, res) => {
    clearMasquerading();
})
```

Masqueraded users have an additional field called `masqueradingFrom` that contains the original user. Normally, this would be used to show some front end indication that you're masquerading.

# Gotchas

## Adjusting Serialize User

Because we've overwritten req.user, at the end of a request, passport calls serializeUser with the masqueraded user. To handle this, we provide the `getRealUser` method to ensure you don't persist a masquerade state.

```js
passport.serializeUser((potentiallyMasqueradedUser, done) => {
  const user = getRealUser(potentiallyMasqueradedUser);

  done(null, user.id);
});
```
