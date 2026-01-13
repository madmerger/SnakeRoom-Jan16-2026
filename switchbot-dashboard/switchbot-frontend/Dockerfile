# Retro frontend - no build tools needed!
# Just serve static HTML/CSS/JS files like it's 2020
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files directly - no build step needed!
# This is how we did it before webpack/vite took over
COPY index.html /usr/share/nginx/html/
COPY public/ /usr/share/nginx/html/

# Expose port 8080 (Fly.io default)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
