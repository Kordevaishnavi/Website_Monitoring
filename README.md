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

<<<<<<< HEAD
### 🎨 User Interface
- Beautiful orange-themed design
- Dark mode support
- Responsive design for all devices
- Professional dashboard layout
- Real-time status indicators

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Set up Supabase database:**
Visit `/setup` page for detailed instructions or run the SQL in `supabase-setup.sql`

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to `http://localhost:3000`
=======
>>>>>>> 4c6b1f8fa5f1246e7593368e5b4b196e13f9eb3b

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

<<<<<<< HEAD
## 📝 License

This project is open source and available under the MIT License.

## 🤝 Support

If you encounter any issues or have questions, please check the setup guide at `/setup` or review the documentation.
=======
>>>>>>> 4c6b1f8fa5f1246e7593368e5b4b196e13f9eb3b
