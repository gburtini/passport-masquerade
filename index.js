// const { get, set } = require("lodash");

const defaultSettings = {
  deserializeMasquerade: i => i,
  serializeMasquerade: i => i
  // variable paths for lodash get.
  //   sessionLocation: "session.masqueradingAs",
  //   realUserLocation: "realUser",
  //   isMasqueradingLocation: "isMasquerading"
};

module.exports = (overrideSettings = {}) => {
  const settings = Object.assign({}, defaultSettings, settings);

  let currentReq = null;
  return {
    middleware: async (req, res, next) => {
      // NOTE: this alone breaks most passport integrations as the deserialize user method needs
      // to consider that the req.user.id is no longer correct.
      currentReq = req;

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
    setMasquerading: as => {
      currentReq.session.masqueradingAs = settings.serializeMasquerade(as);
    },
    clearMasquerading: () => {
      currentReq.session.masqueradingAs = null;
    },
    getRealUser: user => {
      // TODO: does something weird happen here if the user persists user.masqueradeFrom.across serialization?
      if (user === undefined) user = currentReq.user;
      if (!user) return;
      if (user.masqueradingFrom) return user.masqueradingFrom;
      return user;
    }
  };
};
