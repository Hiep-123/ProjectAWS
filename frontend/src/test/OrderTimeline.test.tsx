import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrderTimeline from '@components/orders/OrderTimeline'

describe('OrderTimeline', () => {
    it('renders the timeline heading', () => {
        render(<OrderTimeline />)
        expect(screen.getByText('AWS Event-Driven Flow')).toBeInTheDocument()
    })

    it('renders all timeline steps', () => {
        render(<OrderTimeline />)
        expect(screen.getByText('Order Placed')).toBeInTheDocument()
        expect(screen.getByText('Processing Started')).toBeInTheDocument()
        expect(screen.getByText('Inventory Updated')).toBeInTheDocument()
        expect(screen.getByText('Email Sent')).toBeInTheDocument()
        expect(screen.getByText('Shipped')).toBeInTheDocument()
        expect(screen.getByText('Delivered')).toBeInTheDocument()
    })

    it('renders AWS service labels', () => {
        render(<OrderTimeline />)
        expect(screen.getByText('Order Service')).toBeInTheDocument()
        expect(screen.getByText('EventBridge')).toBeInTheDocument()
        expect(screen.getByText('SQS -> Lambda')).toBeInTheDocument()
    })

    it('shows timestamps for completed steps', () => {
        render(<OrderTimeline />)
        expect(screen.getByText('10:00 AM')).toBeInTheDocument()
    })

    it('shows -- for pending steps', () => {
        render(<OrderTimeline />)
        const pending = screen.getAllByText('--')
        expect(pending.length).toBeGreaterThan(0)
    })
})
