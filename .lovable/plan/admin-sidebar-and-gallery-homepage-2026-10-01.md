# Admin sidebar and gallery homepage

## What will change
- Replace the admin panel's horizontal tabs with a collapsible vertical sidebar that remains available as an icon rail on larger screens and opens as a menu on phones.
- Organize controls into labeled sections:
  - **Schedule:** Availability
  - **Galleries:** Client galleries, Portfolios, Site photos
  - **Site:** Announcements, Payment options, Maintenance
  - **Account:** Login details
- Keep the selected admin section in the URL so refreshing or sharing an admin link returns to the same section.

## Client gallery visibility
- Add a **Show on gallery homepage** switch for every client gallery.
- Hidden galleries will not appear on the public gallery homepage, but their direct password-protected links will continue working.
- Add a cover-photo selector using photos already uploaded to each gallery.

## Public gallery homepage
- Add a new public `/galleries` page showing visible galleries in a responsive editorial photo grid.
- Show each gallery's selected cover, name, and event date, linking to its existing client gallery page.
- Load gallery cards progressively as visitors scroll when the list is large.

## Gallery homepage settings
- Add a dedicated **Gallery homepage** subsection under Client Galleries settings.
- Let the admin customize the page heading, introductory text, logo image URL, contact link/label, and footer text.
- Include a public-page preview/open action from the admin area.

## Technical details
- Add nullable/defaulted columns to `client_galleries` for homepage visibility and cover photo selection, preserving all existing galleries and links.
- Store homepage copy and branding in the existing `site_settings` system.
- Add the public route to the existing hash-based navigation.
- Preserve current gallery passwords, favorites, downloads, uploads, ordering, and custom link codes.
- Verify the admin sidebar on desktop and mobile, gallery visibility behavior, settings persistence, and the public gallery page in the browser.
