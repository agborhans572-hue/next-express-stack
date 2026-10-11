# CargoKite replica in Shiprion

The six public routes `/`, `/about`, `/tech`, `/news`, `/privacy`, and `/legal`
use locally stored content observed at https://cargokite.com on October 11, 2026.
Shipping, tracking, calculator, account, dashboard, support, and admin routes retain
their existing implementations.

`content/` contains sanitized HTML, the scoped reference stylesheet, the asset
manifest, and port coordinates. `public/cargokite/` contains the original images,
SVGs, videos, Helvetica Now Display fonts, and the Draco-compressed hero and vessel models.
The technology renderer uses the original camera waypoints, environment textures,
container coordinates, and the solid/wireframe material stages. The video error
poster is a frame extracted from the original technology preview video.
The Draco decoder is copied from the installed Three.js distribution and is served
locally. No CargoKite CMS or original application JavaScript is required at runtime.

`CargoKite.tsx` handles navigation, accessible menus/dialogs, FAQ, news pagination,
and forms. `motion.ts` owns GSAP/ScrollTrigger and Lenis lifecycles. `Vessel.tsx`
renders the local GLB and supplies fallbacks for unavailable WebGL or model loading.
The original consent and preference presentation is implemented in `CookieConsent.tsx`.
`team.ts` handles desktop portrait motion and accessible phone/tablet team profiles.
Reference styles, fonts, animations, and document changes are scoped to replica routes.

Contact and study forms use the existing `/api/contact` persistence and support
email workflow. Study messages begin with `[CargoKite custom study enquiry]`.
Newsletter signup uses `/api/newsletter/subscriptions`; normalized addresses are
stored uniquely, retries succeed, and failures retain the entered value. Apply
`lib/db/migrations/0004_newsletter_subscriptions.sql` through the existing migration
runner (`corepack pnpm --filter @workspace/db migrate`). Vercel production builds
also run the migration after a successful build and before publication; preview
builds leave production data untouched. The API specification and
generated clients include the new endpoint. Campaign delivery is outside this scope.

The map loads OpenStreetMap tiles only when visible, uses ordinary browser caching,
and keeps attribution and zoom controls visible. Selected ports are connected as
a visual preview; nautical routing, weather forecasts, and ETA calculations are
not provided by this implementation. The 243 port coordinates are matched to the
reference IDs using the [NGA World Port Index](https://msi.nga.mil/api/publications/download?type=view&key=16920959/SFH00000/UpdatedPub150.csv).
Tile use follows the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).

## Verification

Run typechecks, lint, formatting, asset verification, and the production build with
the repository's existing commands. Database tests require `DATABASE_URL` pointing
to an isolated PostgreSQL database; they apply migrations and clean up test records.
The completed API/database run passed 26 tests, including newsletter normalization,
duplicates, persistence failures, origin protection, rate limiting, and migration
application. Production browser runs passed 12 replica interaction scenarios and
the two existing shipping/account regression scenarios, including the complete
customer, staff, and admin workflow.

Production browser verification (PowerShell):

```powershell
$env:E2E_PREVIEW='true'
corepack pnpm test:e2e e2e/cargokite.spec.ts --workers=1
$env:CK_VISUAL_AUDIT='true'
corepack pnpm test:e2e e2e/cargokite.visual.spec.ts --workers=1
```

The visual audit writes screenshots and a broken-image/layout report under
`.cache/cargokite/visual` at 1500×865, 390×844, 820×1180, and 1920×1080. It covers
sections, fleet/vessel/milestone scroll stages, menus, contact/study/event dialogs,
and FAQ expansion. The live reference was inspected in the browser; captures are
stored in the ignored audit directory. The completed six-page audit includes 276
screenshots across 24 page/viewport combinations, with no broken images or
horizontal overflow. Updated vessel and consent captures are stored separately
in `.cache/cargokite/visual-updated` (27 captures; the updated audit passed). The requested <1% screenshot difference has
not been certified. A sampled headline mask comparison exceeded that target, and
video frames and camera trajectories require a separately synchronized comparison.

The existing complete shipping regression supports `E2E_FULL=true`. Set
`E2E_LOCAL_STORAGE=true` to use the local test-only S3 fixture for proof uploads and
downloads. This fixture validates application storage behavior, not S3 signatures
or production provider credentials.

`scripts/download-cargokite-assets.mjs` and `scripts/prepare-cargokite-content.py`
can regenerate the replica from browser DOM/asset captures in `.cache/cargokite`.
They do not access a CMS. The Python helper requires BeautifulSoup. Format regenerated
source with Prettier before running repository checks.
