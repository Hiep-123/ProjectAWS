import React, { useState } from 'react'
import PageHeader from '@components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent, Label, Input, Button, Switch } from '@components/ui'
import { useToast } from '@hooks/use-toast'
import { Settings, Shield, Sliders, Database, HardDrive } from 'lucide-react'

const AdminSettings: React.FC = () => {
    const { toast } = useToast()

    // General Settings State
    const [storeName, setStoreName] = useState('Serverless Storefront')
    const [contactEmail, setContactEmail] = useState('operations@serverless-store.com')
    const [currency, setCurrency] = useState('USD')

    // Security & AWS settings State
    const [mfaEnabled, setMfaEnabled] = useState(true)
    const [cognitoPoolId, setCognitoPoolId] = useState('us-east-1_aBcD1234')
    const [eventBusName, setEventBusName] = useState('ecommerce-event-bus')

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault()
        toast({
            title: 'General Settings Saved',
            description: 'Application config variables updated.',
        })
    }

    const handleSaveAWS = (e: React.FormEvent) => {
        e.preventDefault()
        toast({
            title: 'AWS Identity & EventBus Configurations Saved',
            description: 'Cognito client credentials and EventBridge target settings updated.',
        })
    }

    return (
        <div className="container py-6 max-w-4xl space-y-6">
            <PageHeader
                title="System Configuration Settings"
                description="Manage global settings, identity pool credentials, event-routing parameters and storage limits"
            />

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid grid-cols-2 max-w-md bg-muted p-1 rounded-lg">
                    <TabsTrigger value="general" className="text-xs font-semibold">General Settings</TabsTrigger>
                    <TabsTrigger value="aws" className="text-xs font-semibold">AWS Credentials</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general">
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <Sliders className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-base font-bold">General Metadata Configurations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveGeneral} className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="storeName">Storefront Name</Label>
                                    <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="contactEmail">Operations Support Email</Label>
                                    <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="currency">Default Currency Code</Label>
                                    <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
                                </div>
                                <Button type="submit" className="w-full sm:w-auto px-6 font-semibold">
                                    Save Config Details
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AWS Identity and EventBridge tab */}
                <TabsContent value="aws">
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <Shield className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-base font-bold">Cognito & EventBridge Connection Parameters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveAWS} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs font-semibold">
                                        <div className="space-y-0.5">
                                            <p className="text-foreground">Enforce Cognito MFA</p>
                                            <p className="text-muted-foreground font-medium">Require multi-factor auth for all administrators</p>
                                        </div>
                                        <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="poolId">Amazon Cognito User Pool ID</Label>
                                        <Input id="poolId" value={cognitoPoolId} onChange={(e) => setCognitoPoolId(e.target.value)} required className="font-mono" />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="busName">Amazon EventBridge Custom Bus Name</Label>
                                        <Input id="busName" value={eventBusName} onChange={(e) => setEventBusName(e.target.value)} required className="font-mono" />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full sm:w-auto px-6 font-semibold">
                                    Save AWS parameters
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default AdminSettings
