import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { createContext } from 'react'
import { vi, expect } from 'vitest'

// Mock data for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  nickname: 'testuser',
  member_role: 'member',
  sys_role: 'user',
  tenant_id: 'test-tenant-id',
}

export const mockProject = {
  id: 'test-project-id',
  name: 'Test Project',
  description: 'A test project',
  tenant_id: 'test-tenant-id',
  can_manage_teams: true,
  can_manage_releases: true,
  can_manage_members: true,
  can_manage_targets: true,
  is_ready_to_releases: true,
}

export const mockTeam = {
  id: 'test-team-id',
  name: 'Test Team',
  description: 'A test team',
  tenant_id: 'test-tenant-id',
  project_id: 'test-project-id',
}

export const mockRelease = {
  id: 'test-release-id',
  name: 'Test Release',
  target_date: '2024-12-31',
  state: 'pending',
  platform_update: false,
  config_update: false,
  tenant_id: 'test-tenant-id',
  project_id: 'test-project-id',
  is_ready: false,
  is_deployed: false,
}

export const mockFeature = {
  id: 'test-feature-id',
  release_id: 'test-release-id',
  name: 'Test Feature',
  description: 'A test feature',
  jira_ticket: 'TEST-123',
  is_platform: false,
  is_config: false,
  is_ready: false,
  dri_member_id: 'test-member-id',
  project_id: 'test-project-id',
  comments: 'Test comments',
}

export const mockMember = {
  id: 'test-member-id',
  user_id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test Member',
  nickname: 'testmember',
  member_role: 'member',
  tenant_id: 'test-tenant-id',
  project_id: 'test-project-id',
}

export const mockTarget = {
  id: 'test-target-id',
  short_name: 'TEST',
  name: 'Test Target',
  is_live: false,
  tenant_id: 'test-tenant-id',
  project_id: 'test-project-id',
}

// Mock contexts for testing
const MockAuthContext = createContext<any>(null)
const MockSidebarContext = createContext<any>(null)

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContextValue?: {
    user: typeof mockUser | null
    loading: boolean
    signIn: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
  }
  sidebarContextValue?: {
    isOpen: boolean
    toggle: ReturnType<typeof vi.fn>
    close: ReturnType<typeof vi.fn>
  }
}

const AllTheProviders = ({ 
  children, 
  authContextValue,
  sidebarContextValue 
}: { 
  children: React.ReactNode
  authContextValue?: CustomRenderOptions['authContextValue']
  sidebarContextValue?: CustomRenderOptions['sidebarContextValue']
}) => {
  const defaultAuthContext = {
    user: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }

  const defaultSidebarContext = {
    isOpen: false,
    toggle: vi.fn(),
    close: vi.fn(),
  }

  return (
    <MockAuthContext.Provider value={authContextValue || defaultAuthContext}>
      <MockSidebarContext.Provider value={sidebarContextValue || defaultSidebarContext}>
        {children}
      </MockSidebarContext.Provider>
    </MockAuthContext.Provider>
  )
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { authContextValue, sidebarContextValue, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders 
        authContextValue={authContextValue}
        sidebarContextValue={sidebarContextValue}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Custom matchers for common assertions
export const expectElementToBeInDocument = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
}

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectElementToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className)
}

export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeVisible()
}

export const expectElementToBeDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled()
}

export const expectElementToBeEnabled = (element: HTMLElement) => {
  expect(element).toBeEnabled()
} 