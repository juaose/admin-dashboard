# Admin Dashboard Migration Guide: Replacing Deniro Telegram Bot

## Purpose & Intent

This guide outlines the comprehensive migration from the Deniro Telegram bot to a modern web admin dashboard. The migration aims to:

- **Consolidate Operations**: Replace dual-codebase maintenance with a single, maintainable web interface
- **Enhance Functionality**: Move from Telegram's limitations to full web capabilities with interactive dashboards
- **Improve User Experience**: Provide professional, responsive interfaces for financial operations and player management
- **Future-Proof**: Create an extensible platform for business analytics and operational intelligence

The web dashboard will replicate and enhance all Deniro functionality while adding modern features like real-time dashboards, advanced filtering, bulk operations, and mobile responsiveness.

## Executive Summary

### Business Impact

- **Time Savings**: Multi-user simultaneous access (vs single-chat Telegram limitations)
- **Operational Efficiency**: Interactive charts and tables replace static HTML report downloads
- **Scalability**: Single codebase vs maintaining parallel Telegram bot
- **Professional Interface**: Business-grade interface for financial operations

### Technical Scope

- Migration of 100% of Deniro functionality to web platform
- Integration with existing lotto-core data access layer
- Clean architecture with reusable components
- Real-time data capabilities (vs bot's pull-based model)

## Detailed Implementation Steps

### Phase 1: Foundation & Infrastructure Setup

#### 1.1 Clean & Prepare Admin Dashboard

- [ ] Remove socket.io dependency from package.json
- [ ] Clean up any socket.io related code (confirmed: no usage found)
- [ ] Update dependencies to ensure compatibility
- [ ] Verify Next.js + Amplify auth integration is working

#### 1.2 Integrate Lotto-Core DAL

- [ ] Add @juaose/lotto-core dependency to admin-dashboard
- [ ] Configure MongoDB connection for development
- [ ] Create DAL initialization service in admin dashboard
- [ ] Test basic database queries (players, admins, transactions)

#### 1.3 Authentication & Authorization

- [ ] Review existing AWS Amplify auth (working)
- [ ] Implement role-based access control (Admin, Accountant, CustomerService)
- [ ] Create user context with admin profile information
- [ ] Add protected route middies for different permission levels

#### 1.4 Navigation & Layout Architecture

- [ ] Design main navigation structure matching Deniro modules
- [ ] Implement responsive sidebar navigation
- [ ] Create dashboard header with user info and notifications
- [ ] Set up main dashboard layout with routing structure

---

### Phase 2: Financial Reporting System (Priority 1)

#### 2.1 Data Fetching Services

- [ ] Create hooks for reloads data (getReloadsPerDates)
- [ ] Create hooks for deposits data (getPerBankDeposits)
- [ ] Implement date range filtering (today, week, month, custom)
- [ ] Add shop filtering for customer service users

#### 2.2 Reports Dashboard

- [ ] Build main reports landing page with date selection
- [ ] Implement summary cards (total amounts, transactions, shops)
- [ ] Add report type tabs (Reloads, Deposits)
- [ ] Create export functionality (PDF/Excel/CSV)

#### 2.3 Interactive Charts & Visualizations

- [ ] Install and configure charting library (Recharts/Chart.js/D3)
- [ ] Create type breakdown charts (Automatic, Prize, Manual)
- [ ] Build bank distribution charts
- [ ] Implement shop comparison charts

#### 2.4 Shop Analytics

- [ ] Create shop performance table with sorting/filtering
- [ ] Implement player rankings per shop (top 10)
- [ ] Add bank account usage analytics per shop
- [ ] Build shop drill-down pages

---

### Phase 3: Player Management System (Priority 2)

#### 3.1 Player Search & Discovery

- [ ] Implement advanced player search (name/phone/codename)
- [ ] Create player list with pagination and filtering
- [ ] Add player card components for profiles
- [ ] Implement search history and favorites

#### 3.2 Player Profile Management

- [ ] Build comprehensive player profile modal/page
- [ ] Add inline editing for basic information
- [ ] Implement account migration (premayor number changes)
- [ ] Create notes management (treasury vs customer service notes)

#### 3.3 Account Operations

- [ ] Bank account management (add/delete/change preferred)
- [ ] SINPE and WhatsApp number updates
- [ ] Reload bot toggle (on/off automation)
- [ ] Activity logs and transaction history

#### 3.4 Contact Information Management

- [ ] Add deposit print management
- [ ] Implement codename changes
- [ ] Create contact updates workflow
- [ ] Add validation and confirmation dialogs

---

### Phase 4: Operations & Directory Management (Priority 3)

#### 4.1 Bank Accounts Directory

- [ ] Host accounts CRUD interface
- [ ] Multi-bank filtering (BNCR, BCR, POP, MUT, BAC, PRO, COOP)
- [ ] Account status monitoring
- [ ] Bulk import/export functionality

#### 4.2 Phone Lines Directory

- [ ] Complete CRUD operations for phone contacts
- [ ] Advanced search and filtering
- [ ] Import/export capabilities
- [ ] Integration with player management

#### 4.3 Administrative Operations

- [ ] Admin user management
- [ ] Role assignment interfaces
- [ ] Shop assignment workflows
- [ ] Access log monitoring

#### 4.4 System Monitoring

- [ ] Database connection status
- [ ] Redis cache monitoring
- [ ] Error logging and alerts
- [ ] System health dashboards

---

### Phase 5: Advanced Features & Polish

#### 5.1 Real-Time Capabilities

- [ ] WebSocket implementation for live updates
- [ ] Real-time transaction monitoring
- [ ] Push notifications for critical alerts
- [ ] Live bank balance updates

#### 5.2 Bulk Operations

- [ ] Bulk player updates
- [ ] Mass account operations
- [ ] Batch report generation
- [ ] Bulk import capabilities

#### 5.3 Advanced Analytics

- [ ] Trend analysis with historical data
- [ ] Predictive analytics for business intelligence
- [ ] Custom dashboard creation
- [ ] Advanced filtering systems

#### 5.4 Mobile Optimization

- [ ] Responsive design improvements
- [ ] Mobile-specific interactions
- [ ] Touch-friendly interfaces
- [ ] Offline capabilities

---

### Phase 6: Migration & Testing

#### 6.1 Parallel Testing

- [ ] Develop side-by-side with active Deniro bot
- [ ] Create comprehensive test scenarios
- [ ] Validate data accuracy against Telegram reports
- [ ] Performance testing under load

#### 6.2 User Training & Documentation

- [ ] Create user guides and tutorials
- [ ] Video training sessions
- [ ] Admin onboarding documentation
- [ ] Help system integration

#### 6.3 Production Migration

- [ ] Phased rollout strategy
- [ ] Feature-flag deployment
- [ ] Gradual user migration
- [ ] Emergency rollback procedures

#### 6.4 Decommission Deniro

- [ ] Final data validation
- [ ] Telegram bot deactivation
- [ ] Code archival for future reference
- [ ] Documentation updates

## Technical Architecture

### Frontend Stack

- **Framework**: Next.js with App Router
- **Authentication**: AWS Amplify Auth
- **State Management**: React Context + useReducer for complex forms
- **Data Fetching**: React Query for server state management
- **Charts**: Recharts for data visualization
- **Tables**: TanStack Table for advanced table functionality
- **Styling**: Tailwind CSS with custom color palette
- **Forms**: React Hook Form with validation

### Backend Integration

- **Data Access**: Lotto-core DAL for all database operations
- **API Routes**: Next.js API routes for complex operations
- **File Storage**: AWS S3 for report exports
- **Real-time**: AWS AppSync or WebSockets for live updates

### Code Organization

```
/admin-dashboard/
  /components/           # Reusable UI components
    /layout/             # Navigation, sidebar, headers
    /forms/              # Form components
    /charts/             # Chart visualizations
    /tables/             # Data table components
  /app/                  # Next.js app router
    /api/                # API routes
    /(auth-protected)/   # Protected routes
      /reports/          # Financial reporting
      /players/          # Player management
      /operations/       # Admin operations
      /dashboard/        # Main dashboard
  /hooks/                # Custom React hooks
    /usePlayers.ts       # Player data operations
    /useReports.ts       # Report data operations
    /useAuth.ts          # Authentication helpers
  /lib/                  # Core libraries
    /dal.ts              # Lotto-core integration
    /utils.ts            # General utilities
    /constants.ts        # App constants
  /types/                # TypeScript definitions
    /shared.ts           # Shared types (link to lotto-shared-types)
    /components.ts       # Component-specific types
```

## Success Metrics

### Functional Completion

- ✅ 100% of Deniro bot functionality migrated
- ✅ All financial reports available in web interface
- ✅ Zero functionality regressions
- ✅ Improved user experience metrics

### Performance Benchmarks

- ⏱️ Report generation < 10 seconds (vs.Telegram's 30-60 sec)
- ⚡ Page load times < 2 seconds
- 📱 Mobile responsiveness > 90% score
- 🔄 Real-time updates < 5 second latency

### Business Impact

- 👥 Multi-user concurrent access
- 🎯 Time savings: 50% reduction in report generation workflows
- 📊 Enhanced analytic capabilities beyond Telegram limitations
- 🛡️ Improved data security and access controls

## Risk Mitigation

### Data Integrity

- Continuous validation against production database
- Parallel testing scenarios
- Automated reconciliation checks
- Database snapshots for rollback

### User Adoption

- Intuitive interface design
- Comprehensive training program
- Fallback procedures during migration
- User feedback collection

### Technical Challenges

- Complex transaction relationship mappings
- Real-time data synchronization
- Mobile device compatibility
- Performance optimization for large datasets

This migration transforms operational limitations of a chat-based system into a comprehensive business intelligence platform while consolidating maintenance overhead into a single, scalable codebase.
