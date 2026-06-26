import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SubscriptionToggle } from './subscription-toggle'

describe('SubscriptionToggle', () => {
  it('switches subscription value', () => {
    const onChange = vi.fn()

    render(<SubscriptionToggle value={true} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Не в подписке' }))
    expect(onChange).toHaveBeenCalledWith(false)
  })
})
