# Local SEO — read-only audit, 2026-11-23

## Scope and evidence boundary

- Project: Florial, Bulgaria; current official domain: https://florial-bg.com.
- Audit mode: read-only public web review, Google Maps public listings linked from the current Contacts page, current GitHub `main` source, and raw Production HTML.
- GitHub main at audit start: `5e71b6216fff71c83e0e776e8572ce81a5df0a5a`.
- Source files checked: `src/pages/ContactsPage.tsx` (blob `3610b2c9eb04faefe250db726398f164f96d52c6`) and `functions/_middleware.ts` (blob `46bc2ccc9418fc9629ef8180b918c3128da58179`).
- Production `/contacts` raw HTML returned HTTP 200. The raw HTML contains three JSON-LD scripts (two `GardenStore` entities and one `Organization`). The processed HTML format used by one scraper strips script tags; the raw HTML was inspected separately. No conclusion of missing JSON-LD is made.
- No Google Business Profile edits, ownership changes, listing edits, site code changes, Sanity writes, Cloudflare changes, or external directory edits were performed.
- Public profile data does not expose owner/manager verification status. That status is **NOT VERIFIED**.
- No authoritative backlink-index account/report was available in this pass; external mentions below are a public indexed-web sample, not an exhaustive backlink audit.

## 1. Public Google Business Profile / Maps listings

The current Florial Contacts page links to two distinct Google Maps place records.

### Nessebar

- Public name: **Градински център "Флориал"**
- Google Maps place ID: `0x40a69fd59848a673:0x2331466297f7741e`
- Current site Maps link: https://maps.app.goo.gl/pK8qGHh9b1xoCc4P9
- Public address: **ul. "Han Krum", 8230 Nessebar, Bulgaria**
- Public phone: **+359 87 677 7902**
- Website shown by Google: **https://florial-bg.com/**
- Public category shown: **Plant nursery**. The structured business result also exposes Nursery, Garden centre, Landscaper, Lawn irrigation equipment supplier, Lawn sprinkler system contractor and Sod supplier.
- Public hours shown by Google: Monday–Saturday **08:00–17:00**; Sunday **09:00–17:00**.
- Public snapshot: **5.0 / 8 reviews**, approximately **125 photos**.
- The name, address, main Bulgarian phone and website are broadly consistent with the current site. The hours and schema telephone are not consistent; see sections 2–3.

### Ravda

- Public name: **Florial / Флориал**
- Google Maps place ID: `0x40a69f9e692b5a39:0x58dec2acf022e764`
- Current site Maps link: https://maps.app.goo.gl/3fiLaRgwSLDTH77U6
- Public address: **Чешме тарла, 8238 Ravda, Bulgaria**
- Public phone: **+359 87 705 5605**
- Public website: **not displayed** in the public Maps listing.
- Public category shown: **Garden center**.
- Public hours currently displayed: Monday–Thursday **08:00–17:00**; Friday **00:30–17:00**; Saturday **00:00–01:00**; Sunday **08:00–17:00**. Friday/Saturday values appear anomalous and must not be treated as reliable without owner confirmation.
- Public snapshot: **5.0 / 2 reviews**, **2 photos**.
- This is a separate public Maps record, not merely a service-area mention. **OWNER CONFIRMATION (23.11.2026): Ravda is a new, active Florial garden centre where customers can visit in person.** Treat it as a genuine customer-facing location with its own Maps record and `GardenStore` entity; do not merge it with Nessebar or treat it as service-area-only.

## 2. NAP and contact consistency

### Current official website

- Homepage/footer identifies **Градински център „Флориал“**.
- Main Bulgarian phone: **+359 876 777 902**.
- Additional ENG / UA / RU phone: **+359 885 834 860**.
- WhatsApp: **+380 67 480 74 86**.
- Footer nursery address: **ул. „Хан Крум“, 8230 Несебър**.
- `/contacts` displays two location cards. Nessebar has the full street address and Janet landmark; Ravda is displayed only as **„с. Равда, България“**, with a Google Maps link. The detailed Maps address for Ravda is not shown in the card.
- The contacts page displays one shared schedule: Monday–Saturday **09:00–18:00**; Sunday is not explicitly listed (the additional holiday row says Resurrection is closed). The same schedule is visually shared by both location cards.
- The contact block lists the two general language phones, but does not associate the Ravda Maps phone **+359 87 705 5605** with the Ravda card.

