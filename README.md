# Meshwork Studio

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

<p align="center">
  <strong>Enterprise-grade visual architecture design platform with production-ready authentication and real-time collaboration.</strong>
</p>

---

## 🚀 Live Demo

**Coming Soon** - Deployed on Vercel with PostgreSQL backend

---

## 📖 What is Meshwork Studio?

Meshwork Studio is a **visual architecture design platform** that enables teams to design, document, and collaborate on system architecture diagrams. Built with modern web technologies and enterprise-grade security.

### Key Features

- **🎨 Visual Architecture Editor** - Drag-and-drop interface for designing system diagrams
- **🔐 Enterprise Authentication** - Multi-strategy auth with OAuth, local login, and 2FA-ready
- **👥 Real-time Collaboration** - WebSocket-powered live editing
- **📁 Workspace Management** - Organize diagrams with collections and tags
- **🎭 Dark/Light Themes** - Full theme support with next-themes
- **🐳 Docker-First Deployment** - Complete containerization with nginx reverse proxy
- **🔒 Security Hardened** - XSS, CSRF, SQL injection protection built-in

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MESHWORK STUDIO v1.0                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│   CLIENT LAYER     │     │   API GATEWAY      │     │   SERVICE LAYER    │
│   (React + Vite)   │◄────│   (Nginx 80)       │◄────│   (Express 5000)   │
│                    │     │                    │     │                    │
│ • React 18         │     │ • Reverse Proxy    │     │ • TypeScript       │
│ • TanStack Query   │     │ • Static Assets    │     │ • Passport.js      │
│ • React Flow       │     │ • SPA Fallback     │     │ • Session Mgmt     │
│ • Tailwind + Radix │     │ • Gzip Compression │     │ • Zod Validation   │
└────────────────────┘     └────────────────────┘     └──────────┬───────────┘
                                                               │
                                  ┌────────────────────────────┼────────────┐
                                  │         DATA LAYER         │            │
                                  │                            ▼            │
                                  │  ┌──────────────┐  ┌──────────────┐   │
                                  │  │  PostgreSQL  │  │  PostgreSQL  │   │
                                  │  │   Auth DB    │  │ Workspace DB │   │
                                  │  │   :5432      │  │   :5433      │   │
                                  │  └──────────────┘  └──────────────┘   │
                                  └─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with concurrent features |
| **TypeScript** | Type safety across the entire stack |
| **TanStack Query** | Server state management with caching |
| **React Flow** | Visual node-based diagram editor |
| **Tailwind CSS** | Utility-first styling |
| **Radix UI** | Accessible, unstyled component primitives |
| **Framer Motion** | Smooth page transitions |
| **Wouter** | Lightweight routing (2KB vs 40KB React Router) |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | Fast, scalable API server |
| **Passport.js** | Multi-strategy authentication |
| **Drizzle ORM** | Type-safe SQL with PostgreSQL |
| **Zod** | Runtime schema validation |
| **Argon2id** | Password hashing (PHC winner) |
| **WebSocket** | Real-time collaboration |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Reverse proxy + static server |
| **Drizzle Kit** | Database migrations |
| **Vite** | Fast development + optimized builds |

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Node.js 18+ (for local development)
- npm 9+ or pnpm

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/meshwork-studio.git
cd meshwork-studio

# Copy environment template
cp .env.example .env

# Edit .env with your credentials (see Configuration section)

# Start all services
docker-compose up -d

# Access the application
open http://localhost
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Set up databases (requires PostgreSQL running)
npm run db:push

# Start development server
npm run dev

# In another terminal, start frontend dev server
cd client && npm run dev
```

---

## ⚙️ Configuration

Create a `.env` file in the project root:

```bash
# Database URLs
AUTH_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth
WORKSPACE_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/workspace

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your_random_256_bit_secret_here

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# CAPTCHA (get from hCaptcha dashboard)
HCAPTCHA_SECRET=your_hcaptcha_secret

# Email (for verification - optional)
SMTP_HOST=smtp.resend.com
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
```

---

## 📸 Screenshots

<p align="center">
  <em>Screenshots coming soon - Dashboard view with workspace cards and visual editor</em>
</p>

---

## 🔐 Security Features

### Authentication
- ✅ **Multi-strategy auth** (Local email/password + Google OAuth)
- ✅ **Argon2id password hashing** (OWASP recommended, PHC winner)
- ✅ **Production-grade CAPTCHA** with replay protection
- ✅ **Session management** with secure HTTP-only cookies
- ✅ **CSRF protection** via SameSite cookies

### Input Validation
- ✅ **Defense in depth** - Client-side + Schema + Database layers
- ✅ **XSS prevention** - React automatic escaping
- ✅ **SQL injection proof** - Drizzle ORM parameterized queries
- ✅ **Input sanitization** - Emoji blocking, character limits (16 chars)

### Infrastructure
- ✅ **Docker containerization** with non-root users
- ✅ **Nginx reverse proxy** with security headers
- ✅ **Static asset caching** with content hashing
- ✅ **SPA fallback** for client-side routing

Read the full [Authentication Documentation](./docs/AUTHENTICATION.md) for security details.

---

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build (client + server)
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push schema changes to database
```

### Docker Commands

```bash
docker-compose up -d              # Start all services
docker-compose logs -f backend  # Tail backend logs
docker-compose restart frontend  # Restart frontend after build
docker-compose down -v           # Stop and remove volumes
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Authentication](./docs/AUTHENTICATION.md) | Security architecture, auth flows, edge cases |
| [Post-Mortem](./docs/post-mortem.md) | Bug fixes, infrastructure issues, lessons learned |

---

## 🗺️ Roadmap

### Completed ✅
- [x] Visual architecture editor with React Flow
- [x] Multi-strategy authentication (Local + OAuth)
- [x] Enterprise-grade CAPTCHA with replay protection
- [x] Input validation (16 chars, no emojis, alphanumeric)
- [x] XSS/CSRF protection
- [x] SQL injection prevention (Drizzle ORM)
- [x] Docker containerization
- [x] Workspace management with collections

### In Progress 🚧
- [ ] Email verification system
- [ ] User profile management
- [ ] Export diagrams to PNG/SVG
- [ ] Undo/redo history

### Planned 📋
- [ ] Two-Factor Authentication (2FA)
- [ ] Real-time collaborative editing
- [ ] Role-based access control (RBAC)
- [ ] SAML/SSO enterprise integration
- [ ] Audit logging & compliance
- [ ] API rate limiting
- [ ] Webhooks for integrations
- [ ] Mobile-responsive diagram editor

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) (coming soon) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) - The node-based editor powering our diagram tool
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe SQL
- [Passport.js](http://www.passportjs.org/) - Authentication middleware

---

## 👤 Contact

**Meshwork Studio Team**

- Project Link: [https://github.com/yourusername/meshwork-studio](https://github.com/yourusername/meshwork-studio)
- Demo: [https://meshwork-studio.vercel.app](https://meshwork-studio.vercel.app) (coming soon)

---

<p align="center">
  <strong>Built with ❤️ and TypeScript</strong>
</p>
