# AiToEarn gateway (replaces upstream's nginx service): routes the public domain to web, server,
# AI and RustFS over Railway's private network, and puts a password in front of the web app.
FROM nginx:1.30.7-alpine@sha256:bef154735288bc38d99fac41ae63730684bcc661503673a04a0f9bc526ba8598

RUN rm /etc/nginx/conf.d/default.conf \
 && sed -i 's/^worker_processes .*/worker_processes 2;/' /etc/nginx/nginx.conf \
 && grep -q '^worker_processes 2;' /etc/nginx/nginx.conf
COPY aitoearn.conf.template /etc/nginx/templates/aitoearn.conf.template
COPY 05-aitoearn-auth.sh /docker-entrypoint.d/05-aitoearn-auth.sh
RUN chmod 755 /docker-entrypoint.d/05-aitoearn-auth.sh

ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    S3_BUCKET=aitoearn \
    PORT=8080
EXPOSE 8080
