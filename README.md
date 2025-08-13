# Website Monitoring Dashboard

A modern, full-stack website monitoring application built with Next.js 15 and Supabase. Monitor your websites with automated screenshots, health checks, SSL validation, and response time tracking.

## ✨ Features

### 🌐 URL Management
- Add and remove website URLs
- Import URLs from CSV files
- Export URLs to CSV files
- Bulk operations support

### 📸 Screenshot Monitoring
- Automated website screenshots
- Real-time website health status
- SSL certificate validation
- Response time monitoring
- Visual website preview gallery
- Clickable full-size image viewer


## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── urls/                 # URL management
│   ├── screenshots/          # Screenshot monitoring
│   ├── setup/               # Setup guide
│   └── api/screenshot/      # Screenshot generation API
├── lib/
│   └── supabase.ts          # Database client
└── components/              # Reusable components
```

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Automation:** Playwright for screenshots
- **Icons:** Lucide React
- **CSV Processing:** PapaParse

## 📊 Database Schema

```sql
CREATE TABLE websites (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Usage

1. **Add Websites:** Use the URL management page to add websites you want to monitor
2. **Generate Screenshots:** Click "Generate Screenshots" to capture website previews
3. **Monitor Health:** View real-time status, SSL validation, and response times
4. **View Details:** Click on screenshots to see full-size previews

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Supabase Setup
1. Create a new Supabase project
2. Run the SQL commands from `supabase-setup.sql`
3. Get your project URL and anon key
4. Update your `.env.local` file

