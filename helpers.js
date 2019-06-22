module.exports = (settings, context) => ({
  masqueradeEndpoint: async function(req, res) {
    const id = req.params.id;

    if (!settings.canMasquerade(context.getRealUser(req.user), id)) {
      return res.json(settings.failureResponse);
    }

    context.setMasquerading(req, id);
    return res.json(settings.successResponse);
  },

  unmasqueradeEndpoint: async function(req, res) {
    context.clearMasquerading(req);
    return res.json(settings.successResponse);
  },

  serializeUser: (potentiallyMasqueradedUser, done) => {
    try {
      const user = context.getRealUser(potentiallyMasqueradedUser);
      done(null, user.id);
    } catch (e) {
      done(e);
    }
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
