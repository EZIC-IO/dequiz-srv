## Install & run locally

- Set up env
  `cp .env.example .env`

- Edit .env file with your variables

- Install dependencies
  `pnpm i`

- Run in dev mode
  `pnpm run start:dev`

## Run in Docker

> IMPORTANT!
> Create subnet manually (verify that it is not already occupied):
> `docker network create --subnet=10.101.0.0/24 dequiz`

`docker-compose up .`
