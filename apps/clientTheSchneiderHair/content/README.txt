Site copy (single source of truth for public-facing English strings)

- site-copy.en.json — marketing site, navigation, cookie banner, storefront, education pages, admin login labels.
- site-copy.legal.en.json — legal / privacy GDPR sections 2–11 and full General Terms (GTC) text.

Edit these JSON files for client review and copy changes, then run `pnpm run build` to verify. Dynamic data (salon address from the artist portal, FAQ items from the database, service prices, reviews) still comes from your existing content pipeline, not from these files.
