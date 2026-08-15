# Mobile2 authentication contract

The mobile app uses the existing custom SAIS authentication routes mounted at `/api/auth/*` and `/api/v1/auth/*`. Login accepts the backend identifier/password contract; refresh and logout remain cookie-backed server operations, while the returned access credential is kept in Expo SecureStore.

The current backend does not expose a dedicated application-token validation endpoint or device-enrollment API. Mobile2 therefore stores an application token securely and presents the enrollment boundary without pretending validation succeeded. A future backend contract should define validation, token identity, device status, tenant binding, and revocation before this screen becomes an online enrollment flow.

Role routing is derived from the authenticated backend session: owner, tenant, administrator, or staff. No local account creation, password hashing, permission elevation, or second database is introduced.
