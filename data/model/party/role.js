const Role = require("mod/data/model/party/role").Role,
    Montage = require("mod/core/core").Montage;

/**
 * @class Role
 * @extends Party
 */


exports.Role = Role;

Montage.defineProperties(Role.prototype, {
    eventsWithParticipationRole: {
        value: undefined
    }
});
