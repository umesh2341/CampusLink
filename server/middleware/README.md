# server/middleware

This folder contains shared Express middleware used across multiple routes.

## Convention
- One file per middleware concern (e.g., `auth.js`, `rateLimit.js`, `validate.js`).
- Export named middleware functions.
- Mount globally in `index.js` using `app.use(...)` or per-route in individual route files.

## Current middleware
_(none yet — add here as the team grows)_
