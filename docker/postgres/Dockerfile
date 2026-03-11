FROM postgres:18 AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    git \
    pkg-config \
    libssl-dev \
    libclang-dev \
    postgresql-server-dev-18 \
    && rm -rf /var/lib/apt/lists/*

# Build pgvector
RUN cd /tmp \
    && git clone --branch v0.8.2 --depth 1 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make OPTFLAGS="" \
    && make install

# Build pg_textsearch
RUN cd /tmp \
    && git clone --branch v0.6.0 --depth 1 https://github.com/timescale/pg_textsearch.git \
    && cd pg_textsearch \
    && make \
    && make install

# Install Rust and build pgvectorscale
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN cargo install cargo-pgrx --version "=0.16.1" --locked \
    && cargo pgrx init --pg18 $(which pg_config)
RUN cd /tmp \
    && git clone --branch 0.9.0 --depth 1 https://github.com/timescale/pgvectorscale.git \
    && cd pgvectorscale/pgvectorscale \
    && cargo pgrx install --release

# --- Final stage ---
FROM postgres:18

# Copy built extensions from builder
COPY --from=builder /usr/share/postgresql/18/extension/ /usr/share/postgresql/18/extension/
COPY --from=builder /usr/lib/postgresql/18/lib/ /usr/lib/postgresql/18/lib/

COPY init-extensions.sql /docker-entrypoint-initdb.d/
