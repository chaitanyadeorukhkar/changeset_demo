const fs = require("fs");
const path = require("path");
const github = require("@actions/github");
const core = require("@actions/core");
const unified = require("unified");
const remarkParse = require("remark-parse");
const remarkStringify = require("remark-stringify");
const mdastToString = require("mdast-util-to-string");

const context = github.context;
const repo = context.payload.repository;
const owner = repo.owner;

const FILES = new Set();
const gh = github.getOctokit(process.env.GITHUB_TOKEN);

const args = { owner: owner.name || owner.login, repo: repo.name };

function formatLogMessage(msg, obj = null) {
  return obj ? `${msg}: ${toJSON(obj)}` : msg;
}

function debug(msg, obj = null) {
  core.debug(formatLogMessage(msg, obj));
}

function info(msg, obj = null) {
  core.info(formatLogMessage(msg, obj));
}

function toJSON(value, pretty = true) {
  return pretty ? JSON.stringify(value, null, 4) : JSON.stringify(value);
}

function fetchCommitData(commit) {
  args.ref = commit.id || commit.sha;

  debug("Calling gh.repos.getCommit() with args", args);

  return gh.repos.getCommit(args);
}

function getCommits() {
  let commits;

  debug("Getting commits...");

  switch (context.eventName) {
    case "push":
      commits = context.payload.commits;
      break;
    default:
      info(
        'You are using this action on an event for which it has not been tested. Only the "push" events are supported.'
      );
      commits = [];
      break;
  }

  return commits;
}

function filterPackageJson(files) {
  return files.filter((f) => f.match(/package.json$/));
}

function getChangelogEntry(changelog, version) {
  const ast = unified()
    .use(remarkParse)
    .parse(changelog);
  const BumpLevels = {
    dep: 0,
    patch: 1,
    minor: 2,
    major: 3,
  };
  let highestLevel = BumpLevels.dep;

  const nodes = ast.children;
  let headingStartInfo, endIndex;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "heading") {
      const stringified = mdastToString(node);
      const match = stringified.toLowerCase().match(/(major|minor|patch)/);
      if (match !== null) {
        const level = BumpLevels[match[0]];
        highestLevel = Math.max(level, highestLevel);
      }
      if (headingStartInfo === undefined && stringified === version) {
        headingStartInfo = {
          index: i,
          depth: node.depth,
        };
      }
      if (
        endIndex === undefined &&
        headingStartInfo !== undefined &&
        headingStartInfo.depth === node.depth
      ) {
        endIndex = i;
        break;
      }
    }
  }
  if (headingStartInfo) {
    ast.children = ast.children.slice(headingStartInfo.index + 1, endIndex);
  }
  return {
    content: unified()
      .use(remarkStringify)
      .stringify(ast),
    highestLevel,
  };
}

function processOutputs() {
  debug("FILES", Array.from(FILES.values()));
  const allUpdatedPackageJsonPath = filterPackageJson(
    Array.from(FILES.values())
  );
  const updatedPackages = [];
  allUpdatedPackageJsonPath.forEach((packageJsonPath) => {
    const packageDirectory = path.dirname(`./${packageJsonPath}`);
    const packageJson = JSON.parse(
      fs.readFileSync(`${packageDirectory}/package.json`, "utf-8")
    );
    const changelog = fs.readFileSync(
      `${packageDirectory}/CHANGELOG.md`,
      "utf-8"
    );
    const changelogEntry = getChangelogEntry(changelog, packageJson.version);
    updatedPackages.push({
      name: packageJson.name,
      version: packageJson.version,
      changes: changelogEntry.content,
    });
  });

  updatedPackages.forEach(({ name, version, changes }) => {
    gh.repos.createRelease({
      tag_name: `${name}@${version}`,
      name: `${name}@${version}`,
      body: changes,
      ...context.repo,
    });
  });
}

function processCommitData(result) {
  debug("Processing API Response", result);

  if (!result || !result.data) {
    return;
  }

  result.data.files.forEach((file) => {
    FILES.add(file.filename);
  });
}

function createRelease() {
  let commits = getCommits();
  // Exclude merge commits
  commits = commits.filter((c) => !c.parents || c.parents.length === 1);

  commits = commits.filter((c) => c.distinct);

  Promise.all(commits.map(fetchCommitData))
    .then((data) => data.map(processCommitData))
    .then(processOutputs)
    .then(() => (process.exitCode = 0))
    .catch((err) => core.error(err) && (process.exitCode = 1));
}

module.exports = createRelease;
