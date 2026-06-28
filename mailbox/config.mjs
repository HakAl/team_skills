// Single source of truth for who this mailbox acts as.
// jac's active human identity (the one that actually sends mail).
// NOT human-jac, which is a dead-letter sink.
export const ACTOR_ID = "01J00000000000000000000001";
export const ACTOR_DISPLAY = "jac";

// agent-comms MCP server launch (stdio, identity-scoped per process).
// The operator_mailbox wake policy lets the server boot as the human jac and
// exposes send + read only (no dispatch, no admin). See agent-comms docs/mcp-setup.md.
export const MCP_COMMAND = "/Users/home/dev/agent-comms/scripts/agent-comms-mcp";
export const MCP_ARGS = ["--actor-id", ACTOR_ID];
export const MCP_ENV = { ...process.env, WAKE_POLICY: "operator_mailbox" };

export const PORT = Number(process.env.MAILBOX_PORT || 4100);
export const HOST = process.env.MAILBOX_HOST || "127.0.0.1";
