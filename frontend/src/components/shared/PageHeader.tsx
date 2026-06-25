import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
    label: string
    href?: string
}

interface PageHeaderProps {
    title: string
    description?: string
    breadcrumbs?: BreadcrumbItem[]
    children?: React.ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    breadcrumbs,
    children,
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 mb-6 border-b">
            <div className="space-y-1.5">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap gap-y-1">
                        <Link to="/" className="hover:text-foreground transition-colors">
                            Home
                        </Link>
                        {breadcrumbs.map((item, index) => (
                            <React.Fragment key={index}>
                                <ChevronRight className="w-4 h-4 mx-1.5 shrink-0" />
                                {item.href ? (
                                    <Link to={item.href} className="hover:text-foreground transition-colors">
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className="text-foreground font-medium">{item.label}</span>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>
                )}
                <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground text-sm max-w-2xl">{description}</p>}
            </div>
            {children && <div className="flex items-center gap-3 self-start md:self-center shrink-0">{children}</div>}
        </div>
    )
}

export default PageHeader
