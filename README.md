# HeatlthyFi - Nutrition Tracking Dashboard


A modern nutrition tracking application built with React, TypeScript, and Supabase. Track your meals, water intake, and get AI-powered health suggestions.

## Features

- 🍽️ **Meal Tracking**: Log your meals with calories and get quick suggestions
- 💧 **Water Intake**: Track your daily water consumption
- 📊 **Analytics**: View weekly charts of your nutrition data
- 🤖 **AI Suggestions**: Get personalized health tips based on your intake
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔐 **Authentication**: Secure user authentication with Supabase

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Lucide React icons
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Charts**: Recharts
- **State Management**: React Query (TanStack Query)

## Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn
- A Supabase account and project

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <YOUR_GIT_URL>
cd nutri-dash-express-main
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings and get your project URL and anon key
3. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 4. Set up the Database

Run the migration file in your Supabase SQL editor:

```sql
-- The migration file is located at: supabase/migrations/20251008183135_f9af2fe2-5d04-48eb-bd66-b075d98ab155.sql
```

### 5. Set up Edge Functions (Optional - for AI features)

If you want to use the AI suggestions feature:

1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Deploy functions: `supabase functions deploy`
5. Set up your Lovable API key in Supabase dashboard under Edge Functions secrets

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── DietSuggestions.tsx
│   ├── MealForm.tsx
│   ├── WaterForm.tsx
│   └── WeeklyChart.tsx
├── pages/              # Page components
│   ├── Dashboard.tsx
│   └── Auth.tsx
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
└── hooks/              # Custom React hooks
```

## Features Overview

### Dashboard
- View daily calorie and water intake
- Weekly nutrition charts
- Quick meal and water logging
- AI-powered health suggestions

### Authentication
- Secure user registration and login
- Session management with Supabase Auth

### AI Suggestions
- Personalized nutrition tips based on daily intake
- Powered by Lovable AI API
- Analyzes calorie balance and hydration levels

## Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure your `.env` file is properly configured
2. **Database Connection**: Ensure your Supabase project is active and accessible
3. **AI Features**: Check that your Lovable API key is set in Supabase Edge Functions
4. **TypeScript Errors**: Run `npm install` to ensure all dependencies are installed

### Getting Help

If you encounter any issues:

1. Check the browser console for errors
2. Verify your Supabase connection in the Network tab
3. Ensure all environment variables are set correctly
4. Check that the database tables exist and have the correct schema


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
