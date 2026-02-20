#!/usr/bin/env python3
"""
generate-icons.py
Generates minimal NoPhoton icon PNGs (16x16, 48x48, 128x128).
Requires: Pillow  (pip install Pillow)
"""
import sys
import os

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow not found. Installing...")
    os.system(f"{sys.executable} -m pip install Pillow -q")
    from PIL import Image, ImageDraw, ImageFont

SIZES = [16, 48, 128]
BG_COLOR    = (0, 0, 0, 255)          # black
TEXT_COLOR  = (255, 255, 255, 255)    # white
ACCENT      = (77, 255, 145, 255)     # green accent


def make_icon(size: int, out_dir: str):
    img  = Image.new("RGBA", (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Outer rounded-rect border in accent colour
    border = max(1, size // 12)
    draw.rounded_rectangle(
        [border, border, size - border - 1, size - border - 1],
        radius=size // 5,
        outline=ACCENT,
        width=border,
    )

    # Letter "N" centred
    font_size = int(size * 0.55)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except (IOError, OSError):
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), "N", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    draw.text((x, y), "N", font=font, fill=TEXT_COLOR)

    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"icon{size}.png")
    img.save(path, "PNG")
    print(f"    Created {path}")


if __name__ == "__main__":
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "extension/icons"
    for s in SIZES:
        make_icon(s, out_dir)
    print("    Icons generated successfully.")
