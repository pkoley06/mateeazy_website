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
| Search radius "2 to 30 km" (app currently allows 2 to 50) | `DiscoveryFilters.minRadiusKm` / `maxRadiusKm` in `matchmate_flutter/.../discovery/domain/discovery_card.dart` |
| `.well-known/assetlinks.json` (App Links) | package `com.mateeazy.app` + the SHA-256 of the Play **app signing** key (Play Console → App integrity) and of the upload key |
| `/room/{id}`, `/post/{id}` links | proxied to the API (nginx section below); the app's manifest claims them |
| Play Store link and QR (`assets/img/qr-play.svg`) | package `com.mateeazy.app` |
| Privacy / terms / delete-account links | the `mateeazy-legal` GitHub Pages site |

Regenerate the QR code if the Play link ever changes:
```powershell
npx qrcode@1.5.4 -t svg -e M -m 2 -d 2B1B3D -l FFF8F0 -o assets/img/qr-play.svg "https://play.google.com/store/apps/details?id=com.mateeazy.app"
```

---

## CI/CD (GitHub Actions)

`.github/workflows/deploy.yml`:

| Event | What runs |
|---|---|
| Pull request into `main` | Checks only: `main.js` has no syntax errors, every file the pages link to exists |
| Push to `main` (or "Run workflow") | Checks, then deploy to https://mateeazy.in, then verify the live site |

The deploy job uploads the site (everything except `.github/`, `deploy/` and this README) as a
`.tar.gz` over SSH as the VM's `deploy` user. That user's key for this repo is locked to one
command, `deploy/mateeazy-site-deploy` (installed at `/usr/local/bin/mateeazy-site-deploy`). It can
only replace the files in `/var/www/mateeazy-site`, nothing else. The script writes the commit
hash to https://mateeazy.in/version.txt, and the workflow checks that the live site serves it.

**Repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `SITE_DEPLOY_SSH_KEY` | private key of the website deploy key (`mateeazy_site_deploy`) |
| `OCI_HOST` | `130.210.45.27` |
| `OCI_KNOWN_HOSTS` | output of `ssh-keyscan 130.210.45.27` |

**One-time VM setup** (already done once; repeat only on a new VM or a new key):
```bash
sudo install -o root -g root -m 0755 ~/mateeazy-site-deploy /usr/local/bin/mateeazy-site-deploy
sudo chown -R deploy:deploy /var/www/mateeazy-site
echo "restrict,command=\"/usr/local/bin/mateeazy-site-deploy\" $(cat ~/mateeazy_site_deploy.pub)" \
  | sudo tee -a /home/deploy/.ssh/authorized_keys
```
If you change `deploy/mateeazy-site-deploy`, copy it to the VM and run the `install` line again.
CI doesn't update it.

---

## Deploy to the OCI VM (first time, by hand)

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
        try_files $uri $uri/ /index.html;
    }

    # Android App Links: proves the MateEazy app owns mateeazy.in/room/* and /post/* links.
    location = /.well-known/assetlinks.json {
        default_type application/json;
        add_header Cache-Control "public, max-age=3600";
    }

    # Shared rooms / community posts:
    # - Link-preview bots (WhatsApp, Telegram, Twitter, etc.) get server-rendered Open Graph
    #   tags from the API's SharePageController.
    # - Human visitors without the app fall through to /index.html and land directly in the
    #   web app with the same sign-in -> room/post flow as the Android app.
    location ~ "^/(room|post)/[0-9a-fA-F-]{36}/?$" {
        if ($http_user_agent ~* "(WhatsApp|TelegramBot|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|Discordbot|Googlebot|bingbot)") {
            proxy_pass http://127.0.0.1:8080/share$request_uri;
        }
        try_files $uri /index.html;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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

Edit files here, preview locally, commit and push to `main`. GitHub Actions deploys it
(see **CI/CD** above). Steps 2 and 3 are only a fallback if Actions is down.
