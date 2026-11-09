# Bukhari Fabrics

A responsive Next.js storefront styled around the provided Bukhari Fabrics sample website. It includes featured collections, searchable fabric catalogue, customer accounts, checkout/order history, newsletter signup, Resend contact form delivery, a responsive product admin dashboard, and a public privacy policy page.

## Run locally

1. Use Node.js 20.9 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set your Supabase project URL and publishable key.
4. Run the SQL in [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
5. Add active products and stock, then run `npm run dev` and open `http://localhost:3000`.

The store admin dashboard is at `/admin` and is restricted by Supabase RLS to `bukharifabricstailoring@gmail.com`. Run the schema after changing the administrator email. The dashboard supports product photos (up to 10 per product), prices, discounts, stock, visibility, and homepage ordering. The public privacy policy is at `/privacy-policy`.

The seeded products, PKR prices, and stock are demo catalogue values. The displayed contact information and social links are copied from the supplied public sample. Confirm them before launch. Checkout records a pending order request and reserves stock; configure your payment provider, shipping and tax policies before accepting payment online.
