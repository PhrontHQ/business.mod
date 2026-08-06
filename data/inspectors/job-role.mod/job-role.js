var Component = require("mod/ui/component").Component;

const Deliverable = require("../../model/deliverable").Deliverable;
const Process = require("../../model/process").Process;
const JobRoleCollaboration = require("../../model/job-role-collaboration").JobRoleCollaboration;


exports.JobRole = class JobRole extends Component {

  
    
    enterDocument(firstTime) {
        if (firstTime) {
            if (!this.data){
                throw new Error("Role context is required for JobRole inspector");
            }
        }
    }

    handleAddProcessAction() {
        if (!this.data.processes) {
            this.data.processes = [];
        }
        this.data.processes.push(this.application.mainService.createDataObject(Process));
    }
    handleAddCollaborationAction() {
        if (!this.data.collaborations) {
            this.data.collaborations = [];
        }
        this.data.collaborations.push(this.application.mainService.createDataObject(JobRoleCollaboration));
    }
    handleAddDeliverableAction() {
        if (!this.data.deliverables) {
            this.data.deliverables = [];
        }
        this.data.deliverables.push(this.application.mainService.createDataObject(Deliverable));
    }
};
