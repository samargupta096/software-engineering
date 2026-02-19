# Security & Identity in Distributed Systems

A comprehensive guide to Identity, Authentication (AuthN), and Authorization (AuthZ) patterns.

---

## 1. Core Concepts

### AuthN vs AuthZ

| Concept | Question | Example |
| :--- | :--- | :--- |
| **Authentication (AuthN)** | "Who are you?" | Logging in with User/Password, Biometrics. |
| **Authorization (AuthZ)** | "What can you do?" | Checking if User has `admin:write` role. |

### The Identity Provider (IdP)
The central authority that manages user identities and issues tokens.
- **Examples**: Keycloak, Auth0, Okta, Azure AD.

---

## 2. Protocols

### OAuth 2.0
The industry standard framework for **delegated authorization**. It allows an app (Client) to access resources on behalf of a user (Resource Owner).

#### Common Flows (Grant Types)

1.  **Authorization Code Flow with PKCE** (Recommended)
    - Best for: Mobile Apps, SPAs, Web Server Apps.
    - **Steps**:
        1. Client redirects user to IdP login page.
        2. User logs in. IdP redirects back with `code`.
        3. Client exchanges `code` + `code_verifier` (PKCE) for `access_token` and `refresh_token`.
    - *Wait, why PKCE?* Proof Key for Code Exchange protects against code interception attacks.

2.  **Client Credentials Flow**
    - Best for: Machine-to-Machine (M2M) communication (e.g., Service A calling Service B).
    - **Steps**:
        1. Client sends `client_id` + `client_secret`.
        2. IdP returns `access_token`.
    - *Note*: No user involved here.

3.  **Device Authorization Flow**
    - Best for: IOT devices, Smart TVs (input constraints).
    - **Steps**: Show a code on TV, user enters it on phone.

### OpenID Connect (OIDC)
A thin identity layer on top of OAuth 2.0.
- **Goal**: AuthN (Authentication).
- **Artifact**: `ID Token` (JWT containing user profile info like name, email).
- **UserInfo Endpoint**: Standard API to get user details.

---

## 3. Token Formats

### JWT (JSON Web Token)
By-value token. Contains checks within itself.

- **Structure**: `Header.Payload.Signature`
- **Signing**:
    - `HS256`: Symmetric key (IdP and API share same secret). Fast, but tricky key management.
    - `RS256`: Asymmetric (IdP signs with Private Key, API checks with Public Key). Recommended.
- **Pros**: Stateless (API doesn't need to call DB).
- **Cons**: Cannot be revoked easily (need short TTL + Refresh Token rotation).

### Opaque Token
By-reference token. Just a random string: `7f3a1...`.

- **Mechanism**: API must call IdP (introspect endpoint) to validate.
- **Pros**: Instantly revokable.
- **Cons**: Latency (extra network hop for every request).

### Paseto (Platform-Agnostic Security Tokens)
Modern alternative to JWT/JOSE standards.
- **Why?** "Versioned" protocols prevent algorithm confusion attacks (e.g. forcing `Alg: None`).
- **Versions**: `v2` (ChaCha20-Poly1305), `v4`.

---

## 4. Common Security Patterns

### BFF (Backend For Frontend)
**Problem**: Storing tokens in LocalStorage is vulnerable to XSS.
**Solution**:
1.  Frontend calls a lightweight Backend (BFF).
2.  BFF handles OAuth flow.
3.  BFF stores tokens in **HttpOnly, Secure Cookies**.
4.  Frontend just makes calls to BFF with the cookie.

### Gateway Offloading
Authenticate at the edge (API Gateway).
- Gateway validates JWT.
- Forwards request to Microservice with decoded User Context (e.g. `X-User-Id: 123`).
- **Benefit**: Microservices don't need to handle complex auth logic.

### mTLS (Mutual TLS)
Verifying identity of **services** rather than users.
- Service A presents Client Cert.
- Service B presents Server Cert.
- **Benefit**: Zero-trust networking (encrypts traffic + strong identity).
- **Tools**: Istio, Linkerd.

### Token Exchange
When Service A needs to call Service B *on behalf of the user*.
- Service A sends its token to IdP.
- IdP returns a *new* token scoped for Service B.

---

## 5. Security Checklist
- [ ] Always use HTTPS.
- [ ] Short-lived Access Tokens (5-15 mins).
- [ ] Rotating Refresh Tokens.
- [ ] Use `HttpOnly` cookies for browser clients.
- [ ] Validate `aud` (Audience) and `iss` (Issuer) claims in JWT.
- [ ] Sanitize all inputs (OWASP Top 10).
