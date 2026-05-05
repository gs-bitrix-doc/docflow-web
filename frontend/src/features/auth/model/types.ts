export interface UserRead {
  id: string
  email: string
  display_name: string | null
  github_linked: boolean
  github_login: string | null
}
