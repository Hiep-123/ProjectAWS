# E-Commerce Platform Frontend

A production-ready E-Commerce Platform frontend built with React 19, TypeScript, and Vite. Designed for AWS Serverless Architecture following the AWS Well-Architected Framework principles.

## Architecture

- **Clean Architecture** with Feature-Based Structure
- **AWS Serverless Ready** - Compatible with API Gateway, Lambda, DynamoDB, Cognito, EventBridge, SQS, SNS
- **Service Abstraction Layer** with Mock APIs for backend integration
- **Event-Driven Visualization** for AWS EventBridge and SQS patterns
- **Enterprise-Grade Code Quality** with TypeScript strict mode

## 🎨 Design System

- Modern SaaS Design Language inspired by Amazon
- Fully Responsive - Mobile First approach
- Dark Mode & Light Mode support
- Accessibility (WCAG 2.1) compliant
- shadcn/ui component library extensively used
- Lucide React icons
- Recharts for data visualization

## 🧬 Tech Stack

### Core
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Lightning fast build tool
- **Tailwind CSS v4** - Utility-first CSS
- **React Router v7** - Client-side routing

### State Management
- **TanStack Query v5** - Server state management
- **Context API** - Local state (Auth, Cart, Theme)

### Forms & Validation
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation

### UI Components
- **shadcn/ui** - High-quality component library
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### HTTP & API
- **Axios** - HTTP client

## 📁 Project Structure

```
src/
├── app/                          # App setup & configuration
│   └── App.tsx                   # Main app component
├── routes/                       # Route definitions
│   └── index.tsx                 # Route configuration
├── layouts/                      # Layout components
│   ├── PublicLayout.tsx          # Public store layout
│   ├── AdminLayout.tsx           # Admin dashboard layout
│   └── AuthLayout.tsx            # Authentication layout
├── pages/                        # Page components
│   ├── public/                   # Public store pages
│   ├── admin/                    # Admin dashboard pages
│   └── auth/                     # Authentication pages
├── features/                     # Feature modules (feature-based)
│   ├── auth/                     # Authentication feature
│   ├── products/                 # Product catalog feature
│   ├── cart/                     # Shopping cart feature
│   ├── orders/                   # Order management feature
│   ├── profile/                  # User profile feature
│   ├── admin/                    # Admin features
│   ├── monitoring/               # AWS monitoring feature
│   └── recommendations/          # AI recommendations feature
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   ├── shared/                   # Shared components
│   └── charts/                   # Chart components
├── services/                     # Service layer (API abstraction)
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── cart.service.ts
│   ├── order.service.ts
│   ├── admin.service.ts
│   └── monitoring.service.ts
├── hooks/                        # Custom React hooks
│   └── queries/                  # TanStack Query hooks
├── contexts/                     # React contexts
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── ThemeContext.tsx
├── lib/                          # Utility functions & helpers
│   ├── axios-instance.ts
│   ├── utils.ts
│   └── constants.ts
├── mock/                         # Mock data & API responses
│   ├── products.ts
│   ├── orders.ts
│   └── analytics.ts
├── types/                        # TypeScript types & interfaces
│   ├── product.ts
│   ├── order.ts
│   ├── user.ts
│   └── api.ts
├── assets/                       # Static assets
├── main.tsx                      # Entry point
└── index.css                     # Global styles
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## 📋 Features

### Public Store
- **Home** (`/`) - Hero banner, featured products, trending items, recommendations
- **Products** (`/products`) - Catalog with search, filters, sorting, pagination
- **Product Detail** (`/products/:id`) - Images, reviews, related products, add to cart
- **Shopping Cart** (`/cart`) - Cart management, quantity updates, coupon support
- **Checkout** (`/checkout`) - Shipping, billing, payment method, order summary
- **Orders** (`/orders`) - Order history with search and filters
- **Order Tracking** (`/orders/:id`) - Timeline view showing event-driven order status
- **User Profile** (`/profile`) - Account settings, addresses, order history

### Authentication
- JWT-based authentication compatible with Amazon Cognito
- Login, Registration, Password Reset flows
- Protected routes with auth context
- Persistent session management

### Future Work
- Admin dashboard and management APIs are out of scope for this submission and remain future work.

### AI Recommendations
- `/recommendations` - AI-powered product recommendations (Bedrock-ready)

## 🔒 Security & Best Practices

- TypeScript strict mode enabled
- Zod schema validation for all forms
- Protected routes with authentication guard
- HTTPS-ready with secure headers
- Error boundaries for graceful error handling
- Sensitive data not stored in localStorage
- CSRF protection ready for backend integration

## 🌙 Theme Support

Built-in support for light and dark modes:
- Automatic theme detection
- Manual theme switching
- Persistent theme preference
- Accessible color contrasts

## 📊 State Management Strategy

### TanStack Query (Server State)
- Products queries
- Orders queries
- Analytics data
- Admin data

### Context API (Client State)
- **AuthContext** - User authentication state
- **CartContext** - Shopping cart items
- **ThemeContext** - Dark/Light mode preference

## 🔌 Service Layer

All API calls are abstracted through service layer for easy backend integration:

```typescript
// services/product.service.ts
export const productService = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  // ... more methods
}
```

Mock implementations ensure frontend development independence from backend.

## 🎯 AWS Integration Ready

The frontend is prepared for seamless integration with:
- **API Gateway** - REST API endpoints
- **Lambda** - Serverless functions
- **DynamoDB** - NoSQL database
- **Cognito** - User authentication
- **EventBridge** - Event-driven architecture
- **SQS** - Message queuing
- **SNS** - Notifications
- **CloudWatch** - Monitoring and logging

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: xs, sm, md, lg, xl, 2xl
- Touch-friendly UI elements
- Optimized performance on mobile devices

## ♿ Accessibility

- WCAG 2.1 AA compliance
- Semantic HTML
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader optimized

## 🎓 Code Quality

- ESLint configuration
- TypeScript strict mode
- Clean code principles
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- SOLID principles

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=E-Commerce Platform
```

## 🤝 Contributing

Follow the established code structure and conventions. All new features should:
1. Be placed in appropriate feature folder
2. Include TypeScript types
3. Have proper error handling
4. Include mock data if needed

## 📄 License

MIT License - See LICENSE file for details

## 🚢 Deployment

This frontend is optimized for deployment on:
- AWS CloudFront + S3
- AWS Amplify
- Netlify
- Vercel

## 📚 Documentation

- Code follows TSDoc conventions
- Each component has inline documentation
- Service methods are well documented
- Complex logic includes explanatory comments

---

**Built with ❤️ for AWS Serverless Architecture**
