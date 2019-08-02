const helpers = require("./helpers");

const defaultSettings = {
  deserializeMasquerade: i => i,
  serializeMasquerade: i => i,

  // only used for the helpers
  successResponse: { status: "success" },
  failureResponse: { status: "failure" },
  getUserById: id => {
    throw new Error(
      "Please provide getUserById to passport-masquerade to use the helper."
    );
  },
  canUserMasquerade: (realUser, requestedId) => {
    throw new Error(
      "Please provide canUserMasquerade to passport-masquerade to use the helper."
    );
  }
};

module.exports = (overrideSettings = {}) => {
  const settings = Object.assign({}, defaultSettings, overrideSettings);

  const context = {
    middleware: async (req, _, next) => {
      if (req.session.masqueradingAs) {
        const realUser = req.user;

        req.user = await settings.deserializeMasquerade(
          req.session.masqueradingAs
        );

        req.user.masqueradingFrom = realUser;
        req.isMasquerading = true;
      }

      next();
    },
    setMasquerading: (req, as) => {
      req.session.masqueradingAs = settings.serializeMasquerade(as);
    },
    clearMasquerading: req => {
      req.session.masqueradingAs = null;
    },
    getRealUser: user => {
      if (!user) return;
      if (user.masqueradingFrom) return user.masqueradingFrom;
      return user;
    },
  };

  return {
    ...context,
    helpers: helpers(settings, context),
  };
};

