import { http, HttpResponse } from 'msw'
import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { setUser } from '@/features/auth/model/authSlice'
import { TaskListPage } from '@/features/tasks/ui/TaskListPage'
import { createAppStore } from '@/shared/store'
import { server } from '../msw/server'
import { renderWithProviders } from '../utils/renderWithProviders'

describe('TaskListPage', () => {
  it('renders grouped tasks from the api response', async () => {
    server.use(
      http.get('/api/projects', () =>
        HttpResponse.json([
          {
            id: 'project-1',
            name: 'CRM Docs',
            source_repo: 'team/docs-ru',
            source_branch: 'main',
            target_repo: 'team/docs-en',
            target_branch: 'main',
            exclude_patterns: [],
            webhook_url: 'http://localhost:8000/webhook/project-1',
            version: 1,
            created_at: '2026-05-10T09:00:00Z',
          },
        ]),
      ),
      http.get('/api/health', () =>
        HttpResponse.json({
          status: 'ok',
          pipeline_version: 'abc1234',
          last_webhook_at: '2026-05-12T10:00:00Z',
        }),
      ),
      http.get('/api/analytics', () =>
        HttpResponse.json({
          done: 1,
          failed: 0,
          published: 0,
          running: 1,
        }),
      ),
      http.get('/api/tasks', () =>
        HttpResponse.json({
          items: [
            {
              id: 'task-1',
              project_id: 'project-1',
              project_name: 'CRM Docs',
              file_path: 'docs/deals/index.md',
              github_sha: 'abcdef123456',
              commit_message: 'Update deals docs',
              commit_author_name: 'Anna',
              commit_author_login: 'anna',
              status: 'done',
              current_stage: null,
              created_at: '2026-05-12T09:50:00Z',
              completed_at: '2026-05-12T09:55:00Z',
              updated_at: '2026-05-12T09:55:00Z',
            },
            {
              id: 'task-2',
              project_id: 'project-1',
              project_name: 'CRM Docs',
              file_path: 'docs/deals/list.md',
              github_sha: 'abcdef123456',
              commit_message: 'Update deals docs',
              commit_author_name: 'Anna',
              commit_author_login: 'anna',
              status: 'running',
              current_stage: 'pipeline',
              created_at: '2026-05-12T09:57:00Z',
              completed_at: null,
              updated_at: '2026-05-12T09:57:00Z',
            },
          ],
          total: 2,
          limit: 50,
          offset: 0,
        }),
      ),
    )

    const store = createAppStore()
    store.dispatch(
      setUser({
        id: 'user-1',
        email: 'anna@example.com',
        display_name: 'Anna',
        github_linked: true,
        github_login: 'anna',
      }),
    )

    renderWithProviders(
      <MemoryRouter>
        <TaskListPage />
      </MemoryRouter>,
      { store },
    )

    expect(await screen.findByRole('heading', { name: 'Задачи' })).toBeInTheDocument()
    expect(await screen.findByText('Update deals docs')).toBeInTheDocument()
    expect(
      screen.getAllByText(
        (_, element) => element?.textContent?.includes('docs/deals/index.md') ?? false,
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('CRM Docs').length).toBeGreaterThan(0)
    expect(screen.getByText(/Опубликовать все/i)).toBeInTheDocument()
  })

  it('renders filtered empty state when there are no tasks for the current filter', async () => {
    server.use(
      http.get('/api/projects', () => HttpResponse.json([])),
      http.get('/api/health', () =>
        HttpResponse.json({
          status: 'ok',
          pipeline_version: 'abc1234',
          last_webhook_at: null,
        }),
      ),
      http.get('/api/analytics', () =>
        HttpResponse.json({
          done: 0,
          failed: 0,
          published: 0,
          running: 0,
        }),
      ),
      http.get('/api/tasks', () =>
        HttpResponse.json({
          items: [],
          total: 0,
          limit: 50,
          offset: 0,
        }),
      ),
    )

    const store = createAppStore()
    store.dispatch(
      setUser({
        id: 'user-1',
        email: 'anna@example.com',
        display_name: 'Anna',
        github_linked: true,
        github_login: 'anna',
      }),
    )

    renderWithProviders(
      <MemoryRouter initialEntries={['/tasks?status=failed']}>
        <TaskListPage />
      </MemoryRouter>,
      { store },
    )

    expect(await screen.findByText('По этим фильтрам задач нет')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeInTheDocument()
  })
})