### Confirmed public mismatches

1. **Nessebar phone in LocalBusiness JSON-LD:** the live `GardenStore` entity uses `+359885834860`, while the current site labels `+359876777902` as the Bulgarian contact number and the Google Maps profile also uses `+359876777902`. This is a concrete structured-data NAP mismatch.
2. **Nessebar hours:** the website Contacts page says 09:00–18:00 Monday–Saturday; Google Maps says 08:00–17:00 Monday–Saturday and 09:00–17:00 Sunday; JSON-LD says 09:00–17:00 Monday–Friday only. The true current hours must be confirmed before any correction.
3. **Ravda phone:** the Google Maps listing and Ravda JSON-LD both use +359877055605, but the current Contacts page does not show this number beside the Ravda location. The shared contact block instead shows the two general language numbers.
4. **Ravda address:** Maps and JSON-LD use Чешме тарла, 8238 Ravda; the public Contacts card only says Ravda, Bulgaria.
5. **Ravda hours:** the Contacts page applies the shared 09:00–18:00 schedule; JSON-LD omits hours; Google Maps contains anomalous Friday/Saturday values. Do not copy the malformed Maps values into the site/schema.

## 3. Live GardenStore / Organization structured data

Raw Production HTML for `https://florial-bg.com/contacts` contains three JSON-LD entities:

### Nessebar GardenStore

- `@type: GardenStore`
- `@id: https://florial-bg.com/#store-nessebar`
- Name: `Florial — градински център Несебър`
- URL: `https://florial-bg.com/contacts`
- Telephone: `+359885834860` — differs from the main BG phone on the site and Google Maps.
- Address: ул. „Хан Крум“, 8230, Несебър, BG — matches the public location.
- Opening hours: Monday–Friday 09:00–17:00 only — differs from both current page text and public Maps hours.
- Parent organization: `https://florial-bg.com/#organization`.

### Ravda GardenStore

- `@type: GardenStore`
- `@id: https://florial-bg.com/#store-ravda`
- Name: `Florial — градински център Равда`
- URL: `https://florial-bg.com/contacts`
- Telephone: `+359877055605` — matches the public Maps listing.
- Address: Чешме тарла, 8238, Равда, BG — matches the public Maps listing, but is more specific than the current Contacts card.
- Opening hours: absent.
- Parent organization: `https://florial-bg.com/#organization`.

### Organization

- `@type: Organization`, `@id: https://florial-bg.com/#organization`.
- Name and URL are Florial / `https://florial-bg.com`.
- `areaServed` is set to Bulgaria.
- `sameAs` is not present. The live footer links to a Facebook share URL and an Instagram profile URL with tracking parameters; canonical official profile URLs should be confirmed before adding `sameAs`.

The implementation is in `functions/_middleware.ts`. The public contact cards and shared hours are in `src/pages/ContactsPage.tsx`. These findings are **verified in current main source and in raw Production HTML**, not inferred from an old report.

## 4. Service areas and local relevance

- Current website footer service-area list: **Несебър, Равда, Слънчев бряг, Свети Влас, Поморие, Ахелой, Тънково, Кошарица, Каблешково** and nearby settlements.
- Current homepage metadata also mentions **Бургас**.
- Older `drop.od.ua` pages list a broader set including **Бургас, Варна, Каменар** and the core Nessebar/Ravda area.
- `palmandolivetrees.com`, which uses Florial branding and the main phone, states on-site service in Burgas and Varna. Ownership/operational relationship of this site to the current Florial domain is **NOT VERIFIED**.
- These are not necessarily contradictory: some places may be service areas, some delivery areas, and some locations where the company no longer offers on-site work. The actual current service area must be confirmed before normalizing citations or schema.
- Prior GSC geo-filtered Bulgarian query sample: **3 impressions / 0 clicks**. This is too small to assess local demand or city-level rankings.

## 5. Public citations and external mentions found

This is a limited public-search sample, not a complete citation or backlink inventory.

