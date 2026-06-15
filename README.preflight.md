# Trae Preflight

This folder is prepared for `wangxt-1022-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18322
- API_PORT: 19322
- WEB_PORT: 20322
- DB_PORT: 21322
- REDIS_PORT: 22322

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
