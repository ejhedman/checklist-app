import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/members/route'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  })),
}))

// Mock MembersRepository
const mockCreateMember = vi.fn()
vi.mock('@/lib/repository', () => ({
  MembersRepository: vi.fn().mockImplementation(() => ({
    createMember: mockCreateMember,
  })),
}))

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')

describe('Members API Route', () => {
  const mockValidMemberData = {
    full_name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    nickname: 'testuser',
    role: 'member',
    project_id: 'test-project-id',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/members', () => {
    it('creates a member successfully', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { MembersRepository } = await import('@/lib/repository')

      // Mock successful auth user creation
      vi.mocked(createClient).mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: {
                user: {
                  id: 'test-user-id',
                  email: 'test@example.com',
                },
              },
              error: null,
            }),
            deleteUser: vi.fn(),
          },
        },
      } as any)

      // Mock successful member creation
      mockCreateMember.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(mockValidMemberData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.member).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        full_name: 'Test User',
        nickname: 'testuser',
        role: 'member',
      })
    })

    it('returns 400 for missing required fields', async () => {
      const invalidData = {
        full_name: 'Test User',
        email: 'test@example.com',
        // Missing password and project_id
      }

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('returns 409 when user already exists in auth', async () => {
      const { createClient } = await import('@supabase/supabase-js')

      vi.mocked(createClient).mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: null },
              error: {
                message: 'User already registered',
              },
            }),
            deleteUser: vi.fn(),
          },
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(mockValidMemberData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('A user with this email already exists')
    })

    it('returns 400 for other auth errors', async () => {
      const { createClient } = await import('@supabase/supabase-js')

      vi.mocked(createClient).mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: null },
              error: {
                message: 'Invalid email format',
              },
            }),
            deleteUser: vi.fn(),
          },
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(mockValidMemberData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email format')
    })

    it('returns 500 when auth user creation fails', async () => {
      const { createClient } = await import('@supabase/supabase-js')

      vi.mocked(createClient).mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: { user: null },
              error: null,
            }),
            deleteUser: vi.fn(),
          },
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(mockValidMemberData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create user')
    })

    it('handles database constraint violation for duplicate email', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { MembersRepository } = await import('@/lib/repository')

      // Mock successful auth user creation
      vi.mocked(createClient).mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: {
                user: {
                  id: 'test-user-id',
                  email: 'test@example.com',
                },
              },
              error: null,
            }),
            deleteUser: vi.fn().mockResolvedValue({ error: null }),
          },
        },
      } as any)

      // Mock database constraint violation
      const mockMembersRepository = vi.mocked(MembersRepository).mock.instances[0]
      vi.mocked(mockMembersRepository.createMember).mockRejectedValue({
        code: '23505',
        message: 'duplicate key value violates unique constraint "members_email_key"',
      })

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(mockValidMemberData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('A member with this email already exists')
    })

    it('handles other database errors', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { MembersRepository } = await import('@/lib/repository')

      // Mock successful auth user creation
      vi.mocked(createClient).mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: {
                user: {
                  id: 'test-user-id',
                  email: 'test@example.com',
                },
              },
              error: null,
            }),
            deleteUser: vi.fn().mockResolvedValue({ error: null }),
          },
        },
      } as any)

      // Mock database error
      const mockMembersRepository = vi.mocked(MembersRepository).mock.instances[0]
      vi.mocked(mockMembersRepository.createMember).mockRejectedValue({
        message: 'Database connection failed',
      })

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(mockValidMemberData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database connection failed')
    })

    it('cleans up auth user when database insertion fails', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { MembersRepository } = await import('@/lib/repository')

      const mockDeleteUser = vi.fn().mockResolvedValue({ error: null })

      // Mock successful auth user creation
      vi.mocked(createClient).mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: {
                user: {
                  id: 'test-user-id',
                  email: 'test@example.com',
                },
              },
              error: null,
            }),
            deleteUser: mockDeleteUser,
          },
        },
      } as any)

      // Mock database error
      const mockMembersRepository = vi.mocked(MembersRepository).mock.instances[0]
      vi.mocked(mockMembersRepository.createMember).mockRejectedValue({
        message: 'Database error',
      })

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(mockValidMemberData),
      })

      await POST(request)

      expect(mockDeleteUser).toHaveBeenCalledWith('test-user-id')
    })

    it('handles missing nickname gracefully', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { MembersRepository } = await import('@/lib/repository')

      const memberDataWithoutNickname = {
        ...mockValidMemberData,
        nickname: undefined,
      }

      // Mock successful auth user creation
      vi.mocked(createClient).mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: {
                user: {
                  id: 'test-user-id',
                  email: 'test@example.com',
                },
              },
              error: null,
            }),
            deleteUser: vi.fn(),
          },
        },
      } as any)

      // Mock successful member creation
      const mockMembersRepository = vi.mocked(MembersRepository).mock.instances[0]
      vi.mocked(mockMembersRepository.createMember).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(memberDataWithoutNickname),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.member.nickname).toBeNull()
    })

    it('handles missing role gracefully', async () => {
      const { createClient } = await import('@supabase/supabase-js')
      const { MembersRepository } = await import('@/lib/repository')

      const memberDataWithoutRole = {
        ...mockValidMemberData,
        role: undefined,
      }

      // Mock successful auth user creation
      vi.mocked(createClient).mockReturnValue({
        auth: {
          admin: {
            createUser: vi.fn().mockResolvedValue({
              data: {
                user: {
                  id: 'test-user-id',
                  email: 'test@example.com',
                },
              },
              error: null,
            }),
            deleteUser: vi.fn(),
          },
        },
      } as any)

      // Mock successful member creation
      const mockMembersRepository = vi.mocked(MembersRepository).mock.instances[0]
      vi.mocked(mockMembersRepository.createMember).mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(memberDataWithoutRole),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.member.role).toBe('user')
    })

    it('handles JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('handles unexpected errors', async () => {
      const { createClient } = await import('@supabase/supabase-js')

      // Mock auth client to throw unexpected error
      vi.mocked(createClient).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(mockValidMemberData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
}) 