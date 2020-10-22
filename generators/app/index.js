const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const axios = require('axios').default;

const pkg = require('../../package.json');

const orgName = 'boringcodes';
const repoName = '.github';
const getApiUrl = (type, sha) => {
  const ghApiUrl = 'https://api.github.com';

  return `${ghApiUrl}/repos/${orgName}/${repoName}/git/${type}/${sha}`;
};
const findWorkflowsFromTree = (tree) => {
  return tree.find(
    ({ path, type }) => path === 'workflow-templates' && type === 'tree',
  );
};

module.exports = class extends Generator {
  async prompting() {
    this.log(yosay(`Welcome to the ${chalk.red(pkg.name)} generator!`));

    console.log(
      chalk.greenBright(
        `Checking https://github.com/${orgName}/${repoName} repo...\n`,
      ),
    );
    const { data: rootDir } = await axios.get(getApiUrl('trees', 'master'));
    const { sha } = findWorkflowsFromTree(rootDir.tree);
    const { data: workflowsDir } = await axios(getApiUrl('trees', sha));

    const prompts = [
      {
        type: 'list',
        name: 'elementSelectedWorkflow',
        message: 'Please select the workflow you want to add?',
        choices: workflowsDir.tree
          .filter((item) => /\.yml$/.exec(item.path))
          .map((item) => ({
            name: item.path,
            value: item,
          })),
      },
    ];

    const props = await this.prompt(prompts);
    this.props = props;
  }

  async writing() {
    const { data: workflowFile } = await axios(
      getApiUrl('blobs', this.props.elementSelectedWorkflow.sha),
    );

    this.fs.write(
      `.github/workflows/${this.props.elementSelectedWorkflow.path}`,
      Buffer.from(workflowFile.content, 'base64').toString('utf-8'),
    );
  }
};
