# Homepage banner upload specifications

Fixed container aspect ratio + `object-fit: contain`. No cropping, no distortion. Upload at these sizes for an exact fit.

## Desktop (laptop and larger)

| Property        | Value        |
|----------------|--------------|
| **Aspect ratio** | **32:10** (strict) |
| **Recommended size** | **1280 × 400 px** |
| **Used for** | "Banner image" (main/desktop) |
| **Display** | Container width 100%, height from `aspect-ratio: 32/10`. Image: `object-fit: contain` – fully visible. |

## Mobile

| Property        | Value        |
|----------------|--------------|
| **Aspect ratio** | **5:3** (strict) |
| **Recommended size** | **600 × 360 px** |
| **Used for** | "Banner image (mobile)" |
| **Display** | Container width 100%, height from `aspect-ratio: 5/3`. Image: `object-fit: contain` – fully visible. |

## Display behaviour

- **Container:** Height is from CSS `aspect-ratio` only (no fixed px height, no max-height that changes the ratio).
- **Image:** `object-fit: contain` – image is never cropped or stretched; it fits exactly inside the container. If the upload matches the ratio (1280×400 or 600×360), it fills the box with no letterboxing.
- **Different ratio:** If the uploaded image has a different aspect ratio, it will show in full with letterboxing (empty bands) so nothing is cropped.
