# Security & Privacy Guidelines (SECURITY.md)

## 1. Data Protection & Privacy
- **Participant Data:** Contact information (phone numbers, email addresses) and personal roles are collected solely for event administration.
- **Credential Safety:** Never store passwords or sensitive tokens in client-side code, logs, or public repositories.
- **Synthetic Data Standard:** During local development and automated testing, only use realistic synthetic datasets. Never import real member or pastor phone numbers/emails into test environments.

## 2. Server-Side Validation & Sanitization
- All API endpoints and form submissions must validate payloads using strict schema parsers (Zod).
- SQL queries must use parameterized queries (via Drizzle ORM) to prevent SQL injection.
- Rate limiting / Turnstile spam protection: Future public submission endpoints should be protected via Cloudflare Turnstile to prevent automated bot flooding.

## 3. Administrative Access Control
- In production, administrative endpoints (`/admin/*`) will be protected via **Cloudflare Zero Trust / Cloudflare Access** (requiring email OTP or verified Google Workspace login) or signed administrative session cookies.
- Unauthorized users must receive a 401/403 and never see participant lists or contact details.
