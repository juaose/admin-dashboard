# Reports Standardization & Redesign Task

## 📋 Task Overview

**Objective:** Redesign and standardize all report pages in the Lotto Fleet Admin Dashboard with a unified component system, consistent UX, and modern Tailwind CSS styling.

**Priority:** High  
**Estimated Effort:** 3-5 days  
**Dependencies:** Tailwind conversion (Phase 1 & 2) must be complete ✅

---

## 🎯 Goals

1. **Create a standardized report component system** that can be reused across all report types
2. **Unify the user experience** with consistent layouts, filters, and data presentation
3. **Modernize with Tailwind CSS** following established patterns
4. **Improve data visualization** with better charts and summaries
5. **Enhance mobile responsiveness** for all reports
6. **Implement proper dark mode** support throughout

---

## 📊 Current State Analysis

### **Existing Report Pages:**

#### **Depósitos (Deposits) - 4 pages:**

- `/app/depositos/banco-destino/page.tsx` - By destination bank
- `/app/depositos/banco-procedencia/page.tsx` - By origin bank
- `/app/depositos/bancos/page.tsx` - General banks view
- `/app/depositos/cuenta-destino/page.tsx` - By destination account

#### **Recargas (Reloads) - 2 pages:**

- `/app/recargas/clientes/page.tsx` - By customers
- `/app/recargas/tiendas/page.tsx` - By shops/stores

#### **Status Unknown:**

- Retiros (Withdrawals) - May or may not exist
- Promociones - Listed in nav, may not exist

### **Problems with Current Reports:**

1. **Inconsistent Structure:**

   - Each report created at different times
   - No common layout or design patterns
   - Different levels of detail and granularity

2. **Code Quality Issues:**

   - Mix of inline styles and CSS classes
   - Duplicated code across reports
   - No shared components or utilities

3. **UX Problems:**

   - Inconsistent filtering mechanisms
   - Different date selection methods
   - Varying levels of interactivity
   - No standardized export/print features

4. **Data Presentation:**
   - Some reports too detailed, others too sparse
   - No consistent chart/graph library
   - Table designs vary across pages
   - Summary cards formatted differently

---

## 🏗️ Proposed Solution

### **Phase 1: Design System Components**

Create reusable report components:

#### **1.1 ReportContainer Component**

```tsx
// components/reports/ReportContainer.tsx
interface ReportContainerProps {
  title: string;
  description: string;
  icon?: string;
  children: React.ReactNode;
}
```

**Features:**

- Standardized header with icon
- Consistent padding and margins
- Dark mode support
- Print-friendly layout

---

#### **1.2 ReportFilters Component**

```tsx
// components/reports/ReportFilters.tsx
interface ReportFiltersProps {
  dateRange: {
    start: Date;
    end: Date;
    onChange: (start: Date, end: Date) => void;
  };
  quickFilters?: Array<{
    label: string;
    value: "today" | "week" | "month" | "custom";
  }>;
  additionalFilters?: React.ReactNode;
  onRefresh?: () => void;
}
```

**Features:**

- Date range picker with quick filters (Today, This Week, This Month)
- Store/shop selector dropdown
- Custom filter slot for report-specific filters
- Refresh button
- Export button (CSV/PDF)
- Responsive layout

---

#### **1.3 ReportSummaryCards Component**

```tsx
// components/reports/ReportSummaryCards.tsx
interface SummaryCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
}

interface ReportSummaryCardsProps {
  cards: SummaryCard[];
  columns?: 2 | 3 | 4;
}
```

**Features:**

- Grid layout with responsive columns
- Trend indicators (up/down arrows with percentages)
- Icon support
- Dark mode styling
- Loading skeletons

---

#### **1.4 ReportTable Component**

```tsx
// components/reports/ReportTable.tsx
interface Column {
  key: string;
  label: string;
  format?: "currency" | "date" | "number" | "text";
  align?: "left" | "center" | "right";
  sortable?: boolean;
}

interface ReportTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}
```

