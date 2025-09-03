# PRO FLEET - Smart Fleet Management System

A comprehensive fleet management and logistics platform built with Next.js 15, TypeScript, and Prisma. Features real-time tracking, multi-language support, role-based access control, and modern UI/UX.

## 🌟 Features

### Core Features
- **Role-Based Access Control** - 5 distinct user roles with tailored dashboards
- **Multi-Language Support** - English, Arabic, and Urdu (RTL support)
- **Dark/Light Mode** - Theme persistence and system preference
- **Real-time Tracking** - GPS monitoring and trip status updates
- **Responsive Design** - Mobile-first approach with desktop optimization

### User Roles & Capabilities

#### 1. **Admin** 🛡️
- Complete system oversight and control
- User management (CRUD operations)
- Vehicle and fleet management
- Pricing and subscription management
- Advanced reporting and analytics
- System configuration and settings

#### 2. **Driver** 🚛
- View assigned trips and schedules
- Real-time GPS tracking and navigation
- Update trip status (start, in-progress, delivered)
- Digital documentation and compliance
- Communication with customers

#### 3. **Customer** 📦
- Online trip booking and scheduling
- Real-time shipment tracking
- Digital invoicing and payments
- Trip history and management
- Company account management

#### 4. **Accountant** 💰
- Invoice generation and management
- Payment processing and tracking
- Financial reporting and analytics
- Expense management
- Export to Excel/PDF

#### 5. **Customs Broker** (مخلص جمركي) 📋
- Customs clearance management
- Fee calculation and VAT processing
- Documentation processing
- Compliance tracking
- Shipment status monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd pro-fleet
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

4. **Configure your .env file**
```env
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key
```

5. **Set up the database**
```bash
npm run db:push
npm run db:generate
```

6. **Seed demo data (optional)**
```bash
# This will create demo accounts and sample data
# You can also do this through the admin dashboard
curl -X POST http://localhost:3000/api/seed
```

7. **Start the development server**
```bash
npm run dev
```

8. **Open your browser**
```
http://localhost:3000
```

## 🔐 Demo Accounts

After seeding demo data, you can use these accounts to test the system:

### **Admin Account**
- **Email:** `admin@profleet.com`
- **Password:** `demo123`
- **Access:** Complete system control, user management, analytics

### **Driver Account**
- **Email:** `driver@profleet.com`
- **Password:** `demo123`
- **Access:** Trip management, GPS tracking, status updates
- **Vehicle:** Truck 5580, Saudi License

### **Customer Account**
- **Email:** `customer@profleet.com`
- **Password:** `demo123`
- **Access:** Trip booking, tracking, invoicing
- **Company:** Customer Company Ltd

### **Accountant Account**
- **Email:** `accountant@profleet.com`
- **Password:** `demo123`
- **Access:** Financial management, invoicing, reports

### **Customs Broker Account**
- **Email:** `broker@profleet.com`
- **Password:** `demo123`
- **Access:** Customs clearance, fee management, compliance
- **License:** CB-789012

## 📱 Language Support

The platform supports three languages with full RTL (Right-to-Left) support:

- **English** (🇺🇸) - Default language
- **العربية** (🇸🇦) - Arabic with RTL layout
- **اردو** (🇵🇰) - Urdu with RTL layout

### Language Switcher
Use the language selector in the top navigation bar to switch between languages. The preference is saved in your browser.

## 🎨 Theme Support

- **Light Mode** - Clean, professional interface
- **Dark Mode** - Easy on the eyes for low-light environments
- **System Preference** - Automatically follows your system theme
- **Theme Persistence** - Your choice is saved for future visits

## 🏗️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Modern React component library
- **Lucide React** - Beautiful icons
- **Framer Motion** - Smooth animations
- **NextAuth.js v4** - Authentication
- **React Hook Form** - Form handling
- **Zustand** - State management
- **TanStack Query** - Server state management

### Backend
- **Next.js API Routes** - Backend API
- **Prisma ORM** - Database toolkit
- **SQLite** - Database (development)
- **bcryptjs** - Password hashing
- **Socket.io** - Real-time communication
- **Zod** - Schema validation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Tailwind CSS** - Styling
- **PostCSS** - CSS processing

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── seed/          # Demo data seeding
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── driver/            # Driver dashboard
│   ├── customer/          # Customer dashboard
│   ├── accountant/        # Accountant dashboard
│   ├── customs-broker/    # Customs broker dashboard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── providers/        # Context providers
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   ├── i18n.ts           # Internationalization
│   └── utils.ts          # Helper functions
└── prisma/               # Database schema
    └── schema.prisma      # Database definitions
```

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users** - With role-based profiles (Driver, Customer, Accountant, Customs Broker)
- **Trips** - Complete trip management with status tracking
- **Vehicles** - Fleet management with different types and capacities
- **Cities** - Location management with multi-language support
- **Pricing** - Dynamic pricing based on routes and vehicle types
- **Invoices** - Financial management with tax calculations
- **Subscriptions** - Flexible subscription plans
- **Settings** - System configuration and preferences

## 🌐 Internationalization

The platform supports multiple languages with:

- **Translation Files** - Centralized translations in `src/lib/i18n.ts`
- **RTL Support** - Proper layout for Arabic and Urdu
- **Dynamic Content** - All UI text is translatable
- **Date/Time Formatting** - Localized date and time display
- **Number Formatting** - Currency and number localization

## 🎯 Key Features Implementation

### Authentication & Authorization
- JWT-based authentication with NextAuth.js
- Role-based access control with middleware
- Secure password hashing with bcryptjs
- Session management and persistence

### Real-time Features
- WebSocket integration with Socket.io
- Live GPS tracking and location updates
- Real-time trip status notifications
- Live dashboard updates

### UI/UX Features
- Responsive design for all screen sizes
- Dark/light mode with system preference
- Smooth animations and transitions
- Loading states and error handling
- Accessible design with ARIA support

### Data Management
- Excel import/export functionality
- Bulk operations for pricing and user management
- Advanced filtering and search
- Data validation with Zod schemas
- Comprehensive error handling

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation
- Contact the development team

## 🚀 Future Enhancements

- [ ] Mobile app development (React Native)
- [ ] Advanced GPS tracking with geofencing
- [ ] Machine learning for route optimization
- [ ] Integration with external logistics APIs
- [ ] Advanced reporting with BI tools
- [ ] Multi-tenant architecture
- [ ] IoT device integration
- [ ] Blockchain for document verification

---

**PRO FLEET** - Smart Fleet. Smart Future. 🚛✨