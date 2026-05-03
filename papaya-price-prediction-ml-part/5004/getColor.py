from PIL import Image
import numpy as np
import colorsys

# ── HSV hue ranges (0–1 scale) ───────────────────────────────────────────────
#   green           : hue 0.22–0.42  (unripe green skin)
#   yellow          : hue 0.12–0.22  (half-ripe turning yellow)
#   vivid orange    : hue 0.04–0.12  AND  saturation >= 0.65  (market-ready bright orange)
#   faded/dark      : hue 0.04–0.12  AND  saturation <  0.65  (overripe brownish → counted as yellow)
#                   + hue < 0.04 or > 0.90 (dark red-brown, overripe)
#
# Key insight: market-ready and overripe both have hue in the orange zone (~0.08-0.12),
# but overripe has LOWER saturation (faded/brown) while market-ready is vivid.
# Using saturation=0.65 as threshold cleanly separates them:
#   Market ready  → orange_ratio ≈ 0.80,  yellow_ratio ≈ 0.20
#   Overripe      → orange_ratio ≈ 0.66,  yellow_ratio ≈ 0.32
# ─────────────────────────────────────────────────────────────────────────────

SAT_THRESHOLD = 0.65   # saturation cutoff: vivid orange vs faded/brown


def _center_pixels(image_file):
    """Open image, return filtered centre-circle pixels as float32 (N,3) array."""
    img = Image.open(image_file).convert('RGB').resize((150, 150))
    cx = cy = 75
    radius = 50
    pixels = []
    for y in range(max(0, cy - radius), min(150, cy + radius)):
        for x in range(max(0, cx - radius), min(150, cx + radius)):
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2:
                pixels.append(img.getpixel((x, y)))

    px = np.array(pixels, dtype=np.float32)
    mask = (
        (px[:, 0] > 10) & (px[:, 0] < 245) &
        (px[:, 1] > 10) & (px[:, 1] < 245) &
        (px[:, 2] > 10) & (px[:, 2] < 245)
    )
    return px[mask] if mask.sum() > 10 else px


def get_dominant_color(image_file) -> str:
    """Return median hex colour of centre region (unchanged signature)."""
    px = _center_pixels(image_file)
    median = np.median(px, axis=0).astype(int)
    return '#{:02X}{:02X}{:02X}'.format(*median)


def _hsv_ratios(image_file):
    """
    Compute HSV-based green / yellow / orange ratios from a papaya image.

    Returns
    -------
    (green_ratio, yellow_ratio, orange_ratio) — all floats in [0, 1], sum ~= 1

    Stage profiles (from real image analysis):
        0 Unripe        green ~0.94, yellow ~0.06, orange ~0.00
        1 Half ripe     green ~0.00, yellow ~0.99, orange ~0.01
        2 Market ready  green ~0.00, yellow ~0.20, orange ~0.80
        3 Overripe      green ~0.00, yellow ~0.32, orange ~0.66
    """
    px = _center_pixels(image_file)

    hsv = np.array(
        [colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0) for r, g, b in px]
    )
    h = hsv[:, 0]
    s = hsv[:, 1]

    colored = s > 0.15
    if colored.sum() < 10:
        colored = np.ones(len(s), dtype=bool)

    hc = h[colored]
    sc = s[colored]
    n  = len(hc) + 1e-9

    green_mask        = (hc >= 0.22) & (hc < 0.42)
    yellow_mask       = (hc >= 0.12) & (hc < 0.22)
    vivid_orange_mask = (hc >= 0.04) & (hc < 0.12) & (sc >= SAT_THRESHOLD)
    faded_orange_mask = (hc >= 0.04) & (hc < 0.12) & (sc <  SAT_THRESHOLD)
    dark_mask         = (hc < 0.04)  | (hc >= 0.90)

    # faded orange (brownish overripe) → lumped with yellow to lower orange_ratio for stage 3
    green_ratio  = round(float(green_mask.sum() / n), 4)
    yellow_ratio = round(float((yellow_mask.sum() + faded_orange_mask.sum()) / n), 4)
    orange_ratio = round(float((vivid_orange_mask.sum() + dark_mask.sum()) / n), 4)

    return green_ratio, yellow_ratio, orange_ratio


def hex_to_rgb(hex_color: str) -> tuple:
    hex_color = str(hex_color).lstrip('#')
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))