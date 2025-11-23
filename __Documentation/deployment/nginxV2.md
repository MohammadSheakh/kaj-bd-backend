Nginx = Web Server + Reverse Proxy + Load Balancer

Nginx takes traffic from: http://your-domain.com
and forwards it to your backend running on internal ports: localhost:5000 localhost:4000
So users don’t need to type ports.

🔁 2. Simple Reverse Proxy Diagram
User → Nginx → Your App (running on ports)
https://yourdomain.com/api → Nginx → localhost:6731

🖥️ 3. Install Nginx on EC2

> sudo apt update
> sudo apt install nginx -y

Check status:
> systemctl status nginx

Open browser:
> http://YOUR_PUBLIC_IP

🏆 Best Practice: Use Separate Config Files for Each Project
> /etc/nginx/sites-available/
output : project1.conf
    project2.conf
    project3.conf

> /etc/nginx/sites-enabled/
output : project1.conf → symlink
    project2.conf → symlink
    project3.conf → symlink

Separate files = easy to find and edit.
2️⃣ Safer — One mistake won’t break all projects

3️⃣ Easy to enable/disable projects  … Just remove symlink:
> sudo rm /etc/nginx/sites-enabled/project2.conf
> sudo systemctl reload nginx

Project 1 and 3 still work.

//—---------------------------------------------------------------------------------------------

# <_project_name_> Main Website Configuration
server {


    # Listen on port 80 for public website traffic
    listen 80;


    # Main domain name (example: example.com)
    server_name <_domain_>;


    # Path where website build files are located
    root /var/www/<_project_name_>/website/build;


    # Default index file
    index index.html;


    # SPA routing for frontend frameworks
    location / {
        try_files $uri /index.html;
    }


    # Forward API requests to backend
    location /api/ {
        proxy_pass http://localhost:<_port_>;


        # Forward visitor IP and host data
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }


    # Logs for monitoring website activity
    access_log /var/log/nginx/<_project_name_>_website_access.log;
    error_log  /var/log/nginx/<_project_name_>_website_error.log;
}


the full BEST-PRACTICE nginx production config that includes:
✔ Domain + subdomain
✔ SPA (React/Svelte) handling
✔ Backend API reverse proxy
✔ HTTPS + HTTP/2 + HSTS
✔ Caching
✔ gzip + brotli
✔ Security headers
✔ Rate limiting (DDoS protection)
✔ WebSocket
✔ File upload limit
✔ Timeout tuning
✔ Load balancing (optional block included)

✅ MASTER NGINX CONFIG FOR <project_name>
Includes:
SPA Frontend + Backend API + All Production Features

Features

##  📌 1. Config for WEBSITE (SPA)

> File: /etc/nginx/sites-available/<_project_name_>-website.conf
```ts 

# This server handles the SPA (React/Svelte) website for <_project_name_>

server {
    # Listen on HTTPS with HTTP/2
    listen 443 ssl http2;
    listen [::]:443 ssl http2;


    # Your domain/subdomain
    server_name <_sub_domain_>.<_domain_>;


    # SSL certificate paths
    ssl_certificate /etc/letsencrypt/live/<_sub_domain_>.<_domain_>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<_sub_domain_>.<_domain_>/privkey.pem;


    # Enable HSTS (forces HTTPS for 6 months)
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains" always;


    # Root directory for SPA build files
    root /var/www/<_project_name_>/website/dist;


    # Default index
    index index.html;


    # Strong security headers for SPA
    add_header X-Frame-Options "DENY";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";


    # Enable Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/xml+rss;


    # Serve static files with efficient caching
    location ~* \.(ico|css|js|gif|webp|jpe?g|png|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
        try_files $uri =404;
    }


    # SPA fallback – always return index.html
    location / {
        try_files $uri /index.html;
    }


    # Optional: WebSocket support if needed for live notifications
    location /ws/ {
        proxy_pass http://127.0.0.1:<_port_>;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }


    # Rate limiting to protect from DDoS or brute-force attacks
    limit_req zone=req_limit_per_ip burst=30 nodelay;


    # Protect against huge uploads
    client_max_body_size 30M;
}

```

##  📌 2. Config for BACKEND API
    File: /etc/nginx/sites-available/<_project_name_>-backend.conf
    This server handles the backend API for <_project_name_>

```ts

server {
    listen 443 ssl http2;
    server_name api.<_domain_>;


    ssl_certificate /etc/letsencrypt/live/api.<_domain_>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.<_domain_>/privkey.pem;


    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains" always;


    # Web API reverse proxy to Node app running on <_port_>
    location / {
        proxy_pass http://127.0.0.1:<_port_>;


        # Required headers for Node.js apps
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;


        # Websocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;


        # Increase timeout for large requests or long operations
        proxy_read_timeout 120s;
    }


    # Protect against excessive request spam / DDoS
    limit_req zone=req_limit_per_ip burst=20 nodelay;


    # Allow large uploads (file uploads, images, PDFs)
    client_max_body_size 50M;
}
```

## 📌 3. GLOBAL SETTINGS (must be added once)
File: /etc/nginx/nginx.conf (add inside http{} )

```ts 
# Rate limiting zone (used in all servers)
limit_req_zone $binary_remote_addr zone=req_limit_per_ip:10m rate=10r/s;


# Enable gzip for all sites
gzip on;


# Brotli support if installed
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript;


# Load balancing example (optional)
upstream <_project_name_>_api_cluster {
    server 127.0.0.1:<_port_>;
    # For horizontal scaling add:
    # server 127.0.0.1:<_another_port_>;
}
```
##  📌 4. ADMIN DASHBOARD Config
File: /etc/nginx/sites-available/<_project_name_>-admin.conf
```ts
# Admin dashboard server for <_project_name_>
server {
    listen 443 ssl http2;
    server_name admin.<_domain_>;


    ssl_certificate /etc/letsencrypt/live/admin.<_domain_>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.<_domain_>/privkey.pem;


    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains" always;


    root /var/www/<_project_name_>/admin/dist;
    index index.html;


    # Strong admin security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";


    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        try_files $uri =404;
    }


    # SPA fallback
    location / {
        try_files $uri /index.html;
    }


    # Limit requests more strictly for admin
    limit_req zone=req_limit_per_ip burst=10 nodelay;


    # Allow larger uploads (admin sometimes uploads images)
    client_max_body_size 40M;
}
```

## 📌 5. HTTP → HTTPS redirect (for all domains)
File: /etc/nginx/sites-available/redirect.conf
```ts
server {
    listen 80;
    server_name <_sub_domain_>.<_domain_> admin.<_domain_> api.<_domain_>;


    # Redirect every HTTP request to HTTPS version
    return 301 https://$host$request_uri;
}
```

##  🚀 FINAL NOTES — What You Get With These Configs
✔ Perfect Production Setup
Fully optimized SSL
HSTS
HTTP/2
gzip + brotli
caching
security headers
strict rate-limiting
path-based routing
SPA support
file upload limits
WebSockets
load balancing ready
optimized fallback rules
minimal attack surface