**Features:**

- Sortable columns
- Pagination
- Loading state
- Empty state
- Responsive (horizontal scroll on mobile)
- Export functionality
- Row highlighting on hover
- Dark mode support

---

#### **1.5 ReportChart Component**

```tsx
// components/reports/ReportChart.tsx
interface ReportChartProps {
  type: "bar" | "line" | "pie" | "donut";
  data: ChartData;
  title?: string;
  height?: number;
}
```

**Features:**

- Multiple chart types
- Responsive sizing
- Dark mode compatible colors
- Tooltips
- Legend
- Export as image

**Recommended Library:** Recharts or Chart.js with react-chartjs-2

---

### **Phase 2: Standardized Report Pages**

Rebuild each report using the new component system:

#### **2.1 Deposits Reports**

**Common Features:**

- Date range filter
- Store selector
- Bank filter
- Summary cards:
  - Total Deposits Count
  - Total Amount
  - Average Deposit
  - Active Banks/Accounts
- Detailed table with:
  - Date/Time
  - Player
  - Origin Bank/Account
  - Destination Bank/Account
  - Amount
  - Status
- Charts:
  - Deposits over time (line chart)
  - Top banks (bar chart)
  - Distribution (pie chart)

**Page-Specific Variations:**

1. **By Destination Bank:**

   - Group by destination bank
   - Show bank color indicators
   - Bank-level summaries

2. **By Origin Bank:**

   - Group by origin bank
   - Track external deposits
   - Origin bank statistics

3. **By Destination Account:**

   - Group by specific accounts
   - Account-level details
   - IBAN information

4. **General Banks View:**
   - High-level overview
   - All banks combined
   - Cross-bank comparisons

---

#### **2.2 Reloads Reports**

**Common Features:**

- Date range filter
- Store selector
- Type filter (Auto/Manual/Prize)
- Summary cards:
  - Total Reloads
  - Total Amount
  - Auto vs Manual split
  - Active Players
- Detailed table with:
  - Date/Time
  - Player
  - Type (icon + label)
  - Amount
  - Bank/Account
  - Status
- Charts:
  - Reloads over time
  - Type distribution
  - Top players

**Page-Specific Variations:**

1. **By Shops/Stores:**

   - Group by store
   - Store manager info
   - Store-level summaries
   - Compare stores

2. **By Customers:**
   - Group by player
   - Player profiles
   - Customer rankings
   - Reload patterns

---

### **Phase 3: Advanced Features**

#### **3.1 Export Functionality**

```tsx
// utils/reportExport.ts
export const exportToCSV = (data: any[], filename: string) => {
  // Implementation
};

export const exportToPDF = (data: any[], config: PDFConfig) => {
  // Implementation using jsPDF or similar
};
```

#### **3.2 Report Caching**

