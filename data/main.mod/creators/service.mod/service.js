var Component = require("montage/ui/component").Component;

console.debug("This should probably be a DataEditor");

exports.Service = Component.specialize(/** @lends Service# */{
/*
    "canDelete": {"<-": "!@owner.readOnly"},
    "canRevert": {"<-": "(@owner.object.uid == 0) || !@owner.readOnly"},
    "canSave": {"<-": "(@owner.object.uid == 0) || !@owner.readOnly"},
*/

canUserDelete: {
    get: function() {
        return this.application.mainService.canUserDeleteDataObject(this.data);
    }
},
canUserEdit: {
    get: function() {
        return this.application.mainService.canUserEditDataObject(this.data);
    }
},

/*
        Methods called by inspector which this is a controller of: 
 */
save: {
    value: function () {
        return this.application.mainService.saveDataObject(this.data);
    }
},

revert: {
    value: function () {
        return this.application.mainService.resetDataObject(this.data);
    }
},

delete: {
    value: function () {
        return this.application.mainService.deleteDataObject(this.data);
    }
}


});
