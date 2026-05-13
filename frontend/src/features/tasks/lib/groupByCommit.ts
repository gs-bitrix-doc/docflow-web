import type { TaskSummary } from '../model/types'

export interface TaskCommitGroup {
  id: string
  sha: string | null
  commitMessage: string | null
  authorName: string | null
  authorLogin: string | null
  createdAt: string
  isManual: boolean
  tasks: TaskSummary[]
}

export function groupByCommit(tasks: TaskSummary[]): TaskCommitGroup[] {
  const groups = new Map<string, TaskCommitGroup>()

  for (const task of tasks) {
    const groupId = task.github_sha
      ? `commit:${task.github_sha}`
      : `manual:${task.commit_message ?? 'manual'}:${task.created_at.slice(0, 16)}`

    const existing = groups.get(groupId)
    if (existing) {
      existing.tasks.push(task)
      continue
    }

    groups.set(groupId, {
      id: groupId,
      sha: task.github_sha,
      commitMessage: task.commit_message,
      authorName: task.commit_author_name,
      authorLogin: task.commit_author_login,
      createdAt: task.created_at,
      isManual: task.github_sha == null,
      tasks: [task],
    })
  }

  return Array.from(groups.values())
}