```tsx
// Use React Query or SWR for data caching
import { useQuery } from "@tanstack/react-query";

const useReportData = (reportType: string, filters: Filters) => {
  return useQuery({
    queryKey: ["report", reportType, filters],
    queryFn: () => fetchReportData(reportType, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

#### **3.3 Real-time Updates**

- Optional WebSocket integration for live data
- Auto-refresh capability
- Update indicators

#### **3.4 Saved Filters**

- Save favorite filter combinations
- Quick access to common reports
- User preferences storage

---

## 🎨 Design Guidelines

### **Layout Structure:**

```
┌─────────────────────────────────────────┐
│  Page Header (Icon + Title + Desc)      │
├─────────────────────────────────────────┤
│  Report Filters                          │
│  [Date] [Store] [Custom] [Refresh] [⬇]  │
├─────────────────────────────────────────┤
│  Summary Cards                           │
│  [Card 1] [Card 2] [Card 3] [Card 4]    │
├─────────────────────────────────────────┤
│  Chart(s) - Optional                     │
│  [Visualization]                         │
├─────────────────────────────────────────┤
│  Data Table                              │
│  [Sortable, Paginated Table]            │
└─────────────────────────────────────────┘
```

### **Color Scheme:**

- Use established Tailwind theme colors
- Bank color indicators where applicable
- Status colors (success/warning/error)
- Chart colors that work in dark mode

### **Typography:**

- Headings: text-2xl to text-3xl, font-bold
- Subheadings: text-lg, font-semibold
- Body: text-sm to text-base
- Monospace for numbers and IDs

### **Spacing:**

- Consistent gaps: gap-4, gap-6
- Padding: p-4, p-6, p-8
- Margins: mb-4, mb-6

---

## 📝 Implementation Checklist

### **Step 1: Component Library**

- [ ] Create ReportContainer component
- [ ] Create ReportFilters component
- [ ] Create ReportSummaryCards component
- [ ] Create ReportTable component
- [ ] Create ReportChart component (with chart library integration)
- [ ] Create utility functions (formatCurrency, formatDate, etc.)
- [ ] Create export utilities (CSV, PDF)

### **Step 2: Deposits Section**

- [ ] Redesign banco-destino page
- [ ] Redesign banco-procedencia page
- [ ] Redesign bancos page
- [ ] Redesign cuenta-destino page
- [ ] Test all filters and exports
- [ ] Verify dark mode
- [ ] Test mobile responsiveness

### **Step 3: Recargas Section**

- [ ] Redesign tiendas page
- [ ] Redesign clientes page
- [ ] Test all filters and exports
- [ ] Verify dark mode
- [ ] Test mobile responsiveness

### **Step 4: Additional Sections** (if they exist)

- [ ] Check if Retiros pages exist
- [ ] Check if Promociones page exists
- [ ] Implement using standard components
- [ ] Test and verify

### **Step 5: Polish & Documentation**

- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Add print styles
- [ ] Create component documentation
- [ ] Add usage examples
- [ ] Performance optimization
- [ ] Accessibility audit

---

## 🧪 Testing Requirements

### **Functional Testing:**

- [ ] All filters work correctly
- [ ] Date ranges calculate properly
- [ ] Export functions generate correct data
- [ ] Pagination works
- [ ] Sorting works
- [ ] Data refreshes correctly

### **Visual Testing:**

- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] Mobile layout is usable
- [ ] Tablet layout is optimal
- [ ] Desktop layout uses space well
- [ ] Print layout is clean

### **Performance Testing:**

- [ ] Large datasets load efficiently
- [ ] No unnecessary re-renders
- [ ] Smooth animations
- [ ] Fast filter changes

---

## 📦 Recommended Libraries

### **For Charts:**

```bash
npm install recharts
# or
npm install chart.js react-chartjs-2
```

### **For Data Management:**

```bash
npm install @tanstack/react-query
# or
npm install swr
```

### **For Date Handling:**

```bash
npm install date-fns
# Already may be installed
```

### **For Export:**

```bash
npm install jspdf jspdf-autotable  # For PDF
npm install papaparse  # For CSV
```

---

## 🎯 Success Criteria

1. **Code Quality:**

   - ✅ All reports use shared components
   - ✅ Zero inline styles
   - ✅ 100% Tailwind CSS
   - ✅ TypeScript types for all props
   - ✅ Proper error handling

2. **UX Consistency:**

   - ✅ Same filter UI across all reports
   - ✅ Same summary card layout
   - ✅ Same table structure
   - ✅ Same export functionality

3. **Visual Quality:**

   - ✅ Perfect dark mode support
   - ✅ Responsive on all devices
   - ✅ Smooth transitions
   - ✅ Professional appearance

4. **Performance:**
   - ✅ Fast initial load
   - ✅ Efficient data updates
   - ✅ No layout shifts
   - ✅ Smooth scrolling

---

## 📚 Reference Materials

### **Existing Patterns to Follow:**

- Navigation component (`components/Navigation.tsx`)
- Jugadores page layout (`app/jugadores/page.tsx`)
- Modal patterns from Jugadores modals
- Card patterns from Directorios pages

### **Design System:**

- Tailwind config (`tailwind.config.js`)
- Global styles (`app/globals.css`)
- Theme provider (`components/ThemeProvider.tsx`)

### **API Patterns:**

- Check existing API routes in `/api` directory
- Follow established auth patterns
- Use proper error handling

---

## 🚀 Getting Started

### **Quick Start Guide:**

1. **Set Up Component Directory:**

   ```bash
   mkdir -p components/reports
   touch components/reports/ReportContainer.tsx
   touch components/reports/ReportFilters.tsx
   touch components/reports/ReportSummaryCards.tsx
   touch components/reports/ReportTable.tsx
   touch components/reports/ReportChart.tsx
   ```

2. **Install Dependencies:**

   ```bash
   npm install recharts @tanstack/react-query date-fns jspdf papaparse
   npm install -D @types/papaparse
   ```

3. **Create Base Component:**
   Start with ReportContainer as it will wrap all reports

4. **Build One Complete Report:**
   Choose one deposits page as the prototype

5. **Iterate and Refine:**
   Get feedback, adjust, then apply to other reports

---

## 💡 Tips for Implementation

1. **Start Simple:**

   - Build basic version of components first
   - Add features incrementally
   - Test each addition

2. **Reuse Existing Patterns:**

   - Look at Jugadores section for inspiration
   - Copy established Tailwind patterns
   - Follow the modal/card structure

3. **Keep It DRY:**

   - Create utility functions for common operations
   - Use shared types/interfaces
   - Extract repeated logic

4. **Think Mobile First:**

   - Design for small screens first
   - Add desktop enhancements
   - Test on real devices

5. **Document As You Go:**
   - Add JSDoc comments
   - Create usage examples
   - Note any gotchas

---

## 📞 Questions to Consider

Before starting, clarify these with stakeholders:

1. **Data Requirements:**

   - What date ranges are most important?
   - What's the maximum data set size?
   - Are there any required calculations?

2. **Export Requirements:**

   - What formats are needed (CSV, PDF, Excel)?
   - What data should be included?
   - Any specific formatting requirements?

3. **Permissions:**

   - Who can access which reports?
   - Role-based restrictions?
   - Data filtering by user role?

4. **Charts:**
   - Which visualizations are most valuable?
   - What chart types are preferred?
   - Should charts be interactive?

---

## 📊 Estimated Timeline

| Phase        | Task                            | Duration |
| ------------ | ------------------------------- | -------- |
| **Week 1**   | Component library creation      | 2-3 days |
| **Week 1-2** | First deposits page (prototype) | 1-2 days |
| **Week 2**   | Remaining deposits pages        | 2 days   |
| **Week 2-3** | Recargas pages                  | 1-2 days |
| **Week 3**   | Polish, testing, documentation  | 1-2 days |

**Total:** ~2-3 weeks for complete implementation

---

## ✅ Definition of Done

A report page is considered complete when:

- [ ] Uses all standard report components
- [ ] Has all required filters functional
- [ ] Displays summary cards correctly
- [ ] Shows data table with proper formatting
- [ ] Includes at least one chart/visualization
- [ ] Works in light and dark mode
- [ ] Responsive on mobile, tablet, desktop
- [ ] Export to CSV works
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Empty states shown when appropriate
- [ ] Code is properly typed (TypeScript)
- [ ] No console errors or warnings
- [ ] Passes accessibility audit
- [ ] Peer reviewed and approved

---

**Document Version:** 1.0  
**Last Updated:** January 7, 2025  
**Author:** Development Team

**Next Action:** Review this specification and get stakeholder approval before implementation.
