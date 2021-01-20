const core = require("@actions/core");
const github = require("@actions/github");

const context = github.context;
console.log("Log ~ file: updateStuff.js ~ line 5 ~ context", context);
console.log("argv", process.argv);
