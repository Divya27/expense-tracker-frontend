# Expense Tracker : A mobile-first React web app for tracking daily personal expenses with AI-powered insights.

## Overview

Expense Tracker is a personal finance app designed for daily use on mobile. Log transactions in seconds, view spending history with powerful filters, get a visual dashboard of your habits, and chat with an AI that understands your actual data.

### Features

* Authentication — Sign up and sign in with email and password
* Log Expenses — Pick a category, enter amount, add description and optional note
* Expense List — Filter by date range, category, sort by date or amount, edit and delete
* Dashboard — Total spend, daily average, 7-day bar chart, category breakdown, recent transactions
* AI Insights — Chat with Groq AI that has full context of your last 30 days of spending
* Dark Mode — Default dark theme, toggle anytime, persists across sessions
* Mobile First — Designed for phone screen widths, works in any browser

#### Tech stack

Framework — React 18
Routing — React Router v6
HTTP Client — Axios
AI — Groq API (llama-3.3-70b-versatile)
Fonts — Sora + JetBrains Mono

### Getting Started

* Prerequisites

Node.js v18+
Backend API running at http://localhost:8000
Groq API key — free at console.groq.com

* Installation
```bash
    git clone https://github.com/yourusername/expense-tracker-frontend.git
    cd expense-tracker-frontend
    npm install
```

* Environment Variables
  Create a .env file in the root:
    REACT_APP_API_URL=http://localhost:8000/api
    REACT_APP_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

* Run
```bash
  npm start
```
App runs at http://localhost:3000

### Project structure
```bash
src/
├── App.js                        # Routes and auth guards
├── index.css                     # Global reset
├── services/
│   └── api.js                    # Axios instance with interceptors
├── context/
│   ├── AuthContext.jsx           # User session
│   └── ThemeContext.jsx          # Dark / light mode
├── components/
│   ├── Header.jsx                # Shared header with profile menu
│   └── BottomNav.jsx             # Bottom tab navigation
└── screens/
    ├── auth/
    │   ├── SignIn.jsx
    │   └── SignUp.jsx
    └── app/
        ├── LogExpense.jsx
        ├── ExpenseList.jsx
        ├── Dashboard.jsx
        └── AIInsights.jsx
```

#### Design

Theme (dark):   #111 background · #F0EDE8 text · #1a1a1a cards
Theme (light):  #F5F2ED background · #1a1a1a text · #fff cards
Accent:         #7c4dff → #c651a0 (purple to pink gradient)
Font:           Sora (UI) · JetBrains Mono (numbers and labels)
Max width:      480px

### How AI Insights Works

Expense data is fetched from your backend, summarised into a context string, and sent to Groq alongside your message. No expense data is stored by Groq beyond the request.
Context includes total spend, daily average, category breakdown, biggest expense, and last 10 transactions — all from your actual data.

#### Scripts
npm start          # Development server
npm run build      # Production build