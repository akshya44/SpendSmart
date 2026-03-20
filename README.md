<div align="center">

<img src="https://img.shields.io/badge/SpendSmart-Expense%20Manager-22c55e?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHRleHQgeT0iMjAiIGZvbnQtc2l6ZT0iMjAiPvCfkqA8L3RleHQ+PC9zdmc+" alt="SpendSmart"/>

# 💰 SpendSmart

### A modern, full-stack Expense Management System

Track, categorize, and visualize your personal or team spending — beautifully.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-Charts-FF6B6B?style=flat-square)](https://recharts.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/akshya44/SpendSmart)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Summary cards, 6-month bar chart, category pie chart, recent transactions |
| ➕ **Add Expense** | ₹ amount, category dropdown, date picker, optional note |
| 🧾 **Expense List** | Filter by category & month, search, sort, inline edit, delete, pagination |
| 🎯 **Budget Manager** | Set monthly limits per category with live color-coded progress bars |
| ⬇️ **Export** | Download as CSV or generate a PDF report — client-side, no extra server |
| 🔐 **Authentication** | Supabase Auth (email + password) with protected routes via Next.js middleware |
| 🌙 **Dark Theme** | Premium dark UI with green accents, smooth animations, fully responsive |

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) — App Router |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Auth** | Supabase Auth — email + password |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/) |
| **Charts** | [Recharts](https://recharts.org/) — Bar + Pie |
| **PDF Export** | [jsPDF](https://github.com/parallax/jsPDF) |
| **Notifications** | [react-hot-toast](https://react-hot-toast.com/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com/) account

### 1. Clone the Repository

```bash
git clone https://github.com/akshya44/SpendSmart.git
cd SpendSmart
npm install
```

### 2. Set Up Supabase

**a) Create a new Supabase project** at [supabase.com](https://supabase.com) → New Project

**b) Run the database schema:**
- Go to **Supabase → SQL Editor → New Query**
- Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql)
- Click **Run** ✅

**c) Enable Email Auth:**
- Go to **Supabase → Authentication → Providers**
- Ensure **Email** provider is enabled
- *(Optional)* Disable "Confirm email" for local testing

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_NAME=SpendSmart
NEXT_PUBLIC_CURRENCY=₹
```

> Find both keys at: **Supabase → Settings → API**

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up and start tracking! 🎉

---

## 📂 Project Structure

```
SpendSmart/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx          # 📊 Main dashboard (charts + summary)
│   │   ├── layout.tsx        # Sidebar layout wrapper
│   │   ├── add/page.tsx      # ➕ Add expense form
│   │   ├── expenses/page.tsx # 🧾 Expense list (filter, export)
│   │   └── budget/page.tsx   # 🎯 Budget manager
│   ├── login/page.tsx        # 🔐 Login page
│   ├── signup/page.tsx       # 📝 Signup page
│   ├── layout.tsx            # Root layout (font, toaster)
│   └── globals.css           # 🎨 Dark theme & custom styles
├── components/
│   └── Sidebar.tsx           # Navigation sidebar
├── lib/
│   ├── supabase.ts           # Browser Supabase client
│   └── supabase-server.ts    # Server-side Supabase client
├── supabase/
│   └── schema.sql            # 🗃️ Full DB schema with RLS
├── middleware.ts             # Route protection
└── .env.local                # ← Add your Supabase keys here
```

---

## 🗃️ Database Schema

```
auth.users (managed by Supabase)
    │
    ├─→ profiles       (id, full_name, currency)
    │       │
    │       ├─→ expenses   (amount, category_id, date, note)
    │       └─→ budgets    (category_id, monthly_limit, month, year)
    │
categories (Food 🍔, Transport 🚗, Bills 📋, Shopping 🛍️, Health 💊, Entertainment 🎬, Other 📦)
```

---

## 🌐 Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Add these **Environment Variables** in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy** 🚀

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/akshya44/SpendSmart)

---

## 📜 License

MIT © [Akshya Kumar](https://github.com/akshya44)

---

<div align="center">
  Made with ❤️ and ☕ | <a href="https://github.com/akshya44/SpendSmart">⭐ Star this repo</a>
</div>
