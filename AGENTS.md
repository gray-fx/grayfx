# Architecture Rules

- Keep admin sections addressable through the `section` query parameter so sidebar navigation survives refreshes and shared links.
- Expose public gallery listings through a security-definer RPC that returns only display-safe fields, never password hashes.
- Store gallery homepage presentation settings as one JSON object under the `gallery_homepage` site-setting key.