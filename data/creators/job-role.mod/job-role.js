var Component = require("mod/ui/component").Component;

const DataService = require("mod/data/service/data-service").DataService;


exports.JobRole = class JobRole extends Component {

  
    
    enterDocument(firstTime) {
        if (firstTime) {
            if (!this.data){
                throw new Error("Role context is required for JobRole inspector");
            }
        }
    }
};
