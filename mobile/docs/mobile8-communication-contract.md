# Mobile8 communication contract

Confirmed backend routes under `/communications`: notification listing, unread count, mark-read, notification preferences, and delivery health. Mobile sends authenticated requests and keeps tenant/school context server-authoritative.

The inbox demo state is intentionally local until a session-backed query is connected. Push token registration, realtime delivery, attachments, outbound compose, broadcasts, deep-link entity resolution, and delivery retry APIs are not currently exposed by the backend and remain documented gaps.

Notification deep links must be internal paths only; external and protocol-relative URLs are rejected. Logout must clear cached notification and unread state.
