# CSAT Feature Importance Analyzer

A Next.js app for analyzing Customer Satisfaction (CSAT) survey results by feature (Search, Export, Change Management), split by AWS vs Lab groups.  
Includes regression-based feature importance, usage-weighted analysis, visualizations, and a What-If Simulator to project CSAT improvements.

## Features
- Upload survey CSV (Townsend CSAT format).
- Multiple linear regression (OLS) per segment (AWS vs Lab).
- Weighted importance (impact × usage).
- Charts: Weighted Bars, Bubble (Impact vs Usage).
- What-If Simulator: adjust feature scores to see projected CSAT % (A+B).
- Export PNG charts and PDF reports.

## Requirements
- Node.js 18+
- npm or yarn

## Getting Started

```bash
# Unzip the project, then:
cd csat_app

# Install dependencies
npm install

# Run in development mode
npm run dev

# Open your browser at http://localhost:3000/csat
```

## Project Structure
```
app/csat/page.tsx      # Main page with analyzer + charts + simulator
components/ui/*        # Minimal UI stubs (replace with shadcn/ui if desired)
package.json           # Dependencies and scripts
```

## Dependencies
- next
- react, react-dom
- recharts
- papaparse
- mathjs
- html-to-image
- jspdf
- lucide-react

## Customization
- Replace `components/ui/*` with [shadcn/ui](https://ui.shadcn.com/) components for better styling.
- Adjust column mapping and usage numbers in the app interface.
- Extend What-If Simulator with logistic mapping for more precise % estimates.

---

© 2025 CSAT Analyzer Prototype
