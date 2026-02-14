# Cart Page – Design & Typography Review

## Overall
The cart page is already in good shape: clear hierarchy, consistent spacing, and a modern look with the Order Summary sidebar, promo block, and recommendation sections. Below are **optional** tweaks to make it feel cooler and more on-trend; nothing is required.

---

## Design tweaks (optional)

### 1. **Page title & subtitle**
- Add **`tracking-tight`** to the main heading for a slightly more polished look.
- Subtitle (“X items in your cart”): use **`text-gray-500 dark:text-gray-400`** and **`leading-snug`** for a bit more consistency with secondary text elsewhere.

### 2. **Empty state**
- Icon: consider **`text-gray-400 dark:text-gray-500`** so it feels softer and less heavy.
- “Start Shopping” CTA: already strong; optional **`rounded-xl`** and **`shadow-md hover:shadow-lg`** for a more pill-like, trendy button.

### 3. **Cart item cards**
- Cards already use **`rounded-xl`** and **`border-l-4`** – good and consistent.
- Product names: keep **`font-bold`**; optional **`tracking-tight`** and **`leading-snug`** for multi-line names.
- Prices: already clear (pink/green); no change needed.

### 4. **Order Summary**
- Header already has icon + title; optional **`tracking-tight`** on “Order Summary”.
- Free delivery progress: already clear; optional **`rounded-full`** on the bar (already rounded) and slightly **thicker bar** (e.g. **`h-2.5`**) for visibility.

### 5. **Promo code block**
- Input and Apply button already look modern.
- Optional: **`rounded-xl`** on the Apply button to align with card radius.

### 6. **You May Also Like**
- Section accents (amber / emerald / slate) and compact cards are already in place.
- Optional: **`tracking-tight`** on section titles for consistency with the rest of the page.

### 7. **Sticky footer**
- Already compact and aligned with PDP button height; no change needed.

### 8. **Loading state**
- “Loading cart...” text: optional **`text-gray-500 dark:text-gray-400`** and **`font-medium`** so it matches other secondary states.

---

## Typography summary
- **Headings:** Consider **`tracking-tight`** and **`leading-tight`** / **`leading-snug`** on main headings and card titles.
- **Body/secondary:** Keep **`text-sm`** / **`text-xs`**; use **`text-gray-500 dark:text-gray-400`** for less emphasis.
- **Consistency:** You already use a clear scale (text-xs → text-2xl/3xl); no big changes needed.

---

## Lazy loading

**Recommendation: yes, use lazy loading on the cart page.**

- **Cart item images:** Usually a few items; first 1–2 may be above the fold. Rest can be lazy loaded.
- **You May Also Like:** Multiple product images below the fold; **lazy loading is useful** and reduces initial load.
- **Saved for Later / deal cards:** Same idea; images below the fold benefit from **`loading="lazy"`**.

**Implementation:** Add **`loading="lazy"`** to all **`<img>`** tags on the cart page. Browsers still load visible images quickly; off-screen images load when near the viewport. No need for `next/image` only for this; native lazy loading is enough and is already applied in the codebase.

---

## Verdict
- **Design:** The page already has a cool, modern layout (cards, accents, progress bar, compact footer). The suggestions above are small refinements, not must-fixes.
- **Lazy loading:** **Recommended** and implemented for cart and recommendation images.
