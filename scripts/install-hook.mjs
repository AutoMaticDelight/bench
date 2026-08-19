import { writeFileSync, chmodSync, existsSync } from "node:fs";
if (existsSync(".git")) {
  writeFileSync(".git/hooks/pre-commit", "#!/bin/sh\nnode scripts/guard.mjs\n");
  chmodSync(".git/hooks/pre-commit", 0o755);
}
