import type { ProductFormProfile } from './productFormProfile';

const P_STYLE =
  "font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;";
const STRONG = 'style="color: #1f2937;"';
const SPAN = 'style="color: #6b7280;"';
const DOT = `<span style="color: #6b7280;">•</span>`;

/** Plain-text bullets for Product Description → Please Note (StructuredDescriptionEditor). */
export function getDefaultPleaseNoteBullets(profile: ProductFormProfile): string {
  if (profile === 'flowers') {
    return `• Vases, baskets, and props are for display only unless mentioned.
• Flower color and bloom may vary slightly due to season and availability.
• Handle gently, keep upright, and place in fresh water after delivery.`;
  }
  if (profile === 'sweets') {
    return `• Photos are indicative; piece shape, colour, garnish, or silver leaf may vary slightly by batch and season.
• Sweets and dry fruits are packed sealed for hygiene; net weight or piece count is as stated on the pack or your order where applicable.
• Store in a cool, dry place unless the product label says otherwise — keep away from heat, humidity, and direct sunlight.`;
  }
  if (profile === 'treats') {
    return `• Boards, linens, and props in images are for styling only unless clearly included with your order.
• Baked desserts and small treats may vary slightly in size, decoration, or colour finish by batch.
• Storage and how long they stay at their best depend on the product — follow any card or label included with your pack.`;
  }
  return `• Cake stands and cutlery shown in images are for display only and are not included with the cake.
• This cake is hand-delivered in a high-quality cardboard box.`;
}

const CAKE_CARE_HTML = `<p style="${P_STYLE}"><strong ${STRONG}>1). Refrigerate:</strong> <span ${SPAN}>Store cream cakes in a refrigerator. Fondant cakes should be kept in an air-conditioned environment. (Use a serrated knife to cut a fondant cake.)</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>2). Temperature:</strong> <span ${SPAN}>Slice and serve the cake at room temperature. Keep away from direct heat.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>3). Consumption:</strong> <span ${SPAN}>Consume the cake within 24 hours for best taste and freshness.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>4). Decorations:</strong> <span ${SPAN}>Some decorations may contain wires, toothpicks, or skewers - please check before serving to children.</span></p>

<p style="${P_STYLE} font-weight: 500; color: #1f2937; margin-top: 16px;">Enjoy your Creamingo cake! 🎂</p>`;

const FLOWERS_CARE_HTML = `<p style="${P_STYLE}"><strong ${STRONG}>1). Water:</strong> <span ${SPAN}>Trim stems and place in fresh, cool water. Change water daily.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>2). Placement:</strong> <span ${SPAN}>Keep away from sunlight, heat, AC vents, and fruits.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>3). Enjoyment:</strong> <span ${SPAN}>Best enjoyed within 2–4 days (varies by flowers).</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>4). Pets:</strong> <span ${SPAN}>Keep away from pets and small children.</span></p>

<p style="${P_STYLE} font-weight: 500; color: #1f2937; margin-top: 16px;">Enjoy your Creamingo flowers! 🌸</p>`;

const SWEETS_CARE_HTML = `<p style="${P_STYLE}"><strong ${STRONG}>1). Storage:</strong> <span ${SPAN}>Keep in a cool, dry place in the original or an airtight container. Refrigerate only if stated on the product label.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>2). After opening:</strong> <span ${SPAN}>Reseal packs promptly; use clean, dry hands or utensils. Protect from moisture, insects, and strong odours.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>3). Shelf life:</strong> <span ${SPAN}>Consume within the best-before or use-by date on packaging for the best taste and texture.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>4). Allergens &amp; diet:</strong> <span ${SPAN}>Products may contain nuts, milk, wheat, ghee, and other allergens — always read the physical pack label before consuming.</span></p>

<p style="${P_STYLE} font-weight: 500; color: #1f2937; margin-top: 16px;">Enjoy your Creamingo sweets &amp; treats! 🍬</p>`;

