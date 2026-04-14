FROM nginxinc/nginx-unprivileged:1.27-alpine

# Remove any existing config files
RUN rm /etc/nginx/conf.d/*

# Copy config files
# *.conf files in "conf.d/" dir get included in layout config
COPY default.conf /etc/nginx/conf.d/

# Expose the listening port (8080 for non-root user)
EXPOSE 8080

# Launch NGINX
CMD [ "nginx", "-g", "daemon off;" ]