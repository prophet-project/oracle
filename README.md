## Installation

- Install node packages:
  
  ```bash
  $ npm install
  ```
- Configure TimescaleDB in `docker/docker-compose.yml`:

  ```
  POSTGRES_USER: "root"
  POSTGRES_PASSWORD: "root"
  POSTGRES_DB: "test"
  ```

- Create `.env` file with app configuration:
  - Define PostgreSQL-related variables:
  
    ```
    POSTGRES_PASSWORD=root
    POSTGRES_USER=root
    POSTGRES_DB=test
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    ```

  - Define Redis-related variables:

    ```
    REDIS_HOST=localhost
    REDIS_PORT=6379
    ```

  - Define name of prefered exchange in `SELECTED_EXCHANGE` variable. For example:

    ```
    SELECTED_EXCHANGE=BITFINEX
    ```

  - Define exchange configuration variables:

    ```
    BITFINEX_API_KEY=
    BITFINEX_SECRET_KEY=
    BITFINEX_SYMBOL=BTC/USD
    BITFINEX_OHLCV_REQUEST_LIMIT=1000
    ```

- Start services (TimescaleDB and Redis) via docker-compose:
  
  ```bash
  $ cd docker
  $ docker-compose up -d
  ```

- Run Oracle app in development mode:

  ```bash
  $ npm run start:dev
  ```

- Wait until all migrations are done and all history of OHLCV data are fetched from exchange and saved to DB.