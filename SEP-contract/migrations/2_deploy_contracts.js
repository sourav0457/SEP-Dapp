const StudentEventPlannerBallot = artifacts.require("StudentEventPlannerBallot");

module.exports = function(deployer) {
  deployer.deploy(StudentEventPlannerBallot);
};
