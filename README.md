# 🕌 QHLC Web Portal

**Quranic Learning and Exam Management Portal for Saudi Arabia**

A comprehensive web platform for Quranic learning, exam management, and educational administration with mobile-first design and Progressive Web App (PWA) features.

## 🚀 Features

- **📱 Mobile-First Design**: Optimized for mobile users with responsive design
- **⚡ Progressive Web App**: Installable on mobile devices with offline capabilities
- **🔐 Role-Based Access**: User, Coordinator, Convener, Admin, and Super Admin roles
- **📝 Exam Management**: Create, schedule, and evaluate exams
- **📊 Real-time Reporting**: Comprehensive reports for all user types
- **🌐 Multi-language Support**: Arabic, English, and Malayalam
- **📚 Resource Management**: Upload and manage educational content
- **👥 User Management**: Complete user lifecycle management
- **📈 Progress Tracking**: Monitor Quran memorization progress
- **📋 Attendance Management**: Track student attendance
- **📖 Book Management**: Distribute and track educational materials

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PWA**: Next-PWA, Workbox
- **Icons**: Lucide React
- **Deployment**: Vercel/Netlify

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/qhlc.git
cd qhlc
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
qhlc/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (public)/          # Public pages
│   │   ├── dashboard/         # Role-based dashboards
│   │   ├── admin/             # Admin panel
│   │   └── api/               # API routes
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── mobile/           # Mobile-specific components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/         # Supabase configuration
│   │   ├── utils/            # Utility functions
│   │   ├── hooks/            # Custom React hooks
│   │   └── types/            # TypeScript types
│   └── styles/               # Additional styles
├── public/                   # Static assets
│   ├── icons/               # PWA icons
│   └── manifest.json        # PWA manifest
├── docs/                    # Documentation
└── scripts/                 # Build and deployment scripts
```

## 🔐 Authentication & Roles

### User Roles

1. **User**: Register, take exams, view results
2. **Coordinator**: Manage attendance, progress, books
3. **Convener**: Regional oversight and reporting
4. **Admin**: Exam management and evaluation
5. **Super Admin**: Full system control

### Authentication Flow

- Email/password registration and login
- Role-based route protection
- Automatic redirects based on user type
- Session management with Supabase Auth

## 📱 PWA Features

- **Offline Support**: Core functionality works offline
- **Installable**: Add to home screen on mobile devices
- **Push Notifications**: Exam reminders and updates
- **Background Sync**: Sync data when connection is restored
- **App-like Experience**: Native mobile app feel

## 🗄️ Database Schema

The application uses PostgreSQL with the following key tables:

- `users` - Supabase Auth users
- `profiles` - Extended user information
- `exams` - Exam definitions
- `questions` - Exam questions
- `user_exams` - User exam attempts
- `user_answers` - Individual answers
- `attendance` - Student attendance
- `progress` - Learning progress
- `books` - Book management
- `resources` - Educational content
- `certificates` - Generated certificates

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## 📊 API Documentation

The application provides RESTful APIs for all functionality:

- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management
- `/api/exams/*` - Exam management
- `/api/questions/*` - Question management
- `/api/attendance/*` - Attendance tracking
- `/api/progress/*` - Progress tracking
- `/api/books/*` - Book management
- `/api/resources/*` - Resource management

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support and questions:

- 📧 Email: support@qhlc.com
- 📱 WhatsApp: +966-XX-XXX-XXXX
- 🌐 Website: https://qhlc.com

## 🙏 Acknowledgments

- Supabase for the backend infrastructure
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first styling
- All contributors and supporters

---

**Built with ❤️ for the Quranic Learning Community in Saudi Arabia**
