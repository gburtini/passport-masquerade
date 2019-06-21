// const { get, set } = require("lodash");

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
  const settings = Object.assign({}, defaultSettings, settings);

  return {
    middleware: async (req, res, next) => {
      if (req.session.masqueradingAs) {
        const realUser = req.user;

        req.user = await settings.deserializeMasquerade(
          req.session.masqueradingAs
        );

        if (typeof req.user !== "object") {
          throw new Error(
            "Your req.user object (deserialized user) must be an object for passport-masquerade to work."
          );
        }
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
      // TODO: does something weird happen here if the user persists user.masqueradeFrom.across serialization?
      if (!user) return;
      if (user.masqueradingFrom) return user.masqueradingFrom;
      return user;
    },

    helpers: helpers(settings, this)
  };
};
