# mateeazy.in: landing page

Static site for **https://mateeazy.in**. Plain HTML, CSS and JS: no build step and no framework.

```
index.html        the page
styles.css        all styles (brand tokens at the top)
main.js           mobile menu, app tour (videos in the phone), match-score demo
404.html          not-found page
favicon.svg       house logo
robots.txt, sitemap.xml
assets/img/       photos, logo, QR code, Play badge, og-image (social preview)
assets/video/     app tour clips (<feature>.mp4) and their poster frames (<feature>.jpg)
```

## App tour clips

The phone in "See how MateEazy works" plays one short clip per feature. They are **not**
screen recordings: they're built the same way as the promo videos, from real app screens drawn
with made-up demo people (Ananya, Neha, Rohan, Priya; rooms in Bengaluru), so no real user's
name, photo or message can appear on the public site.

1. **Screens:** the Flutter app draws them with the demo data into `mateeazy_promo_video/public/web/`:
   ```bash
   cd matchmate_flutter
   flutter test test/tooling/website_screens_test.dart --dart-define=WEBSITE_SCREENS=true
   ```
2. **Clips:** Remotion animates taps, scrolls and screen changes (`mateeazy_promo_video/src/web/TourClips.tsx`)
   and writes `assets/video/<feature>.mp4` + `<feature>.jpg` here:
   ```bash
   cd mateeazy_promo_video
   scripts/render-web-clips.sh            # all clips
   scripts/render-web-clips.sh chat post  # just some
   ```
   To preview or adjust timing, run `npm run dev` there and open the **WebTour** folder.

Re-run both steps after a visible app change, so the site keeps matching the app.
In `index.html`, each tab's `data-video` / `data-poster` points at these files.

## Preview locally

```powershell
cd D:\Projects\personal\matchmate\mateeazy_website
npx http-server -p 8765 -c-1
# open http://127.0.0.1:8765
```

Opening `index.html` straight from disk won't work, because paths start with `/`.

## Things to keep in sync with the app

| On the site | Source of truth |
|---|---|
| Match-score demo (`main.js`, weights and scores) | `mateeazy_backend/.../service/MatchingHeuristicEngine.java` |
| Search radius "2 to 30 km" | `matchmate_flutter/.../discovery/presentation/search_preferences_sheet.dart` |
| Play Store link and QR (`assets/img/qr-play.svg`) | package `com.mateeazy.app` |
| Privacy / terms / delete-account links | the `mateeazy-legal` GitHub Pages site |

Regenerate the QR code if the Play link ever changes:
```powershell
npx qrcode@1.5.4 -t svg -e M -m 2 -d 2B1B3D -l FFF8F0 -o assets/img/qr-play.svg "https://play.google.com/store/apps/details?id=com.mateeazy.app"
```

---

## Deploy to the OCI VM (first time)

The site is served by nginx on the same VM as the API, next to `api.mateeazy.in` and `admin.mateeazy.in`.

### 1. DNS (Cloudflare, zone `mateeazy.in`)

| Type | Name | Content | Proxy status |
|---|---|---|---|
| `A` | `@` | `130.210.45.27` | **DNS only** (grey cloud) |
| `CNAME` | `www` | `mateeazy.in` | **DNS only** (grey cloud) |

If an `A`/`CNAME` record for `@` or `www` already exists (e.g. a parking page), edit it instead of adding a second one.

### 2. Copy the files to the VM (on Windows PowerShell)

```powershell
cd D:\Projects\personal\matchmate
scp -r mateeazy_website pkoci:~/mateeazy_website_upload
```

### 3. Put them in place (on the VM, `ssh pkoci`)

```bash
sudo mkdir -p /var/www/mateeazy-site
sudo rsync -a --delete --exclude README.md ~/mateeazy_website_upload/ /var/www/mateeazy-site/
sudo chown -R root:root /var/www/mateeazy-site
sudo find /var/www/mateeazy-site -type d -exec chmod 755 {} \;
sudo find /var/www/mateeazy-site -type f -exec chmod 644 {} \;
rm -rf ~/mateeazy_website_upload
```

### 4. nginx site

```bash
sudo tee /etc/nginx/sites-available/mateeazy-site > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name mateeazy.in www.mateeazy.in;

    root /var/www/mateeazy-site;
    index index.html;
    error_page 404 /404.html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "DENY" always;

    gzip on;
    gzip_types text/css application/javascript image/svg+xml application/xml text/plain;

    location / {
        try_files $uri $uri/ =404;
    }

    # HTML always fresh; images/videos/CSS/JS cached for a week
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
    }
    location ~* \.(css|js|svg|png|jpg|jpeg|webp|ico|mp4)$ {
        add_header Cache-Control "public, max-age=604800";
        add_header X-Content-Type-Options "nosniff" always;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/mateeazy-site /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
curl -sI -H "Host: mateeazy.in" http://127.0.0.1/ | head -1     # HTTP/1.1 200 OK
```

### 5. HTTPS

Wait until `mateeazy.in` resolves to the VM (`nslookup mateeazy.in`), then:
```bash
sudo certbot --nginx -d mateeazy.in -d www.mateeazy.in --redirect \
  -m support@mateeazy.in --agree-tos --no-eff-email
curl -sI https://mateeazy.in/ | head -1
```

Open https://mateeazy.in on your phone and laptop and check: Play badge opens the store,
QR scans, the app tour plays in the phone, the match demo reacts.

## Update the site later

Edit files here, preview locally, then repeat **steps 2 and 3**. Nothing to restart.
