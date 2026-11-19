# MongoDB 7.0 for AiToEarn (single-member replica set, see start.sh).
FROM mongo:7.0.48@sha256:884c055bff8b7144ca44830d01826facd3083b33c4dea44b94a1476c62de3c32
COPY start.sh /usr/local/bin/railway-mongo-start.sh
RUN chmod 755 /usr/local/bin/railway-mongo-start.sh
EXPOSE 27017
CMD ["/usr/local/bin/railway-mongo-start.sh"]
