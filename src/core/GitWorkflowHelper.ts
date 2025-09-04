export class GitWorkflowHelper {
  suggest(task: string) {
    switch(task){
      case 'start_feature':
        return { task, suggestion: 'Create a new feature branch', steps: ['git fetch origin','git checkout -b feature/my-feature origin/main'] };
      case 'finish_feature':
        return { task, suggestion: 'Finish feature by merging to main', steps: ['git checkout main','git pull','git merge feature/my-feature','git push'] };
      case 'sync_main':
        return { task, suggestion: 'Update local main', steps: ['git checkout main','git pull --rebase'] };
      case 'prepare_release':
        return { task, suggestion: 'Tag a release', steps: ['git checkout main','git pull','npm version patch','git push --follow-tags'] };
      default:
        return { task, suggestion: 'Unknown task', steps: [] };
    }
  }

  run(workflow: string) {
    return { workflow, result: 'not_implemented', followUps: [] };
  }
}
