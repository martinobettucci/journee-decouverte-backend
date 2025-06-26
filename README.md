# journee-decouverte-backend

This project contains the migrations and frontend for managing workshop data with Supabase.

## Migrations

New migrations are located in `supabase/migrations`. Run them using the Supabase CLI:

```bash
supabase db reset
```

## Testimonials table

The `testimonials` table is now created with row level security policies allowing public CRUD operations. This resolves 401 errors when retrieving testimonials via the REST API.
