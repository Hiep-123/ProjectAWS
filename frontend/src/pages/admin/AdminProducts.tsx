import React, { useState } from 'react'
import {
    useAdminProducts,
    useAdminCreateProduct,
    useAdminUpdateProduct,
    useAdminDeleteProduct,
} from '@hooks/queries/useAdmin'
import PageHeader from '@components/shared/PageHeader'
import ConfirmDialog from '@components/shared/ConfirmDialog'
import LoadingSpinner from '@components/shared/LoadingSpinner'
import { DataTable } from '@components/ui/data-table'
import {
    Button,
    Input,
    Card,
    CardContent,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Label,
    Textarea,
    Badge,
} from '@components/ui'
import { useToast } from '@hooks/use-toast'
import { Plus, Edit2, Trash2, Package } from 'lucide-react'
import { Product } from '@types'
import { formatCurrency } from '@lib/utils'

const CATEGORY_OPTIONS = [
    { label: 'Electronics', value: 'electronics' },
    { label: 'Clothing', value: 'clothing' },
    { label: 'Home & Kitchen', value: 'home & kitchen' },
    { label: 'Books', value: 'books' },
    { label: 'Beauty', value: 'beauty' },
]

const AdminProducts: React.FC = () => {
    const { toast } = useToast()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Form state
    const [name, setName] = useState('')
    const [price, setPrice] = useState(0)
    const [stock, setStock] = useState(0)
    const [category, setCategory] = useState('electronics')
    const [description, setDescription] = useState('')
    const [image, setImage] = useState('')

    // Queries & mutations
    const params = { page, pageSize: 8, search: search || undefined }
    const { data: response, isLoading, isError, refetch } = useAdminProducts(params)
    const { mutate: createProduct, isPending: createPending } = useAdminCreateProduct()
    const { mutate: updateProduct, isPending: updatePending } = useAdminUpdateProduct()
    const { mutate: deleteProduct, isPending: deletePending } = useAdminDeleteProduct()

    const handleOpenCreate = () => {
        setEditingProduct(null)
        setName('')
        setPrice(0)
        setStock(0)
        setCategory('electronics')
        setDescription('')
        setImage('')
        setDialogOpen(true)
    }

    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product)
        setName(product.name)
        setPrice(product.price)
        setStock(product.stock)
        setCategory(product.category)
        setDescription(product.description)
        setImage(product.image)
        setDialogOpen(true)
    }

    const handleSaveProduct = (e: React.FormEvent) => {
        e.preventDefault()

        const payload = {
            name,
            price: Number(price),
            stock: Number(stock),
            category,
            description,
            image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        }

        if (editingProduct) {
            updateProduct(
                { id: editingProduct.id, product: payload },
                {
                    onSuccess: () => {
                        toast({ title: 'Product Updated', description: `${name} has been updated successfully.` })
                        setDialogOpen(false)
                        refetch()
                    },
                    onError: (err) => {
                        toast({ title: 'Update failed', description: err.message, variant: 'destructive' })
                    },
                }
            )
        } else {
            createProduct(payload, {
                onSuccess: () => {
                    toast({ title: 'Product Created', description: `${name} has been added successfully.` })
                    setDialogOpen(false)
                    refetch()
                },
                onError: (err) => {
                    toast({ title: 'Creation failed', description: err.message, variant: 'destructive' })
                },
            })
        }
    }

    const handleDeleteConfirm = () => {
        if (deleteId) {
            deleteProduct(deleteId, {
                onSuccess: () => {
                    toast({ title: 'Product Deleted', description: 'The product was successfully removed.' })
                    setDeleteId(null)
                    refetch()
                },
                onError: (err) => {
                    toast({ title: 'Deletion failed', description: err.message, variant: 'destructive' })
                },
            })
        }
    }

    // Table Columns definition for our generic DataTable
    const columns = [
        {
            accessorKey: 'image',
            header: 'Image',
            cell: (p: Product) => (
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted border">
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                </div>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Product Name',
            sortable: true,
            cell: (p: Product) => (
                <div>
                    <p className="font-bold text-sm text-foreground line-clamp-1">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">ID: {p.id}</p>
                </div>
            ),
        },
        {
            accessorKey: 'category',
            header: 'Category',
            cell: (p: Product) => (
                <Badge variant="outline" className="capitalize text-xs">
                    {p.category}
                </Badge>
            ),
        },
        {
            accessorKey: 'price',
            header: 'Price',
            sortable: true,
            cell: (p: Product) => <span className="font-bold text-sm">{formatCurrency(p.price)}</span>,
        },
        {
            accessorKey: 'stock',
            header: 'Stock',
            sortable: true,
            cell: (p: Product) => (
                <span className={`font-bold text-sm ${p.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                    {p.stock} units
                </span>
            ),
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            cell: (p: Product) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenEdit(p)} className="h-8 w-8">
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setDeleteId(p.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            ),
        },
    ]

    return (
        <div className="container py-6 max-w-7xl space-y-6">
            <PageHeader
                title="Product Catalog Management"
                description="Manage categories, retail pricing, inventory levels and sync status on downstream systems"
            >
                <Button onClick={handleOpenCreate} className="gap-1.5 text-xs font-semibold h-9">
                    <Plus className="w-4 h-4" />
                    Add Product
                </Button>
            </PageHeader>

            {isLoading ? (
                <div className="min-h-[40vh] flex-center">
                    <LoadingSpinner label="Retrieving catalog..." />
                </div>
            ) : isError ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">Error fetching product catalog.</p>
                    <Button onClick={() => refetch()} size="sm">Retry</Button>
                </div>
            ) : (
                <Card className="border border-border/40 shadow-sm">
                    <CardContent className="pt-6">
                        <DataTable
                            columns={columns}
                            data={response?.data || []}
                            searchKey="name"
                            searchPlaceholder="Search catalog by name..."
                            filterOptions={{
                                key: 'category',
                                label: 'Category',
                                options: CATEGORY_OPTIONS,
                            }}
                            pageSize={8}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Modal Dialog Form for Add / Edit */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? 'Edit Catalog Product' : 'Add New Product'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveProduct} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label htmlFor="name">Product Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="price">Price ($)</Label>
                                <Input id="price" type="number" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="stock">Stock Level</Label>
                                <Input id="stock" type="number" value={stock} onChange={e => setStock(Number(e.target.value))} required />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="category">Category</Label>
                            <select
                                id="category"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="image">Image URL</Label>
                            <Input id="image" value={image} onChange={e => setImage(e.target.value)} placeholder="https://unsplash.com/..." />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={createPending || updatePending}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={createPending || updatePending}>
                                Save Product
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirm delete dialog */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Product"
                description="Are you sure you want to delete this product? This will remove it from search index and customer catalogs."
                onConfirm={handleDeleteConfirm}
                variant="destructive"
                isLoading={deletePending}
            />
        </div>
    )
}

export default AdminProducts
