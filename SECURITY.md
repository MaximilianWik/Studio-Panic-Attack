# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Current         |
| < 1.0   | ❌ No patches      |

Only the latest deployment on `main` receives security fixes. There are no LTS branches.

## Scope

Studio Panic Attack is a client-side portfolio site (React SPA on Vercel). There is no backend, no database, no authentication, and no user-submitted data. The attack surface is limited to:

- **Third-party CDN assets** — images proxied through `images.weserv.nl`, fonts from `cdn.jsdelivr.net`.
- **Client-side dependencies** — npm packages (`three`, `drei`, `zustand`, `@paper-design/shaders-react`, etc.).
- **Vercel deployment config** — `vercel.json` rewrites.

## Reporting a Vulnerability

If you discover a security issue (e.g., XSS via a dependency, a CDN compromise vector, or an exposed secret):

1. **Do NOT open a public GitHub Issue.**
2. Email **max.wik@icloud.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected component/dependency
   - Suggested fix (if you have one)
3. You'll receive an acknowledgement within 48 hours.
4. A fix will be deployed as soon as practical (typically same day for client-side issues).

## What Doesn't Qualify

- Visual bugs or broken layouts (use Issues instead)
- Performance problems
- Accessibility issues (use Issues)
- Vulnerabilities in development-only dependencies that don't ship to production

## Dependencies

The production bundle ships only client-side JavaScript. Key dependencies are audited via `npm audit` before deployment. If you notice a dependency with a known CVE that affects the production bundle, please report it via the process above.

## Disclosure

Once a fix is deployed, the vulnerability will be acknowledged in the CHANGELOG. Credit is given to reporters unless they prefer to remain anonymous.
