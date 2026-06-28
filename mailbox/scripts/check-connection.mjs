// Step 0: prove the MCP client boots as jac and list_inbox returns real rows.
import { listInbox } from "../mail.mjs";
import { ACTOR_ID, ACTOR_DISPLAY } from "../config.mjs";

const rows = await listInbox({ unreadOnly: false, limit: 50 });
console.log(`Connected as ${ACTOR_DISPLAY} (${ACTOR_ID}).`);
console.log(`Inbox rows: ${Array.isArray(rows) ? rows.length : "(non-array) " + typeof rows}`);
if (Array.isArray(rows)) {
  for (const m of rows.slice(0, 10)) {
    console.log(`  [${m.status}] ${m.from} | ${m.subject} | ${m.created_at}`);
  }
}
process.exit(0);
