import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatTargetDate, getDaysUntil, getCurrentMemberInfo } from '@/lib/utils'

// Mock the AuthRepository
vi.mock('@/lib/repository', () => ({
  AuthRepository: vi.fn().mockImplementation(() => ({
    getCurrentMemberInfo: vi.fn(),
  })),
}))

describe('Utils Functions', () => {
  describe('cn function', () => {
    it('combines class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('handles arrays of classes', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('handles objects with boolean values', () => {
      expect(cn('base', { 'active': true, 'disabled': false })).toBe('base active')
    })

    it('handles mixed input types', () => {
      expect(cn('base', ['class1', 'class2'], { 'active': true }, 'class3')).toBe('base class1 class2 active class3')
    })

    it('handles empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null, undefined)).toBe('')
    })

    it('merges Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })
  })

  describe('formatTargetDate function', () => {
    it('formats valid date strings correctly', () => {
      expect(formatTargetDate('2024-01-01')).toBe('1/1/2024')
      expect(formatTargetDate('2024-12-25')).toBe('12/25/2024')
      expect(formatTargetDate('2024-03-15')).toBe('3/15/2024')
    })

    it('handles single digit months and days', () => {
      expect(formatTargetDate('2024-01-05')).toBe('1/5/2024')
      expect(formatTargetDate('2024-05-01')).toBe('5/1/2024')
    })

    it('handles leap year dates', () => {
      expect(formatTargetDate('2024-02-29')).toBe('2/29/2024')
    })

    it('handles invalid date format gracefully', () => {
      expect(formatTargetDate('invalid-date')).toBe('NaN/NaN/NaN')
    })

    it('handles empty string gracefully', () => {
      expect(formatTargetDate('')).toBe('NaN/NaN/NaN')
    })

    it('handles malformed date string gracefully', () => {
      expect(formatTargetDate('2024-13-01')).toBe('13/1/2024')
      expect(formatTargetDate('2024-01-32')).toBe('1/32/2024')
    })
  })

  describe('getDaysUntil function', () => {
    beforeEach(() => {
      // Mock current date to 2024-01-15
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('calculates days until future date correctly', () => {
      expect(getDaysUntil('2024-01-20')).toBe(6)
      expect(getDaysUntil('2024-02-15')).toBe(32)
      expect(getDaysUntil('2024-12-25')).toBe(346)
    })

    it('calculates days until past date correctly', () => {
      expect(getDaysUntil('2024-01-10')).toBe(-4)
      expect(getDaysUntil('2023-12-25')).toBe(-20)
    })

    it('returns 1 for today', () => {
      expect(getDaysUntil('2024-01-15')).toBe(1)
    })

    it('handles leap year correctly', () => {
      // Set current date to 2024-02-28
      vi.setSystemTime(new Date('2024-02-28'))
      expect(getDaysUntil('2024-02-29')).toBe(2)
      expect(getDaysUntil('2024-03-01')).toBe(2)
    })

    it('handles year boundary correctly', () => {
      // Set current date to 2024-12-31
      vi.setSystemTime(new Date('2024-12-31'))
      expect(getDaysUntil('2025-01-01')).toBe(2)
      expect(getDaysUntil('2025-01-15')).toBe(16)
    })

    it('handles invalid date format gracefully', () => {
      expect(getDaysUntil('invalid-date')).toBeNaN()
    })

    it('handles empty string gracefully', () => {
      expect(getDaysUntil('')).toBeNaN()
    })

    it('handles malformed date string gracefully', () => {
      expect(getDaysUntil('2024-13-01')).toBeNaN()
      expect(getDaysUntil('2024-01-32')).toBeNaN()
    })
  })

  describe('getCurrentMemberInfo function', () => {
    it('returns member info when successful', async () => {
      const mockMemberInfo = {
        id: 'member-1',
        member_id: 'member-1',
        project_id: 'project-1',
        email: 'test@example.com',
        full_name: 'Test User',
      }

      const { AuthRepository } = await import('@/lib/repository')
      const mockAuthRepository = vi.mocked(AuthRepository).mock.instances[0]
      vi.mocked(mockAuthRepository.getCurrentMemberInfo).mockResolvedValue(mockMemberInfo)

      const result = await getCurrentMemberInfo()

      expect(result).toEqual(mockMemberInfo)
      expect(mockAuthRepository.getCurrentMemberInfo).toHaveBeenCalledTimes(1)
    })

    it('returns null when repository throws error', async () => {
      const { AuthRepository } = await import('@/lib/repository')
      const mockAuthRepository = vi.mocked(AuthRepository).mock.instances[0]
      vi.mocked(mockAuthRepository.getCurrentMemberInfo).mockRejectedValue(new Error('Database error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await getCurrentMemberInfo()

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error getting current member info:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('handles network errors gracefully', async () => {
      const { AuthRepository } = await import('@/lib/repository')
      const mockAuthRepository = vi.mocked(AuthRepository).mock.instances[0]
      vi.mocked(mockAuthRepository.getCurrentMemberInfo).mockRejectedValue(new Error('Network timeout'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await getCurrentMemberInfo()

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error getting current member info:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
}) 