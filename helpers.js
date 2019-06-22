module.exports = (settings, context) => ({
  masqueradeEndpoint: async function(req, res, next) {
    const id = req.params.id;
    if (!id) {
      // unmasquerade if no ID is provided.
      context.clearMasquerading(req);
      return res.json(settings.successResponse);
    }

    if (!settings.canMasquerade(context.getRealUser(req.user), id)) {
      return res.json(settings.failureResponse);
    }

    context.setMasquerading(req, id);
    return res.json(settings.successResponse);
  },

  serializeUser: (potentiallyMasqueradedUser, done) => {
    const user = context.getRealUser(potentiallyMasqueradedUser);
    done(null, user.id);
  },

  deserializeUser: async (id, done) => {
    try {
      const user = await settings.getUserById(id);
      done(null, user);
    } catch (e) {
      done(e);
    }
  }
});
