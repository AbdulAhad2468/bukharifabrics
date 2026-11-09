# Bukhari Fabrics

A Next.js storefront styled around the provided Bukhari Fabrics sample website. It uses the sample's logo and fabric photography, and includes featured collections, searchable/filterable fabric catalogue, best sellers, new arrivals, saved items, per-metre cart, customer accounts, checkout/order history, newsletter signup, and a Supabase-backed contact form.

## Run locally

1. Use Node.js 20.9 or later.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set your Supabase project URL and publishable key.
4. Run the SQL in [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
5. Add active products and stock, then run `npm run dev` and open `http://localhost:3000`.

The seeded products, PKR prices, and stock are demo catalogue values. The displayed contact information and social links are copied from the supplied public sample. Confirm them before launch. Checkout records a pending order request and reserves stock; configure your payment provider, shipping and tax policies before accepting payment online.
