import { GitRulesEnforcer } from '../core/GitRulesEnforcer.js';
import { GitWorkflowHelper } from '../core/GitWorkflowHelper.js';

export const enforcer = new GitRulesEnforcer();
export const workflowHelper = new GitWorkflowHelper();
