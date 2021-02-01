const fs = require("fs");
const path = require("path");
const gitHubActions = require("@actions/github");
const gitHubActionsCore = require("@actions/core");
const unified = require("unified");
const remarkParse = require("remark-parse");
const remarkStringify = require("remark-stringify");
const mdastToString = require("mdast-util-to-string");

const context = gitHubActions.context;
const repo = context.payload.repository;
const owner = repo.owner;
const gitHubOctokit = gitHubActions.getOctokit(process.env.GITHUB_TOKEN);
const args = { owner: owner.name || owner.login, repo: repo.name };

const FILES = new Set();

function getCommits() {
  let commits;

  switch (context.eventName) {
    case "push":
      commits = context.payload.commits;
      break;
    default:
      commits = [];
      break;
  }

  return commits;
}

function fetchCommitData(commit) {
  args.ref = commit.id || commit.sha;

  return gitHubOctokit.repos.getCommit(args);
}

function processCommitData(result) {
  if (!result || !result.data) {
    return;
  }

  result.data.files.forEach((file) => {
    FILES.add(file.filename);
  });
}

function filterPackageJson(files) {
  return files.filter((file) => file.match(/package.json$/));
}

function getChangelogContent(changelog, version) {
  // Parse changelog created by changeset. Reference for this function: https://gitHubActions.com/changesets/action/blob/master/src/utils.ts#L38
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

  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
    const node = nodes[nodeIndex];
    if (node.type === "heading") {
      const stringified = mdastToString(node);
      const match = stringified.toLowerCase().match(/(major|minor|patch)/);
      if (match !== null) {
        const level = BumpLevels[match[0]];
        highestLevel = Math.max(level, highestLevel);
      }
      if (headingStartInfo === undefined && stringified === version) {
        headingStartInfo = {
          index: nodeIndex,
          depth: node.depth,
        };
        // eslint-disable-next-line no-continue
        continue;
      }
      if (
        endIndex === undefined &&
        headingStartInfo !== undefined &&
        headingStartInfo.depth === node.depth
      ) {
        endIndex = nodeIndex;
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

function createReleases() {
  const updatedPackageJsonPaths = filterPackageJson(Array.from(FILES.values()));
  const updatedPackages = [];
  updatedPackageJsonPaths.forEach((packageJsonPath) => {
    const packageDirectory = path.dirname(`./${packageJsonPath}`);
    const packageJson = JSON.parse(
      fs.readFileSync(`${packageDirectory}/package.json`, "utf-8")
    );
    const changelog = fs.readFileSync(
      `${packageDirectory}/CHANGELOG.md`,
      "utf-8"
    );
    const changelogContent = getChangelogContent(
      changelog,
      packageJson.version
    );
    updatedPackages.push({
      name: packageJson.name,
      version: packageJson.version,
      changes: changelogContent.content,
    });
  });

  updatedPackages.forEach(({ name, version, changes }) => {
    gitHubOctokit.repos.createRelease({
      tag_name: `${name}@${version}`,
      name: `${name}@${version}`,
      body: changes,
      ...context.repo,
    });
  });
}

function release() {
  let commits = getCommits();
  // Exclude merge commits
  commits = commits.filter((c) => !c.parents || c.parents.length === 1);

  return Promise.all(commits.map(fetchCommitData))
    .then((data) => data.map(processCommitData))
    .then(createReleases)
    .then(() => (process.exitCode = 0))
    .catch((err) => gitHubActionsCore.setFailed(err) && (process.exitCode = 1));
}

module.exports = release;
