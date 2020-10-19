import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const token = core.getInput("github-token", { required: true });
    const ref = process.env.GITHUB_REF;

    core.debug(JSON.stringify(ref));

    const { pull_request: pr } = github.context.payload;
    if (!pr) {
      throw new Error("Event payload missing `pull_request`");
    }

    const client = github.getOctokit(token);
    core.debug(`Creating approving review for pull request #${pr.number}`);
    const pr_data = await client.pulls.get({
      pull_number: pr.number,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo
    });
    core.debug(JSON.stringify(pr_data.data));
    // pr_data.data.base.ref

    if (/^(hotfix|release)/.test(pr_data.data.head.ref)) {
      await client.pulls.createReview({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pr.number,
        event: "APPROVE"
      });
      core.debug(`Approved pull request #${pr.number}`);
    } else {
      await client.pulls.createReview({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        pull_number: pr.number,
        event: "COMMENT",
        comments: [{
          body: "Il faut faire valider par un humain",
          path: "",
          position: 1
        }]
      });
      core.debug(`Not Approved pull request #${pr.number}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
