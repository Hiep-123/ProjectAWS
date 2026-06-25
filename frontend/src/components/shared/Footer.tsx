import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Footer Component
 */
const Footer: React.FC = () => {
    return (
        <footer className="border-t border-border bg-muted/50 py-12 mt-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center rounded text-sm">
                                #
                            </div>
                            ECommerce
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Production-ready e-commerce platform built on AWS Serverless Architecture.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/products" className="text-muted-foreground hover:text-foreground">
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/recommendations" className="text-muted-foreground hover:text-foreground">
                                    Recommendations
                                </Link>
                            </li>
                            <li>
                                <Link to="/" className="text-muted-foreground hover:text-foreground">
                                    About
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="font-semibold mb-4">Customer Service</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground">
                                    FAQs
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground">
                                    Returns
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground">
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-muted-foreground hover:text-foreground">
                                    Sitemap
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
                    <p>&copy; 2024 E-Commerce Platform. All rights reserved.</p>
                    <p>Built with ❤️ for AWS Serverless Architecture</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
