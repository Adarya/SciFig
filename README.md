# SciFig AI - Scientific Figure Analysis Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.5.3-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4.2-purple?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.4.1-cyan?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-2.39.0-green?style=for-the-badge&logo=supabase" alt="Supabase" />
</div>

## 🧬 Overview

SciFig AI is a comprehensive platform that transforms how medical researchers create publication-ready analyses and figures. Using advanced AI and statistical engines, it makes statistical analysis as simple as describing what you want to show.

### ✨ Key Features

- **🤖 AI-Powered Analysis Selection** - Smart recommendations based on your data structure
- **📊 Publication-Ready Figures** - Journal-specific formatting with proper statistical annotations
- **🔬 Comprehensive Statistical Tests** - T-tests, ANOVA, survival analysis, regression, and more
- **📝 Auto-Generated Methods** - Complete methods sections following publication guidelines
- **🎨 Interactive Figure Editor** - Code editor and natural language modification interface
- **👥 Collaboration Tools** - Share projects, track changes, and collaborate with co-authors
- **🔒 HIPAA Compliant** - Secure data handling for medical research

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/scifig-ai.git
   cd scifig-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
scifig-ai/
├── src/
│   ├── components/           # React components
│   │   ├── LandingPage.tsx   # Marketing landing page
│   │   ├── Dashboard.tsx     # User dashboard
│   │   ├── AnalysisWorkflow.tsx # Main analysis workflow
│   │   ├── FigureAnalyzer.tsx   # Figure analysis tool
│   │   ├── ResultsView.tsx      # Analysis results display
│   │   ├── VisualizationEditor.tsx # Interactive figure editor
│   │   ├── AuthModal.tsx        # Authentication modal
│   │   ├── PricingPage.tsx      # Pricing and plans
│   │   └── AdminPage.tsx        # Admin dashboard
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.ts       # Authentication hook
│   ├── utils/               # Utility functions
│   │   ├── csvParser.ts     # Data parsing utilities
│   │   ├── statisticalEngine.ts # Core statistical calculations
│   │   ├── figureGenerator.ts   # Figure generation engine
│   │   └── supabase.ts          # Supabase client and auth
│   ├── docs/                # Documentation
│   │   ├── SciFig_AI_Agent_Architecture.md
│   │   └── SciFig_AI_Product_Design_Guide.md
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Technologies

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Charts**: Plotly.js, React-Plotly.js
- **Statistics**: Custom TypeScript statistical engine
- **Code Editor**: Monaco Editor
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📊 Features Deep Dive

### 1. Statistical Analysis Engine

The platform includes a comprehensive statistical engine supporting:

- **Basic Tests**: T-tests, ANOVA, Chi-square, Fisher's exact
- **Advanced Tests**: Survival analysis (Kaplan-Meier), regression analysis
- **Assumption Checking**: Automatic validation of statistical assumptions
- **Effect Sizes**: Cohen's d, eta-squared, Cramér's V, odds ratios
- **Confidence Intervals**: 95% CIs for all appropriate statistics

### 2. Figure Generation

Publication-ready figures with:

- **Journal Templates**: Nature, Science, NEJM, JAMA, PLOS ONE
- **Export Formats**: PNG (300 DPI), SVG, PDF, EPS
- **Statistical Annotations**: Significance stars, p-values, confidence intervals
- **Customization**: Colors, fonts, sizes, layouts

### 3. Interactive Editor

Two editing modes for figure customization:

- **Code Editor**: Direct manipulation of figure generation code with Monaco Editor
- **Natural Language**: Chat interface for describing desired changes
- **Live Preview**: Real-time updates as you make changes
- **Version History**: Track and revert changes

### 4. Authentication & Authorization

- **Supabase Auth**: Email/password and Google OAuth
- **Role-Based Access**: Free, Pro, Enterprise tiers
- **Trial Management**: 14-day free trials with usage tracking
- **Security**: HIPAA-compliant data handling

## 🎯 Usage Examples

### Basic Analysis Workflow

