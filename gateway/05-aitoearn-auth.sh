#!/bin/sh
# Writes the gateway's login (HTTP basic auth) from AUTH_USERNAME / AUTH_PASSWORD.
set -eu
user="${AUTH_USERNAME:-admin}"
pass="${AUTH_PASSWORD:-}"
if [ "${#pass}" -lt 12 ]; then
  echo "AUTH_PASSWORD must be set to at least 12 characters" >&2
  exit 1
fi
case "$user$pass" in
  *:*) echo "AUTH_USERNAME and AUTH_PASSWORD must not contain ':'" >&2; exit 1 ;;
esac
umask 077
printf '%s:{PLAIN}%s\n' "$user" "$pass" > /etc/nginx/aitoearn.htpasswd
chown nginx /etc/nginx/aitoearn.htpasswd
