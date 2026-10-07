# Renders the Discord store SKU images. Needs macOS (Chrome, SF Pro) and ImageMagick.
import subprocess, pathlib, tempfile
OUT = pathlib.Path(__file__).resolve().parent
TMP = pathlib.Path(tempfile.mkdtemp())
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

BUBBLE = "M35 16.763V29.2802C35 30.7912 33.7539 32 32.25 32H26L20.8164 36.015C20.4727 36.274 20 36.0581 20 35.6264V32H15.75C14.2031 32 13 30.748 13 29.2802V16.763C13 15.2088 14.2031 14 15.75 14H32.25C33.7969 14 35 15.252 35 16.763Z"
BIG = "M25 16.9863C25 16.7671 25.1458 16.5479 25.3281 16.4749L29.4479 14.3927L31.4896 10.3014C31.7083 9.89954 32.3281 9.89954 32.5469 10.3014L34.5885 14.3927L38.7083 16.4749C38.8906 16.5479 39 16.7671 39 16.9863C39 17.2055 38.8906 17.4247 38.7083 17.4977L34.5885 19.5799L32.5469 23.7078C32.4375 23.8904 32.2552 24 32 24C31.8177 24 31.599 23.8904 31.4896 23.7078L29.4479 19.5799L25.3281 17.4977C25.1458 17.4247 25 17.2055 25 16.9863Z"
SMALL = "M24 23L22.1562 23.7812C22.0625 23.8438 22 23.9062 22 24C22 24.0938 22.0625 24.1875 22.1562 24.25L24 25L24.7812 26.875C24.8437 26.9687 24.9062 27 25 27C25.0938 27 25.1875 26.9687 25.25 26.875L26 25L27.875 24.25C27.9687 24.1875 28 24.0938 28 24C28 23.9062 27.9687 23.8438 27.875 23.7812L26 23L25.25 21.1563C25.1875 21.0625 25.0938 21 25 21C24.9062 21 24.8437 21.0625 24.7812 21.1563L24 23Z"

TIERS = {
  "premium": dict(name="Premium", tagline="Unlock every feature for your server.", bubble="#237FEB", spark="#FCD34D", glow="rgba(35,127,235,.35)"),
  "ultimate": dict(name="Ultimate", tagline="For servers that outgrow Premium.", bubble="#FCD34D", spark="#FFFFFF", glow="rgba(251,146,60,.30)"),
}
BG = "#1e1f22"

def mark(t):
    return f'''<svg viewBox="9 6 34 34" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
<path d="{BUBBLE}" fill="{t['bubble']}"/><path d="{BIG}" fill="{t['spark']}"/><path d="{SMALL}" fill="{t['spark']}"/></svg>'''

BASE = "*{margin:0;padding:0;box-sizing:border-box}html,body{background:transparent;overflow:hidden}body{font-family:'SF Pro Display',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}"

def banner(key, t, lifetime):
    pill = '<span class="pill">Lifetime</span>' if lifetime else ""
    return f'''<!doctype html><html><head><style>{BASE}
.c{{position:relative;width:680px;height:240px;background:{BG};overflow:hidden}}
.glow{{position:absolute;right:-12px;top:-30px;width:300px;height:300px;border-radius:50%;background:radial-gradient(closest-side,{t['glow']},transparent)}}
.mark{{position:absolute;right:48px;top:30px;width:180px;height:180px}}
.txt{{position:absolute;left:48px;top:50%;transform:translateY(-50%)}}
.row{{display:flex;align-items:center;gap:12px}}
.eb{{font-size:18px;font-weight:600;color:#dbdee1}}
.pill{{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#FCD34D;border:1px solid rgba(252,211,77,.45);padding:3px 8px;border-radius:999px}}
.title{{margin-top:2px;font-size:64px;line-height:1.1;font-weight:800;letter-spacing:-.02em;color:#FCD34D}}
.sub{{margin-top:8px;font-size:17px;font-weight:500;color:#949ba4}}
</style></head><body><div class="c"><div class="glow"></div><div class="mark">{mark(t)}</div>
<div class="txt"><div class="row"><div class="eb">Embed Generator</div>{pill}</div><div class="title">{t['name']}</div><div class="sub">{t['tagline']}</div></div>
</div></body></html>'''

def icon(key, t):
    return f'''<!doctype html><html><head><style>{BASE}
.c{{position:relative;width:250px;height:250px;background:{BG};overflow:hidden}}
.glow{{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,{t['glow']},transparent 62%)}}
.mark{{position:absolute;left:42px;top:36px;width:180px;height:180px}}
</style></head><body><div class="c"><div class="glow"></div><div class="mark">{mark(t)}</div></div></body></html>'''

def render(html, name, w, h):
    f = TMP / f"{name}.html"; f.write_text(html)
    raw = TMP / f"{name}@2x.png"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
        f"--window-size={w},{h}", f"--screenshot={raw}", f.as_uri()], check=True, capture_output=True)
    subprocess.run(["magick", str(raw), "-crop", f"{w*2}x{h*2}+0+0", "+repage", "-filter", "Lanczos", "-resize", f"{w}x{h}!", "-strip", str(OUT / f"{name}.png")], check=True)

for k, t in TIERS.items():
    render(banner(k, t, True), f"{k}-banner", 680, 240)
    render(icon(k, t), f"{k}-icon", 250, 250)
