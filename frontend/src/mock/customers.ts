import { User } from '@types'

export const mockCustomers: User[] = [
    {
        id: 'cust-1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1 555-0199',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        role: 'customer',
        status: 'active',
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-05-20T12:00:00Z',
    },
    {
        id: 'cust-2',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1 555-0182',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'customer',
        status: 'active',
        createdAt: '2024-02-10T14:45:00Z',
        updatedAt: '2024-05-18T10:15:00Z',
    },
    {
        id: 'cust-3',
        email: 'robert.johnson@example.com',
        firstName: 'Robert',
        lastName: 'Johnson',
        phone: '+1 555-0143',
        role: 'customer',
        status: 'suspended',
        createdAt: '2024-03-01T09:15:00Z',
        updatedAt: '2024-05-10T16:30:00Z',
    },
    {
        id: 'cust-4',
        email: 'emily.davis@example.com',
        firstName: 'Emily',
        lastName: 'Davis',
        phone: '+1 555-0128',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        role: 'customer',
        status: 'inactive',
        createdAt: '2024-03-12T11:20:00Z',
        updatedAt: '2024-04-15T09:00:00Z',
    },
    {
        id: 'cust-5',
        email: 'michael.wilson@example.com',
        firstName: 'Michael',
        lastName: 'Wilson',
        phone: '+1 555-0111',
        role: 'customer',
        status: 'active',
        createdAt: '2024-03-24T16:00:00Z',
        updatedAt: '2024-05-22T14:20:00Z',
    },
    {
        id: 'cust-6',
        email: 'sarah.miller@example.com',
        firstName: 'Sarah',
        lastName: 'Miller',
        phone: '+1 555-0176',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        role: 'customer',
        status: 'active',
        createdAt: '2024-04-02T10:05:00Z',
        updatedAt: '2024-05-25T11:45:00Z',
    },
]

export const getMockCustomers = (
    page: number = 1,
    pageSize: number = 10,
    search?: string
): { data: User[]; total: number } => {
    let filtered = [...mockCustomers]

    if (search) {
        const query = search.toLowerCase()
        filtered = filtered.filter(
            (c) =>
                c.firstName.toLowerCase().includes(query) ||
                c.lastName.toLowerCase().includes(query) ||
                c.email.toLowerCase().includes(query)
        )
    }

    const start = (page - 1) * pageSize
    const paginated = filtered.slice(start, start + pageSize)

    return {
        data: paginated,
        total: filtered.length,
    }
}
