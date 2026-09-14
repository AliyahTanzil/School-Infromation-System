---
noteId: '157ef680b01511f1a0da4d8de3c0dbca'
tags: []
---

# Email setup API

`GET /api/settings/email` and `PUT /api/settings/email` (also `/api/v1/settings/email`)
require a valid session, server-resolved single-school context and `schools.update`
permission; the persisted application owner retains the existing permission bypass.
Tenant IDs are never accepted from the request. Responses use `Cache-Control: no-store`.

PUT accepts a strict JSON object:

```json
{
  "host": "smtp.example.com",
  "port": 587,
  "secure": false,
  "user": "notifications@example.com",
  "password": "provider-app-password",
  "from": "notifications@example.com",
  "frontendUrl": "https://school.example.com"
}
```

Port/security must be 587/false (required STARTTLS) or 465/true (TLS).
The host must be a public DNS name resolving to public IPv4 addresses. Connections
pin a validated address and verify the original hostname's TLS certificate.
The frontend URL must be an HTTPS origin, without credentials, query, fragment or
path; development also accepts HTTP localhost and 127.0.0.1 origins.
An omitted/empty password retains the current password only if host and user are
unchanged. Initial setup and changes to either require a password.

PUT verifies SMTP authentication without sending email, then atomically stores
the encrypted settings and a safe audit record. Failure leaves existing settings
unchanged. The endpoint permits five save attempts per minute per IP.
GET and PUT return `{ "success": true, "data": { ... } }` with host, port,
secure, user, from, frontendUrl, passwordConfigured, configured, source and updatedAt.
Neither plaintext passwords nor ciphertext are returned. `source` is `database`
or `environment`; `configured` indicates a host exists, not confirmed delivery.

Validation errors return 400, authentication errors 401, authorization errors 403,
rate limiting 429, and connection/unlock failures 503 with safe messages. Database
errors follow the standard backend error contract. New authentication messages
read the saved configuration each time; database/unlock errors do not silently
fall back to another transport. Environment configuration remains the fallback
only when no saved configuration exists.

SMTP verification does not prove sender acceptance or inbox delivery; see
[Nodemailer verification documentation](https://nodemailer.com/smtp#verifying-the-configuration).
See [the runbook](../RUNBOOK.md#authentication-email-delivery) for encryption-key
backup and deployment requirements.
