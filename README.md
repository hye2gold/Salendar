<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SaleCalendar (Next.js)

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` (optional: `GEMINI_MODEL`, `GEMINI_ENABLE_SEARCH=true`) in [.env.local](.env.local) to your Gemini API key.
3. (Supabase) Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in [.env.local](.env.local).
4. (Supabase) Apply `supabase/schema.sql` in the Supabase SQL Editor to create tables/policies.
5. Run the app:
   `npm run dev`
