import os
from PIL import Image, ImageDraw, ImageFont

SCALE = 4
WIDTH, HEIGHT = 1080 * SCALE, 1080 * SCALE
BG = (2, 68, 31)
WHITE = (255, 255, 255)

def sc_val(v):
    return int(round(v * SCALE))

def sc_poly(pts):
    return [(int(round(x * SCALE)), int(round(y * SCALE))) for x, y in pts]

def render_full_logo(scale=4):
    w, h = 1080 * scale, 1080 * scale
    img = Image.new('RGB', (w, h), BG)
    draw = ImageDraw.Draw(img)

    # 3 rects of mark
    draw.rectangle([int(round(431*scale)), int(round(268*scale)), int(round(500*scale)), int(round(324*scale))], fill=WHITE)
    draw.rectangle([int(round(555*scale)), int(round(268*scale)), int(round(625*scale)), int(round(324*scale))], fill=WHITE)
    draw.rectangle([int(round(500*scale)), int(round(324*scale)), int(round(555*scale)), int(round(608*scale))], fill=WHITE)

    # T
    t1 = [(int(round(x*scale)), int(round(y*scale))) for x, y in [(232, 663), (328, 663), (328, 705), (297, 705), (297, 785), (263, 785), (263, 705), (232, 705)]]
    draw.polygon(t1, fill=WHITE)

    # N
    n = [(int(round(x*scale)), int(round(y*scale))) for x, y in [(484, 785), (484, 663), (514, 663), (558, 727), (558, 663), (590, 663), (590, 785), (560, 785), (516, 721), (516, 785)]]
    draw.polygon(n, fill=WHITE)

    # T
    t2 = [(int(round(x*scale)), int(round(y*scale))) for x, y in [(598, 663), (694, 663), (694, 705), (663, 705), (663, 785), (629, 785), (629, 705), (598, 705)]]
    draw.polygon(t2, fill=WHITE)

    # O 1
    draw.ellipse([int(round((403 - 61)*scale)), int(round((725.5 - 62.5)*scale)), int(round((403 + 61)*scale)), int(round((725.5 + 62.5)*scale))], fill=WHITE)
    draw.ellipse([int(round((403 - 28)*scale)), int(round((725.5 - 29.5)*scale)), int(round((403 + 28)*scale)), int(round((725.5 + 29.5)*scale))], fill=BG)

    # O 2
    draw.ellipse([int(round((781 - 61)*scale)), int(round((725.5 - 62.5)*scale)), int(round((781 + 61)*scale)), int(round((725.5 + 62.5)*scale))], fill=WHITE)
    draw.ellipse([int(round((781 - 28)*scale)), int(round((725.5 - 29.5)*scale)), int(round((781 + 28)*scale)), int(round((725.5 + 29.5)*scale))], fill=BG)

    # Text 'Clothing'
    font_path = 'C:/Windows/Fonts/segoeuil.ttf'
    target_width = 238 * scale
    font_size = int(58 * scale)
    font = ImageFont.truetype(font_path, font_size)

    text = 'Clothing'
    raw_bbox = font.getbbox(text)
    raw_w = raw_bbox[2] - raw_bbox[0]

    extra_space = (target_width - raw_w) / (len(text) - 1) if len(text) > 1 else 0
    cur_x = 411 * scale
    ascent, descent = font.getmetrics()
    cur_y = int(round(858 * scale - ascent))

    for char in text:
        draw.text((cur_x, cur_y), char, font=font, fill=WHITE)
        cb = font.getbbox(char)
        cw = cb[2] - cb[0]
        cur_x += cw + extra_space

    return img

def render_mark_icon(size=256):
    # Renders the 3-rect T mark centered on #02441F
    scale = 4
    w, h = size * scale, size * scale
    img = Image.new('RGB', (w, h), BG)
    draw = ImageDraw.Draw(img)

    # Mark bounds in 1080 space: x from 431 to 625 (w=194), y from 268 to 608 (h=340)
    # Center it in w, h with 25% padding
    target_h = h * 0.62
    s = target_h / 340.0
    ox = (w - (194 * s)) / 2.0 - (431 * s)
    oy = (h - (340 * s)) / 2.0 - (268 * s)

    def tx(x, y, rw, rh):
        return [int(round(ox + x*s)), int(round(oy + y*s)), int(round(ox + (x+rw)*s)), int(round(oy + (y+rh)*s))]

    draw.rectangle(tx(431, 268, 69, 56), fill=WHITE)
    draw.rectangle(tx(555, 268, 70, 56), fill=WHITE)
    draw.rectangle(tx(500, 324, 55, 284), fill=WHITE)

    return img.resize((size, size), Image.Resampling.LANCZOS)

def main():
    print("Generating full master logo...")
    high_res = render_full_logo(scale=4)
    logo_1080 = high_res.resize((1080, 1080), Image.Resampling.LANCZOS)

    os.makedirs('public/assets', exist_ok=True)
    logo_1080.save('public/assets/tonto-logo-1080.png', 'PNG', optimize=True)
    print("Saved public/assets/tonto-logo-1080.png")

    logo_512 = high_res.resize((512, 512), Image.Resampling.LANCZOS)
    logo_512.save('public/android-chrome-512x512.png', 'PNG', optimize=True)
    print("Saved public/android-chrome-512x512.png")

    logo_192 = high_res.resize((192, 192), Image.Resampling.LANCZOS)
    logo_192.save('public/android-chrome-192x192.png', 'PNG', optimize=True)
    print("Saved public/android-chrome-192x192.png")

    logo_180 = high_res.resize((180, 180), Image.Resampling.LANCZOS)
    logo_180.save('public/apple-touch-icon.png', 'PNG', optimize=True)
    print("Saved public/apple-touch-icon.png")

    # OG Image: 1200x630 with logo centered on #02441F
    print("Generating OG image (1200x630)...")
    og_img = Image.new('RGB', (1200, 630), BG)
    og_logo_size = 480
    og_logo = high_res.resize((og_logo_size, og_logo_size), Image.Resampling.LANCZOS)
    og_x = (1200 - og_logo_size) // 2
    og_y = (630 - og_logo_size) // 2
    og_img.paste(og_logo, (og_x, og_y))
    og_img.save('public/assets/og-image.png', 'PNG', optimize=True)
    print("Saved public/assets/og-image.png")

    # Favicons: use mark icon for maximum clarity at 16, 32, 48
    print("Generating crisp favicons...")
    fav16 = render_mark_icon(16)
    fav32 = render_mark_icon(32)
    fav48 = render_mark_icon(48)
    fav64 = render_mark_icon(64)

    fav16.save('public/favicon-16x16.png', 'PNG')
    fav32.save('public/favicon-32x32.png', 'PNG')
    fav48.save('public/favicon-48x48.png', 'PNG')
    fav64.save('public/favicon-64x64.png', 'PNG')

    # Multi-resolution favicon.ico
    fav32.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print("Saved public/favicon.ico")

    # Remove temporary files
    if os.path.exists('test_rendered_logo.png'):
        os.remove('test_rendered_logo.png')
    if os.path.exists('test-logo.png'):
        os.remove('test-logo.png')
    if os.path.exists('test.png'):
        os.remove('test.png')

    print("All raster logo assets successfully generated!")

if __name__ == '__main__':
    main()
