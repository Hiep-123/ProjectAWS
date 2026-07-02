import React, { useState } from 'react'
import PageHeader from '@components/shared/PageHeader'
import ProductCard from '@components/shared/ProductCard'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@components/ui'
import { useProducts } from '@hooks/queries/useProducts'
import { Sparkles, Send, BrainCircuit, Lightbulb } from 'lucide-react'

const RecommendationsPage: React.FC = () => {
    const [prompt, setPrompt] = useState('')
    const [bedrockReason, setBedrockReason] = useState<string | null>(null)
    const [recommendedIds, setRecommendedIds] = useState<string[]>([])
    const [isThinking, setIsThinking] = useState(false)

    // Query all products to filter down matching recommendations
    const { data: productResponse } = useProducts({ page: 1, pageSize: 20 })

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault()
        if (!prompt.trim()) return

        setIsThinking(true)
        setBedrockReason(null)

        // Mock AWS Bedrock inference delay
        setTimeout(() => {
            const query = prompt.toLowerCase()
            let rationale = ''
            let matches: string[] = []

            if (query.includes('travel') || query.includes('coffee') || query.includes('remote') || query.includes('portable')) {
                rationale = 'AWS Bedrock analyzed your intent for portable, coffee-shop and travel workspace setup. We selected lightweight laptops, wireless accessories, and noise isolation audio products from our catalog.'
                matches = ['prod-laptop-002', 'prod-audio-001', 'prod-acc-001']
            } else if (query.includes('music') || query.includes('sound') || query.includes('audio') || query.includes('listen')) {
                rationale = 'AWS Bedrock detected high interest in high-fidelity acoustics. We selected premium headphones with ANC and true wireless earbuds for immersive listening experiences.'
                matches = ['prod-audio-001', 'prod-audio-002']
            } else if (query.includes('premium') || query.includes('expensive') || query.includes('best') || query.includes('luxury')) {
                rationale = 'AWS Bedrock personalized your results targeting high-end premium specs and top customer ratings across laptops, phones, and gaming.'
                matches = ['prod-laptop-003', 'prod-phone-003', 'prod-game-001']
            } else if (query.includes('gaming') || query.includes('game') || query.includes('play') || query.includes('fps')) {
                rationale = 'AWS Bedrock identified gaming intent. We selected a gaming console, high-DPI gaming mouse, and a high-performance gaming laptop.'
                matches = ['prod-game-001', 'prod-game-002', 'prod-laptop-003']
            } else {
                rationale = `AWS Bedrock mapped prompt "${prompt}" against core features and extracted general convenience electronics and productivity gear.`
                matches = ['prod-laptop-001', 'prod-phone-001', 'prod-acc-002']
            }

            setBedrockReason(rationale)
            setRecommendedIds(matches)
            setIsThinking(false)
        }, 1500)
    }

    const recommendedProducts = productResponse?.data.filter((p: any) => recommendedIds.includes(p.id)) || []

    return (
        <div className="container py-8 max-w-6xl">
            <PageHeader
                title="AI Recommendation Engine"
                description="Simulated Amazon Bedrock (Claude 3.5 Sonnet) personalization model matching real-time user prompt intent"
                breadcrumbs={[{ label: 'Recommendations' }]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Prompt box */}
                <div className="space-y-6">
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <BrainCircuit className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold">AWS Bedrock Prompt</CardTitle>
                                <CardDescription className="text-xs">Describe your exact needs or setup vibe</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleGenerate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Input
                                        placeholder="e.g. I need gear for remote work at coffee shops"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="h-10 text-xs"
                                        disabled={isThinking}
                                    />
                                </div>
                                <Button type="submit" disabled={isThinking} className="w-full h-10 text-xs font-semibold gap-1.5">
                                    {isThinking ? (
                                        <>
                                            <LoadingSpinner size="sm" />
                                            Bedrock is thinking...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Generate Recommendations
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Quick Suggestions */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
                            <div className="p-1.5 rounded bg-primary/10 text-primary">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-sm font-bold">Try suggestions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <button
                                onClick={() => setPrompt('travel gear for coffee shops')}
                                className="w-full text-left p-2.5 rounded-lg border text-xs font-semibold hover:bg-muted/50 transition-colors"
                            >
                                "travel gear for coffee shops"
                            </button>
                            <button
                                onClick={() => setPrompt('high quality music audio setup')}
                                className="w-full text-left p-2.5 rounded-lg border text-xs font-semibold hover:bg-muted/50 transition-colors"
                            >
                                "high quality music audio setup"
                            </button>
                            <button
                                onClick={() => setPrompt('best gaming setup for FPS')}
                                className="w-full text-left p-2.5 rounded-lg border text-xs font-semibold hover:bg-muted/50 transition-colors"
                            >
                                "best gaming setup for FPS"
                            </button>
                        </CardContent>
                    </Card>
                </div>

                {/* Results block */}
                <div className="lg:col-span-2 space-y-6">
                    {isThinking ? (
                        <Card className="border border-border/40 shadow-sm h-[300px] flex items-center justify-center">
                            <div className="text-center space-y-3">
                                <BrainCircuit className="w-12 h-12 text-primary mx-auto animate-spin" />
                                <p className="text-sm font-semibold text-muted-foreground">Inference processing via Amazon Bedrock...</p>
                            </div>
                        </Card>
                    ) : bedrockReason ? (
                        <div className="space-y-6">
                            {/* Rationale block */}
                            <Card className="border border-primary/20 bg-primary/5 shadow-sm">
                                <CardContent className="p-4 flex items-start gap-3 text-xs font-semibold">
                                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-foreground mb-1 text-sm">Bedrock AI Reason</h4>
                                        <p className="text-muted-foreground leading-relaxed">{bedrockReason}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Products recommendation grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {recommendedProducts.map((prod: any) => (
                                    <ProductCard key={prod.id} product={prod} badge="Bedrock Pick" />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Card className="border border-border/40 shadow-sm h-[300px] flex items-center justify-center text-center px-6">
                            <div className="space-y-2 max-w-sm">
                                <BrainCircuit className="w-10 h-10 text-muted-foreground mx-auto" />
                                <h3 className="font-bold text-base text-foreground">Waiting for input</h3>
                                <p className="text-xs text-muted-foreground leading-normal">
                                    Enter a prompt on the left sidebar to query Amazon Bedrock's personalization recommendations based on real product traits.
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RecommendationsPage
