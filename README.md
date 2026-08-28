# 天使桥

天使桥是一个使用 Next.js 构建的独立资源互换社区应用。

## Getting Started

Install dependencies with Bun:

```bash
bun install
```

If dependency installation stalls on this machine during `sharp` setup, use:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 bun install
```

Then start the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Copy `.env.example` to `.env` and configure the services you use:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_TITLE` | Product title used in metadata. |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Product description used in metadata. |
| `DATABASE_URL` | PostgreSQL connection string used by Drizzle ORM. |
| `CRON_SECRET` | Secret used to authenticate scheduled notification requests. |

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
