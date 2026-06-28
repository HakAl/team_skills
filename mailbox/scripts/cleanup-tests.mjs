// Close (hide) the self-targeted messages left in jac's inbox by smoke tests / e2e.
// Matches the test subjects only; never touches real mail.
import { listInbox, closeMessage } from "../mail.mjs";

const TEST_SUBJECT = /^(mailbox self-test|mailbox e2e-|Re: mailbox e2e-|mailbox compose-draft-)/;

const rows = await listInbox({ unreadOnly: false, includeClosed: false, limit: 100 });
const targets = (Array.isArray(rows) ? rows : []).filter((m) => TEST_SUBJECT.test(m.subject || ""));
console.log(`Found ${targets.length} test message(s) to close.`);
for (const m of targets) {
  await closeMessage(m.id, "closing mailbox build test message");
  console.log(`  closed ${m.id} | ${m.subject}`);
}
console.log("Done.");
process.exit(0);