1. [iBusiness.bg — Градински център „Флориал“](https://www.ibusiness.bg/bulgaria/nessebar/%D0%BC%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD%D0%B8/%D0%B3%D1%80%D0%B0%D0%B4%D0%B8%D0%BD%D1%81%D0%BA%D0%B8-%D1%86%D0%B5%D0%BD%D1%82%D1%8A%D1%80-%D1%84%D0%BB%D0%BE%D1%80%D0%B8%D0%B0%D0%BB) — name and Nessebar / Han Krum address are present; phone field is empty; website points to legacy `https://www.drop.od.ua/bg`, not the current official domain.
2. [Legacy DROP contact page](https://www.drop.od.ua/bg/location) and [legacy garden-centre page](https://www.drop.od.ua/bg/post/garden-center-florial-nessebar) — historically showed the main phone +359876777902, Nessebar / Han Krum address, 09:00–18:00 hours and a wider service-area list. **OWNER CONFIRMATION (23.11.2026): the Bulgarian-language legacy DROP pages now redirect to the current Bulgarian Florial website.** Therefore, the legacy URL appearing in an old citation is not by itself evidence of a live competing Bulgarian website. The exact redirect chain and page-to-page destination mapping were not independently tested in this audit.
3. [Palms and Olive Trees — Nessebar](https://www.palmandolivetrees.com/) — Florial-branded plant site shows +359876777902 and 09:00–18:00 hours, and mentions on-site services in Burgas and Varna. Whether this is an official sister site/current business property needs owner confirmation.
4. [Dun & Bradstreet — FLORIAL LTD OOD](https://www.dnb.com/business-directory/bg/burgas/nesebar/other-miscellaneous-retailers/companies) — lists the legal company in Nessebar, but the surfaced listing does not provide the customer-facing NAP.
5. [Finansi.bg — FLORIAL OOD](https://finansi.bg/florial) — provides legal-entity registry details and a registered office address that differs from the public garden-centre address. Do not substitute the legal registered office for the customer-facing location in local citations.
6. A search of public garden-centre directory results did not surface a Florial entry in the sampled BUSINESS.bg category pages. This is not proof that no other listing exists.

No citation edits were performed. No authoritative backlink metrics were obtained.

## 6. Findings and priority order

### Owner confirmation required before changes

1. **CLOSED — Ravda status:** the owner confirmed that Ravda is a new active garden centre where customers can visit. Keep it as a separate physical Florial location; no merge/delete action is indicated.
2. **OPEN — hours:** confirm actual opening hours separately for Nessebar and Ravda, including Sunday and seasonal schedules.
3. **OPEN — phone assignment:** confirm the correct primary telephone for each location. Public evidence supports +359876777902 as the Nessebar main Bulgarian number and +359877055605 for the Ravda Maps record; +359885834860 is the additional ENG/UA/RU line.
4. **OPEN — service areas:** confirm current on-site service areas, especially Burgas and Varna, and distinguish them from delivery-only areas.
5. **OPEN — related web/social properties:** confirm whether `palmandolivetrees.com` is an official/current Florial property and which Facebook/Instagram pages are canonical official profiles. The owner has confirmed that the Bulgarian legacy DROP pages redirect to the current Bulgarian Florial website; exact redirect destinations have not been independently checked.

### Proposed remediation after confirmation and separate approval

- Align the Nessebar GardenStore telephone with the confirmed primary local number.
- Align opening hours between the site, each Google Maps profile and JSON-LD; keep location-specific schedules separate if they differ.
- If Ravda is a real public location, show its precise customer-facing address and phone on the Contacts page, and add the current official website URL to its Google profile. If it is not a public location, do not treat it as a branch or change/delete the profile without a separate decision.
- Confirm and normalize the service-area list; do not claim a city as an in-person service area if Florial only delivers there.
- Update the iBusiness website and phone fields if the listing is owner-controlled.
- Add canonical `sameAs` links only after confirming the official social profile URLs.
- Review current, location-specific photos and maintain genuine customer review requests; do not incentivize or fabricate reviews.
- Do not create thin city doorway pages. Keep local relevance tied to real service coverage, actual locations and useful existing service pages.

## 7. Close-out

- **Read-only Local SEO audit: COMPLETED.**
- **Remediation: NOT STARTED** — Ravda's physical customer-facing status and the legacy DROP redirect status have now been clarified by the owner. Remaining owner confirmations concern location-specific hours, phone assignment, current service areas and canonical related web/social properties.
- No Google Business Profile, external directory, website, Sanity, Cloudflare, D1, Resend or Production data was changed.
- Next owner decision: confirm actual hours for Nessebar and Ravda; then prepare a precise, separate remediation proposal. No public profile or site edits are authorized by these factual clarifications alone.