1. **Upload Data**: Drag and drop CSV/Excel files
2. **Configure Variables**: Select outcome and grouping variables
3. **AI Recommendation**: Get intelligent test suggestions
4. **Run Analysis**: Execute with assumption checking
5. **Generate Figures**: Create publication-ready visualizations
6. **Export Results**: Download figures and methods text

### Figure Analysis (No Auth Required)

1. **Upload Figure**: Drag and drop any scientific figure
2. **AI Analysis**: Get feedback on publication readiness
3. **Recommendations**: Receive specific improvement suggestions
4. **Alternative Visualizations**: Explore better chart types

### Admin Access

Access the admin dashboard by adding `?admin=true` to any URL:
```
http://localhost:5173/?admin=true
```

Features:
- User management and analytics
- System health monitoring
- Usage statistics and trends
- Database administration tools

## 🔐 Environment Setup

### Supabase Configuration

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Set up authentication**:
   - Enable email/password authentication
   - Configure Google OAuth (optional)
   - Disable email confirmation for development

3. **Create database tables**:
   ```sql
   -- Users profile table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users ON DELETE CASCADE,
     name TEXT,
     subscription_tier TEXT DEFAULT 'free',
     subscription_status TEXT DEFAULT 'active',
     trial_ends_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     PRIMARY KEY (id)
   );

   -- Enable RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);
   ```

4. **Add environment variables**:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## 🚀 Deployment

### Netlify (Recommended)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

### Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API and database interaction tests
- **E2E Tests**: Full user workflow tests

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**:
   ```bash
   npm run test
   npm run lint
   ```
5. **Commit your changes**:
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Use conventional commit messages

### Architecture Guidelines

- **Component Structure**: One component per file, clear separation of concerns
- **State Management**: React hooks for local state, Supabase for global state
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance**: Lazy loading, code splitting, optimized re-renders

## 📈 Roadmap

### Phase 1: Core Platform (✅ Complete)
- [x] Basic statistical tests (t-test, ANOVA, chi-square)
- [x] Figure generation with journal templates
- [x] User authentication and subscription management
- [x] Interactive figure editor

### Phase 2: Advanced Features (🚧 In Progress)
- [ ] Advanced statistical tests (mixed models, meta-analysis)
- [ ] Collaboration features (real-time editing, comments)
- [ ] API access for programmatic usage
- [ ] Mobile app development

### Phase 3: Enterprise Features (📋 Planned)
- [ ] SSO integration (SAML, LDAP)
- [ ] Advanced security controls
- [ ] Custom deployment options
- [ ] Advanced analytics dashboard

### Phase 4: AI Enhancement (🔮 Future)
- [ ] Natural language query interface
- [ ] Automated insight generation
- [ ] Predictive analytics
- [ ] Integration with lab instruments

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors with Plotly**:
   ```bash
   # Install buffer polyfill
   npm install buffer
   ```

2. **Supabase Connection Issues**:
   - Verify environment variables are set correctly
   - Check Supabase project URL and API keys
   - Ensure RLS policies are configured

3. **Monaco Editor Loading Issues**:
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Performance Optimization

- **Code Splitting**: Use React.lazy() for large components
- **Image Optimization**: Compress images and use WebP format
- **Bundle Analysis**: Use `npm run build -- --analyze`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Statistical Methods**: Based on established statistical practices and R implementations
- **Design Inspiration**: Modern scientific publishing platforms and data analysis tools
- **Open Source Libraries**: Built on the shoulders of amazing open source projects

## 📞 Support

- **Documentation**: [docs.scifig.ai](https://docs.scifig.ai)
- **Community**: [Discord Server](https://discord.gg/scifig-ai)
- **Email**: support@scifig.ai
- **Issues**: [GitHub Issues](https://github.com/your-username/scifig-ai/issues)

---

<div align="center">
  <p>Made with ❤️ for the scientific research community</p>
  <p>
    <a href="https://scifig.ai">Website</a> •
    <a href="https://docs.scifig.ai">Documentation</a> •
    <a href="https://twitter.com/scifig_ai">Twitter</a>
  </p>
</div>