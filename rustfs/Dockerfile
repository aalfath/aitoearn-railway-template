# RustFS (S3-compatible object storage) for AiToEarn's uploads and generated media.
FROM rustfs/rustfs:1.0.6@sha256:ee717072290bec9b11abfc0365f8310b00df1cd9b3639943edae47bdef05044a
# Railway mounts volumes owned by root; run as root so RustFS can write /data.
USER root
ENV RUSTFS_VOLUMES=/data \
    RUSTFS_ADDRESS=[::]:9000 \
    RUSTFS_CONSOLE_ENABLE=false \
    PORT=9000
EXPOSE 9000
