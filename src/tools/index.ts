import { serverInfoDef } from './serverInfo.js';
import { serverHealthDef } from './serverHealth.js';
import { gitValidateDef } from './gitValidate.js';
import { gitStatusDef } from './gitStatus.js';
import { workflowSuggestDef } from './workflowSuggest.js';
import { workflowRunDef } from './workflowRun.js';
import { serverConfigDef } from './serverConfig.js';
import { gitSimulateDef } from './gitSimulate.js';
import { gitRulesPolicyDef } from './gitPolicy.js';
import { gitHooksInstallDef } from './gitHooksInstall.js';
import { gitRulesPolicyMarkdownDef } from './gitPolicyMarkdown.js';

export const toolDefinitions = [
  serverInfoDef,
  serverHealthDef,
  gitValidateDef,
  gitStatusDef,
  workflowSuggestDef,
  workflowRunDef,
  serverConfigDef,
  gitSimulateDef,
  gitRulesPolicyDef,
  gitHooksInstallDef,
  gitRulesPolicyMarkdownDef
];
