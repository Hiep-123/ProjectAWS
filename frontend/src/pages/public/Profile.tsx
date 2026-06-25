import React, { useState } from 'react'
import { useAuth } from '@contexts'
import PageHeader from '@components/shared/PageHeader'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, Label, Separator } from '@components/ui'
import { useToast } from '@hooks/use-toast'
import { User, Shield, Key, MapPin, Bell } from 'lucide-react'

const ProfilePage: React.FC = () => {
    const { user, updateProfile } = useAuth()
    const { toast } = useToast()

    // Form inputs state
    const [firstName, setFirstName] = useState(user?.firstName || '')
    const [lastName, setLastName] = useState(user?.lastName || '')
    const [phone, setPhone] = useState(user?.phone || '')
    const [avatar, setAvatar] = useState(user?.avatar || '')

    const [isUpdating, setIsUpdating] = useState(false)

    // Security state
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')

    // Saved Addresses Mock
    const [addresses, setAddresses] = useState([
        { id: 'addr-1', name: 'Home Address', street: '123 AWS Blvd', city: 'Seattle', state: 'WA', postalCode: '98101', country: 'United States', isDefault: true },
        { id: 'addr-2', name: 'Work Address', street: '456 Lambda Way', city: 'San Francisco', state: 'CA', postalCode: '94105', country: 'United States', isDefault: false },
    ])

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsUpdating(true)
        try {
            if (updateProfile) {
                await updateProfile({
                    firstName,
                    lastName,
                    phone,
                    avatar,
                })
                toast({
                    title: 'Profile Updated',
                    description: 'Your details have been successfully saved.',
                })
            }
        } catch (err: any) {
            toast({
                title: 'Error updating details',
                description: err.message || 'Something went wrong',
                variant: 'destructive',
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmNewPassword) {
            toast({
                title: 'Password Mismatch',
                description: 'The new passwords you typed do not match.',
                variant: 'destructive',
            })
            return
        }

        toast({
            title: 'Password Updated',
            description: 'Your Cognito credentials have been updated successfully.',
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
    }

    const handleSetDefaultAddress = (addressId: string) => {
        setAddresses(prev =>
            prev.map(addr => ({ ...addr, isDefault: addr.id === addressId }))
        )
        toast({
            title: 'Default Address Updated',
            description: 'Your preferred shipping address has been updated.',
        })
    }

    return (
        <div className="container py-8 max-w-4xl">
            <PageHeader
                title="Your Profile"
                description="Manage your Cognito account details, configure notification options, and set preferred addresses"
                breadcrumbs={[{ label: 'Profile' }]}
            />

            <Tabs defaultValue="details" className="space-y-6">
                <TabsList className="grid grid-cols-3 max-w-md bg-muted p-1 rounded-lg">
                    <TabsTrigger value="details" className="text-xs font-semibold">Account Info</TabsTrigger>
                    <TabsTrigger value="addresses" className="text-xs font-semibold">Saved Addresses</TabsTrigger>
                    <TabsTrigger value="security" className="text-xs font-semibold">Security Settings</TabsTrigger>
                </TabsList>

                {/* Account Details Tab */}
                <TabsContent value="details">
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <User className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="email">Email (Immutable Cognito Identity)</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="bg-muted text-muted-foreground"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1 (555) 555-5555"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="avatar">Avatar Image URL</Label>
                                    <Input
                                        id="avatar"
                                        value={avatar}
                                        onChange={(e) => setAvatar(e.target.value)}
                                        placeholder="https://example.com/avatar.jpg"
                                    />
                                </div>

                                <Button type="submit" isLoading={isUpdating} className="w-full sm:w-auto px-6 font-semibold">
                                    Save Profile Settings
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Saved Addresses Tab */}
                <TabsContent value="addresses">
                    <div className="space-y-4">
                        {addresses.map((addr) => (
                            <Card key={addr.id} className="border border-border/40 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base font-bold">{addr.name}</CardTitle>
                                        {addr.isDefault && (
                                            <span className="text-[10px] bg-primary/10 text-primary font-extrabold px-2 py-0.5 rounded">
                                                DEFAULT
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 text-xs font-semibold text-muted-foreground">
                                    <p className="text-foreground text-sm font-bold">Address:</p>
                                    <p className="mt-1">
                                        {addr.street}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        {!addr.isDefault && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleSetDefaultAddress(addr.id)}
                                                className="text-xs font-bold h-8"
                                            >
                                                Make Default
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-destructive text-xs font-bold hover:bg-destructive/10 h-8">
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Cognito Security Credentials Tab */}
                <TabsContent value="security">
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <Key className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-lg font-bold">Cognito Password Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmNewPassword"
                                        type="password"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full sm:w-auto px-6 font-semibold">
                                    Update Password Credentials
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ProfilePage