const TREATS_CARE_HTML = `<p style="${P_STYLE}"><strong ${STRONG}>1). Storage:</strong> <span ${SPAN}>Keep in a cool, dry place away from direct heat. Refrigerate items with fresh cream, custard, or cheese if stated on the pack or product card.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>2). Serving:</strong> <span ${SPAN}>For many pastries and brownies, bringing to room temperature for a few minutes improves flavour and texture — unless the label says serve chilled.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>3). Freshness:</strong> <span ${SPAN}>Small bakes are best enjoyed within the timeframe on the label; cream- and fruit-topped items are usually most enjoyable on the day of delivery.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>4). Toppings &amp; decor:</strong> <span ${SPAN}>Chocolate drizzles, nuts, and edible decor can shift in transit — handle gently. Some toppers may not be suitable for young children.</span></p>

<p style="${P_STYLE}"><strong ${STRONG}>5). Allergens:</strong> <span ${SPAN}>Baked goods may contain eggs, milk, nuts, wheat, and soy — always read the product label for your pack.</span></p>

<p style="${P_STYLE} font-weight: 500; color: #1f2937; margin-top: 16px;">Enjoy your Creamingo small treats! 🧁</p>`;

const CAKE_DELIVERY_HTML = `<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Packaging:</strong> <span ${SPAN}>Every Creamingo cake is hand-delivered in a sturdy, premium-quality box.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Complimentary items:</strong> <span ${SPAN}>Knives and message tags are included whenever available.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Timing:</strong> <span ${SPAN}>Delivery times are estimates and may vary by product and location.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Perishable nature:</strong> <span ${SPAN}>Cakes are perishable and will be delivered in a single attempt only.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Substitution policy:</strong> <span ${SPAN}>In rare cases, designs or flavours may vary slightly based on availability.</span></p>

<p style="margin-bottom: 20px;"></p>`;

const FLOWERS_DELIVERY_HTML = `<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Packaging:</strong> <span ${SPAN}>Arrangements are safely packed to keep flowers fresh during delivery.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Recipient:</strong> <span ${SPAN}>Ensure someone is available to receive and place them in water quickly.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Timing:</strong> <span ${SPAN}>Delivery time is an estimate and may vary due to external factors.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Fresh product:</strong> <span ${SPAN}>Flowers are perishable, so delivery is usually attempted once.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Substitutions:</strong> <span ${SPAN}>Substitutions may occur based on availability while maintaining style and value.</span></p>

<p style="margin-bottom: 20px;"></p>`;

const SWEETS_DELIVERY_HTML = `<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Packaging:</strong> <span ${SPAN}>Sweets and dry fruits are packed in food-safe pouches, boxes, or trays to protect them in transit.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Receipt:</strong> <span ${SPAN}>Inspect packs on delivery; store immediately as per care instructions on the label.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Timing:</strong> <span ${SPAN}>Delivery slots are estimates and may vary by location, weather, and traffic.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Food products:</strong> <span ${SPAN}>Edible items are time- and handling-sensitive; we typically complete delivery in one attempt at the agreed time.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Substitutions:</strong> <span ${SPAN}>Batch or stock availability may require thoughtful swaps of equal or greater value; outer packaging or tray style may vary.</span></p>

<p style="margin-bottom: 20px;"></p>`;

const TREATS_DELIVERY_HTML = `<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Packaging:</strong> <span ${SPAN}>Pastries, brownies, cookies, and similar items are boxed or sleeved to limit movement and protect toppings in transit.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Handling:</strong> <span ${SPAN}>Many items are delicate — place flat, avoid stacking heavy objects on the pack, and refrigerate promptly when required.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Timing:</strong> <span ${SPAN}>Delivery windows are estimates and may vary by location, weather, and kitchen batch times.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Perishable bakes:</strong> <span ${SPAN}>Fresh desserts are time-sensitive; we typically complete delivery in one attempt at the agreed time.</span></p>

<p style="${P_STYLE}">${DOT} <strong ${STRONG}>Substitutions:</strong> <span ${SPAN}>Minor decoration, drizzle, or packaging changes may occur based on ingredient availability; portion or flavour intent stays the same where possible.</span></p>

<p style="margin-bottom: 20px;"></p>`;

export function getDefaultCareStorageHtml(profile: ProductFormProfile): string {
  if (profile === 'flowers') return FLOWERS_CARE_HTML;
  if (profile === 'sweets') return SWEETS_CARE_HTML;
  if (profile === 'treats') return TREATS_CARE_HTML;
  return CAKE_CARE_HTML;
}

export function getDefaultDeliveryGuidelinesHtml(profile: ProductFormProfile): string {
  if (profile === 'flowers') return FLOWERS_DELIVERY_HTML;
  if (profile === 'sweets') return SWEETS_DELIVERY_HTML;
  if (profile === 'treats') return TREATS_DELIVERY_HTML;
  return CAKE_DELIVERY_HTML;
}
