// Buildless front-end for the jac mailbox. Talks to the Node JSON API only.
const $ = (id) => document.getElementById(id);
const layout = $("layout");
const DRAFT_KEY = "mailbox.compose.draft";
const STATUS_KEY = "mailbox.status";

let selectedId = null;

async function api(path, opts) {
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status}`);
  return data;
}

function toast(msg, isError) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.toggle("error", !!isError);
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 3200);
}

function fmtWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Plain string coercion for textContent. Nothing in this file renders markup from
// message data: subjects and sender ids come from other agents and are untrusted.
function txt(s) {
  return String(s == null ? "" : s);
}

// --- priority ---
const PRIORITY_RANK = { blocker: 3, high: 2, normal: 1, low: 0 };

function priorityOf(m) {
  const p = String((m && m.priority) || "normal").toLowerCase();
  return p in PRIORITY_RANK ? p : "normal";
}

function topPriority(msgs) {
  let best = "normal";
  for (const m of msgs) {
    const p = priorityOf(m);
    if (p !== "normal" && (best === "normal" || PRIORITY_RANK[p] > PRIORITY_RANK[best])) best = p;
  }
  return best;
}

function priorityBadge(priority) {
  if (!priority || priority === "normal") return null;
  const b = document.createElement("span");
  b.className = "priority-badge p-" + priority;
  b.textContent = priority;
  return b;
}

// --- inbox filter (client-side over the loaded page) ---
let inboxFilter = "all";

function matchesFilter(m) {
  if (inboxFilter === "unread") return m.status === "sent";
  if (inboxFilter === "ack") return needsAck(m);
  return true;
}

function setFilter(name) {
  inboxFilter = name;
  for (const b of document.querySelectorAll("#filters .filter")) {
    b.classList.toggle("active", b.dataset.filter === name);
  }
  renderInbox(inboxMessages);
}

// Groups stay expanded across reloads (read/send refresh the list).
const expandedGroups = new Set();

function needsAck(m) {
  return !!m && m.requires_ack === true && m.status !== "acknowledged" && m.status !== "closed";
}

function ackFlag() {
  const flag = document.createElement("span");
  flag.className = "ack-flag";
  flag.textContent = "ack";
  return flag;
}

function makeMsgRow(m, { showFrom } = {}) {
  const li = document.createElement("li");
  li.className = "msg" + (m.status === "sent" ? " unread" : "") + (m.id === selectedId ? " selected" : "");
  li.dataset.id = m.id;
  const dot = document.createElement("span");
  dot.className = "dot";
  dot.textContent = "*";
  const from = document.createElement("span");
  from.className = "from";
  from.textContent = showFrom ? txt(m.from) : "";
  const when = document.createElement("span");
  when.className = "when";
  when.textContent = fmtWhen(m.created_at);
  const subj = document.createElement("span");
  subj.className = "subj";
  const pb = priorityBadge(priorityOf(m));
  if (pb) subj.appendChild(pb);
  subj.appendChild(document.createTextNode(txt(m.subject) || "(no subject)"));
  li.append(dot, from, when, subj);
  if (needsAck(m)) li.appendChild(ackFlag());
  li.addEventListener("click", () => openMessage(m.id));
  return li;
}

function renderUnreadTotal(all) {
  const n = all.filter((m) => m.status === "sent").length;
  const el = $("unreadTotal");
  el.hidden = n === 0;
  el.textContent = n ? String(n) : "";
  document.title = (n ? `(${n}) ` : "") + `Mailbox - ${myDisplay}`;
}

function renderListNote() {
  const note = $("listNote");
  if (inboxLimit && inboxMessages.length >= inboxLimit) {
    note.textContent = `Showing the ${inboxLimit} most recent messages. Close handled mail to see older messages.`;
    note.hidden = false;
  } else {
    note.hidden = true;
  }
}

const EMPTY_TEXT = { all: "No messages.", unread: "No unread messages.", ack: "Nothing needs your acknowledgement." };

function renderInbox(all) {
  const ul = $("messages");
  ul.innerHTML = "";
  renderUnreadTotal(all);
  renderListNote();
  const messages = all.filter(matchesFilter);
  $("listEmpty").textContent = EMPTY_TEXT[inboxFilter] || EMPTY_TEXT.all;
  $("listEmpty").hidden = messages.length > 0;

  // Group by sender (the operator seat only sees messages addressed to you).
  const groups = new Map();
  for (const m of messages) {
    if (!groups.has(m.from)) groups.set(m.from, []);
    groups.get(m.from).push(m);
  }
  // Order conversations by most recent message.
  const ordered = [...groups.entries()].sort(
    (a, b) => new Date(b[1][0].created_at) - new Date(a[1][0].created_at)
  );

  for (const [sender, msgs] of ordered) {
    msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latest = msgs[0];
    const unread = msgs.filter((m) => m.status === "sent").length;
    const groupNeedsAck = msgs.some(needsAck);
    const expanded = expandedGroups.has(sender);

    const group = document.createElement("li");
    group.className = "group" + (expanded ? " open" : "");

    const head = document.createElement("div");
    head.className = "group-head";
    const el = (cls, text) => {
      const span = document.createElement("span");
      span.className = cls;
      span.textContent = text;
      return span;
    };
    head.appendChild(el("caret", expanded ? "\u25be" : "\u25b8"));
    head.appendChild(el("from", senderLabel(sender)));
    if (unread) head.appendChild(el("badge", String(unread)));
    head.appendChild(el("when", fmtWhen(latest.created_at)));
    head.appendChild(el("count", String(msgs.length)));
    const subj = el("subj", "");
    const pb = priorityBadge(topPriority(msgs));
    if (pb) subj.appendChild(pb);
    subj.appendChild(document.createTextNode(txt(latest.subject) || "(no subject)"));
    head.appendChild(subj);
    if (groupNeedsAck) head.appendChild(ackFlag());
    head.addEventListener("click", () => {
      if (expandedGroups.has(sender)) expandedGroups.delete(sender);
      else expandedGroups.add(sender);
      renderInbox(inboxMessages);
    });
    group.appendChild(head);

    const sub = document.createElement("ul");
    sub.className = "group-msgs";
    sub.hidden = !expanded;
    // Bulk triage: close every already-read message in this conversation.
    const readMsgs = msgs.filter((m) => m.status !== "sent");
    if (readMsgs.length) {
      const tools = document.createElement("li");
      tools.className = "group-tools";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost small close-read";
      btn.textContent = `Close ${readMsgs.length} read`;
      btn.title = "Remove the already-read messages in this conversation from the inbox";
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        bulkClose(readMsgs.map((m) => m.id), senderLabel(sender));
      });
      tools.appendChild(btn);
      sub.appendChild(tools);
    }
    for (const m of msgs) sub.appendChild(makeMsgRow(m, { showFrom: false }));
    group.appendChild(sub);

    ul.appendChild(group);
  }
}

// Last loaded inbox, so "View all from <sender>" can list a sender's messages
// without a refetch. The operator seat only returns messages addressed TO jac,
// so this is the sender's messages to you, not a two-sided thread.
let inboxMessages = [];
let inboxLimit = 0;
let sentMessages = [];
let sentAvailable = false;
let boardStatuses = [];
let boardAvailable = false;

async function loadInbox() {
  try {
    const { messages, limit } = await api("/api/inbox");
    inboxMessages = Array.isArray(messages) ? messages : [];
    inboxLimit = Number(limit) || 0;
    renderInbox(inboxMessages);
    // If a sender view is open, keep it in sync with the refreshed inbox.
    if (!$("senderAllList").hidden) renderSenderAll();
  } catch (e) {
    toast("Inbox failed: " + e.message, true);
  }
}

async function loadSent() {
  try {
    const { messages, sentAvailable: avail } = await api("/api/sent");
    sentMessages = Array.isArray(messages) ? messages : [];
    sentAvailable = !!avail;
  } catch {
    sentMessages = [];
    sentAvailable = false;
  }
  if (viewAllSender) setupSenderAll(viewAllSender);
}

async function loadStatusBoard() {
  try {
    const { statuses, boardAvailable: avail } = await api("/api/status-board");
    boardStatuses = Array.isArray(statuses) ? statuses : [];
    boardAvailable = !!avail;
  } catch {
    boardStatuses = [];
    boardAvailable = false;
  }
  $("statusBoardBtn").hidden = !boardAvailable;
  if (!$("statusBoard").hidden) renderStatusBoard();
}

function fmtAge(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const ms = Math.max(0, Date.now() - t);
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  const week = 7 * day;
  if (ms < day) return `${Math.max(1, Math.floor(ms / hour))}h ago`;
  if (ms < week) return `${Math.floor(ms / day)}d ago`;
  return `${Math.floor(ms / week)}w ago`;
}

function isStale(iso) {
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && Date.now() - t > 7 * 24 * 60 * 60 * 1000;
}

function statusTime(status) {
  const t = new Date(status && status.created_at).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function hasBlocked(status) {
  return !!String(status && status.blocked_on || "").trim();
}

function renderStatusBoard() {
  const list = $("statusBoardList");
  list.innerHTML = "";
  if (!boardStatuses.length) {
    const empty = document.createElement("div");
    empty.className = "status-board-empty";
    empty.textContent = "No statuses.";
    list.appendChild(empty);
    return;
  }

  const ordered = [...boardStatuses].sort((a, b) => {
    const blockedDelta = Number(hasBlocked(b)) - Number(hasBlocked(a));
    if (blockedDelta) return blockedDelta;
    return statusTime(b) - statusTime(a);
  });

  for (const status of ordered) {
    const card = document.createElement("article");
    card.className = "status-card";
    card.dataset.agentId = status.agent_id || "";

    const head = document.createElement("div");
    head.className = "status-card-head";
    const agent = document.createElement("strong");
    agent.textContent = senderLabel(status.agent_id || status.id || "");
    const age = document.createElement("span");
    age.className = "status-age";
    if (isStale(status.created_at)) age.classList.add("stale");
    age.textContent = fmtAge(status.created_at);
    head.append(agent, age);
    card.appendChild(head);

    const blocked = String(status.blocked_on || "").trim();
    if (blocked) {
      const blockedLine = document.createElement("div");
      blockedLine.className = "status-blocked";
      const prefix = document.createElement("strong");
      prefix.textContent = "BLOCKED:";
      blockedLine.append(prefix, document.createTextNode(" " + blocked));
      card.appendChild(blockedLine);
    }

    const next = String(status.next_step || "").trim();
    if (next) {
      const nextLine = document.createElement("div");
      nextLine.className = "status-next";
      const prefix = document.createElement("span");
      prefix.textContent = "next:";
      nextLine.append(prefix, document.createTextNode(" " + next));
      card.appendChild(nextLine);
    }

    const summary = document.createElement("div");
    summary.className = "status-summary";
    summary.textContent = txt(status.summary || "");
    card.appendChild(summary);

    if (String(status.summary || "").length > 240) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "status-more";
      toggle.textContent = "more";
      toggle.addEventListener("click", () => {
        const expanded = summary.classList.toggle("expanded");
        toggle.textContent = expanded ? "less" : "more";
      });
      card.appendChild(toggle);
    }

    list.appendChild(card);
  }
}

async function openStatusBoard() {
  layout.classList.add("reading-open");
  $("backBtn").hidden = false;
  $("placeholder").hidden = true;
  $("reader").hidden = true;
  $("composeForm").hidden = true;
  $("statusBoard").hidden = false;
  await loadStatusBoard();
}

function hideStatusBoard() {
  $("statusBoard").hidden = true;
}

function renderThread(thread) {
  const box = $("threadBox");
  const list = $("threadList");
  list.innerHTML = "";
  if (!thread || !thread.length) { box.hidden = true; return; }
  $("threadCount").textContent = thread.length;
  for (const m of thread) {
    const div = document.createElement("div");
    div.className = "t-msg";
    const meta = document.createElement("div");
    meta.className = "t-meta";
    meta.textContent = `${txt(m.from)} - ${txt(m.subject)} - ${fmtWhen(m.created_at)}`;
    const body = document.createElement("div");
    body.className = "t-body";
    body.textContent = txt(m.body);
    div.append(meta, body);
    list.appendChild(div);
  }
  box.hidden = false;
}

// --- "View all from <sender>" (Priority 2) ---
// An explicit button below the open message that reveals every message that sender
// has sent YOU. NOTE: the operator seat has no sent-items tool, so this shows their
// messages to you only - not your replies back (no two-sided transcript).
let viewAllSender = null;

function sentToSender(m, sender) {
  const to = m && m.to;
  return Array.isArray(to) ? to.includes(sender) : to === sender;
}

function senderAllCount(sender) {
  const inboxCount = inboxMessages.filter((m) => m.from === sender).length;
  if (!sentAvailable) return inboxCount;
  const sentCount = sentMessages.filter((m) => sentToSender(m, sender)).length;
  return inboxCount + sentCount;
}

function setupSenderAll(sender) {
  viewAllSender = sender;
  const wrap = $("senderAll");
  const list = $("senderAllList");
  const btn = $("viewAllBtn");
  list.hidden = true;
  list.innerHTML = "";
  const count = senderAllCount(sender);
  // Only worth a button when there is more than the message you are already reading.
  if (count <= 1) { wrap.hidden = true; return; }
  wrap.hidden = false;
  btn.textContent = `View all from ${senderLabel(sender)} (${count})`;
}

function renderSenderAll() {
  const list = $("senderAllList");
  list.innerHTML = "";
  const inboxMsgs = inboxMessages
    .filter((m) => m.from === viewAllSender)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (!sentAvailable) {
    const cap = document.createElement("div");
    cap.className = "sender-all-cap";
    cap.textContent =
      `${inboxMsgs.length} message(s) from ${senderLabel(viewAllSender)} to you` +
      ` - your replies are not shown (the seat has no sent-items view).`;
    list.appendChild(cap);

    for (const m of inboxMsgs) {
      const item = document.createElement("div");
      item.className = "t-msg sa-item" +
        (m.id === selectedId ? " current" : "") +
        (m.status === "sent" ? " unread" : "");
      const meta = document.createElement("div");
      meta.className = "t-meta";
      meta.textContent =
        `${m.status === "sent" ? "* " : ""}${txt(m.subject) || "(no subject)"}` +
        ` - ${fmtWhen(m.created_at)}` +
        (m.id === selectedId ? " - (open)" : "");
      const body = document.createElement("div");
      body.className = "t-body";
      body.textContent = txt(m.body_snippet || "");
      item.append(meta, body);
      // Click any sibling to open it fully in the reader (marks just that one read).
      if (m.id !== selectedId) {
        item.classList.add("clickable");
        item.addEventListener("click", () => openMessage(m.id));
      }
      list.appendChild(item);
    }
    return;
  }

  const sentMsgs = sentMessages
    .filter((m) => sentToSender(m, viewAllSender))
    .map((m) => ({ ...m, _fromYou: true }));
  const msgs = [...inboxMsgs, ...sentMsgs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const cap = document.createElement("div");
  cap.className = "sender-all-cap";
  cap.textContent = `${msgs.length} message(s) between you and ${senderLabel(viewAllSender)}`;
  list.appendChild(cap);

  for (const m of msgs) {
    const item = document.createElement("div");
    item.className = m._fromYou
      ? "t-msg sa-item from-you"
      : "t-msg sa-item" +
        (m.id === selectedId ? " current" : "") +
        (m.status === "sent" ? " unread" : "");
    const meta = document.createElement("div");
    meta.className = "t-meta";
    meta.textContent = m._fromYou
      ? `${myDisplay} (you) - ${txt(m.subject) || "(no subject)"} - ${fmtWhen(m.created_at)}`
      : `${m.status === "sent" ? "* " : ""}${txt(m.subject) || "(no subject)"}` +
        ` - ${fmtWhen(m.created_at)}` +
        (m.id === selectedId ? " - (open)" : "");
    const body = document.createElement("div");
    body.className = "t-body";
    body.textContent = txt(m.body_snippet || "");
    item.append(meta, body);
    // Click any sibling to open it fully in the reader (marks just that one read).
    if (!m._fromYou && m.id !== selectedId) {
      item.classList.add("clickable");
      item.addEventListener("click", () => openMessage(m.id));
    }
    list.appendChild(item);
  }
}

async function toggleSenderAll() {
  const list = $("senderAllList");
  const btn = $("viewAllBtn");
  if (list.hidden) {
    await loadSent();
    setupSenderAll(viewAllSender);
    if ($("senderAll").hidden) return;
    renderSenderAll();
    list.hidden = false;
    btn.textContent = `Hide messages from ${senderLabel(viewAllSender)}`;
  } else {
    list.hidden = true;
    const count = senderAllCount(viewAllSender);
    btn.textContent = `View all from ${senderLabel(viewAllSender)} (${count})`;
  }
}

let currentMessage = null;

function recipientsOf(message) {
  const to = message && message.to;
  return (Array.isArray(to) ? to : to ? [to] : []).filter(Boolean);
}

async function openMessage(id) {
  const changed = id !== selectedId;
  selectedId = id;
  layout.classList.add("reading-open");
  $("backBtn").hidden = false;
  $("placeholder").hidden = true;
  $("composeForm").hidden = true;
  hideStatusBoard();
  $("reader").hidden = false;
  try {
    const { message, thread } = await api("/api/message?id=" + encodeURIComponent(id));
    currentMessage = message;
    $("rSubject").textContent = txt(message.subject) || "(no subject)";
    $("rFrom").textContent = "From: " + txt(senderLabel(message.from));
    const recipients = recipientsOf(message);
    const others = recipients.filter((r) => r !== myId);
    $("rTo").textContent = others.length
      ? "To: you, " + others.map(senderLabel).join(", ")
      : "";
    $("rTo").title = recipients.join(", ");
    $("rWhen").textContent = fmtWhen(message.created_at);
    const pr = priorityOf(message);
    const prEl = $("rPriority");
    prEl.hidden = pr === "normal";
    prEl.className = "priority-badge p-" + pr;
    prEl.textContent = pr;
    $("rBody").textContent = txt(message.body);
    renderAckControl(message);
    renderThread(thread);
    setupSenderAll(message.from);
    // store reply context: the reply goes to the sender; co-recipients are optional.
    const form = $("replyForm");
    form.dataset.to = message.from;
    form.dataset.parent = message.id;
    form.dataset.subject = message.subject || "";
    const cc = others.filter((r) => r !== message.from);
    form.dataset.cc = JSON.stringify(cc);
    $("replyTo").textContent = "To: " + senderLabel(message.from);
    $("replyAllWrap").hidden = cc.length === 0;
    $("replyAllLabel").textContent = cc.length
      ? `Reply all (also ${cc.map(senderLabel).join(", ")})`
      : "Reply all";
    if (changed) {
      $("replyBody").value = "";
      $("rReplyAll").checked = false;
      $("rAck").checked = false;
    }
    // reading marks it read; refresh list styling
    loadInbox();
  } catch (e) {
    toast("Open failed: " + e.message, true);
  }
}

function renderAckControl(message) {
  const cached = inboxMessages.find((m) => m.id === selectedId);
  const show = needsAck(message) || (
    message &&
    message.requires_ack === undefined &&
    needsAck(cached)
  );
  $("ackBox").hidden = !show;
  $("ackResponse").value = "";
}

async function acknowledgeMessage() {
  if (!selectedId) return;
  $("ackBtn").disabled = true;
  try {
    await api("/api/ack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: selectedId, response: $("ackResponse").value }),
    });
    toast("Acknowledged");
    await loadInbox();
    await openMessage(selectedId);
  } catch (e) {
    toast("Acknowledge failed: " + e.message, true);
  } finally {
    $("ackBtn").disabled = false;
  }
}

async function closeOne(id) {
  await api("/api/close", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

function clearReader() {
  selectedId = null;
  currentMessage = null;
  $("reader").hidden = true;
  $("placeholder").hidden = false;
  layout.classList.remove("reading-open");
}

async function closeCurrentMessage() {
  if (!selectedId) return;
  const id = selectedId;
  $("closeMsgBtn").disabled = true;
  try {
    await closeOne(id);
    toast("Message closed");
    clearReader();
    await loadInbox();
  } catch (e) {
    toast("Close failed: " + e.message, true);
  } finally {
    $("closeMsgBtn").disabled = false;
  }
}

async function bulkClose(ids, who) {
  if (!ids.length) return;
  if (!confirm(`Close ${ids.length} read message(s) from ${who}? They leave the inbox but are not deleted.`)) return;
  let done = 0;
  try {
    for (const id of ids) {
      await closeOne(id);
      done++;
      if (id === selectedId) clearReader();
    }
    toast(`Closed ${done} message(s)`);
  } catch (e) {
    toast(`Closed ${done} of ${ids.length}; then: ${e.message}`, true);
  }
  await loadInbox();
}

function quoteParent() {
  if (!currentMessage) return;
  const quoted = String(currentMessage.body || "")
    .split("\n")
    .map((line) => "> " + line)
    .join("\n");
  const ta = $("replyBody");
  const existing = ta.value.trim();
  ta.value = (existing ? existing + "\n\n" : "") + quoted + "\n\n";
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
}

async function sendReply(ev) {
  ev.preventDefault();
  const form = $("replyForm");
  const body = $("replyBody").value.trim();
  if (!body) return toast("Reply is empty", true);
  const subject = form.dataset.subject || "";
  const replySubject = subject.startsWith("Re:") ? subject : "Re: " + subject;
  let cc = [];
  try { cc = JSON.parse(form.dataset.cc || "[]"); } catch { cc = []; }
  const toAgents = [form.dataset.to, ...($("rReplyAll").checked ? cc : [])].filter(Boolean);
  $("replySend").disabled = true;
  try {
    await api("/api/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        toAgents,
        subject: replySubject,
        body,
        parentMessageId: form.dataset.parent,
        requiresAck: $("rAck").checked,
      }),
    });
    $("replyBody").value = "";
    $("rAck").checked = false;
    toast("Reply sent");
    loadInbox();
  } catch (e) {
    toast("Send failed: " + e.message, true);
  } finally {
    $("replySend").disabled = false;
  }
}

function openCompose() {
  layout.classList.add("reading-open");
  $("backBtn").hidden = false;
  $("placeholder").hidden = true;
  $("reader").hidden = true;
  hideStatusBoard();
  $("composeForm").hidden = false;
  restoreDraft();
  $("cTo").focus();
}
function closeCompose({ preserveDraft = true } = {}) {
  if (preserveDraft) saveDraftNow();
  $("composeForm").hidden = true;
  if (selectedId) {
    $("reader").hidden = false;
    $("placeholder").hidden = true;
  } else {
    $("reader").hidden = true;
    $("placeholder").hidden = false;
  }
}

function draftFields() {
  return {
    recipients: [...recipientIds],
    subject: $("cSubject").value,
    body: $("cBody").value,
    requiresAck: $("cAck").checked,
    priority: $("cPriority").value,
  };
}

function saveDraftNow() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftFields()));
    $("draftStatus").textContent = "Draft saved";
  } catch {
    $("draftStatus").textContent = "";
  }
}

function queueDraftSave() {
  clearTimeout(queueDraftSave._t);
  queueDraftSave._t = setTimeout(saveDraftNow, 400);
}

function restoreDraft() {
  let draft = null;
  try {
    draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch {
    draft = null;
  }
  if (!draft || typeof draft !== "object") return;
  recipientIds = [];
  for (const id of Array.isArray(draft.recipients) ? draft.recipients : parseRecipients(draft.to)) {
    addRecipient(id);
  }
  $("cTo").value = "";
  $("cSubject").value = draft.subject || "";
  $("cBody").value = draft.body || "";
  $("cAck").checked = draft.requiresAck === true;
  $("cPriority").value = ["normal", "high", "blocker"].includes(draft.priority) ? draft.priority : "normal";
  $("draftStatus").textContent = "Draft saved";
  renderRecipientChips();
}

function clearDraft({ clearFields } = {}) {
  clearTimeout(queueDraftSave._t);
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
  $("draftStatus").textContent = "";
  if (clearFields) {
    recipientIds = [];
    $("cTo").value = "";
    $("cSubject").value = "";
    $("cBody").value = "";
    $("cAck").checked = false;
    $("cPriority").value = "normal";
    renderRecipientChips();
  }
}

function discardDraft() {
  clearDraft({ clearFields: true });
}

async function sendCompose(ev) {
  ev.preventDefault();
  commitRecipientInput();
  const toAgents = [...recipientIds];
  const body = $("cBody").value.trim();
  if (!toAgents.length) return toast("Add a recipient", true);
  if (!body) return toast("Body is empty", true);
  if (rosterAvailable) {
    const unknown = toAgents.filter((id) => !knownIds.has(id));
    if (unknown.length) return toast("Unknown recipient(s): " + unknown.join(", "), true);
  }
  $("composeSend").disabled = true;
  try {
    await api("/api/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        toAgents,
        subject: $("cSubject").value.trim() || "(no subject)",
        body,
        requiresAck: $("cAck").checked,
        priority: $("cPriority").value,
      }),
    });
    clearDraft({ clearFields: true });
    closeCompose({ preserveDraft: false });
    toast("Message sent");
    loadInbox();
  } catch (e) {
    toast("Send failed: " + e.message, true);
  } finally {
    $("composeSend").disabled = false;
  }
}

let rosterAvailable = false;
let myId = null;
let myDisplay = "jac";
const knownIds = new Set();
const displayById = new Map();
let recipientIds = [];

function senderLabel(id) {
  if (id === myId) return `${myDisplay} (you)`;
  return displayById.get(id) || id;
}

function parseRecipients(str) {
  return String(str || "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function addRecipient(raw) {
  const id = String(raw || "").trim();
  if (!id || recipientIds.includes(id)) return false;
  recipientIds.push(id);
  return true;
}

function removeRecipient(id) {
  recipientIds = recipientIds.filter((x) => x !== id);
  renderRecipientChips();
  queueDraftSave();
}

function recipientLabel(id) {
  const display = displayById.get(id);
  return display && display !== id ? `${id} (${display})` : id;
}

function renderRecipientChips() {
  const chips = $("recipientChips");
  chips.innerHTML = "";
  for (const id of recipientIds) {
    const chip = document.createElement("span");
    chip.className = "chip";
    if (rosterAvailable) chip.classList.add(knownIds.has(id) ? "chip-valid" : "chip-invalid");
    chip.dataset.id = id;
    chip.textContent = recipientLabel(id);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "chip-remove";
    remove.setAttribute("aria-label", "Remove " + id);
    remove.textContent = "x";
    remove.addEventListener("click", () => removeRecipient(id));
    chip.appendChild(remove);
    chips.appendChild(chip);
  }
}

function commitRecipientInput() {
  const input = $("cTo");
  const tokens = parseRecipients(input.value);
  let changed = false;
  for (const token of tokens) changed = addRecipient(token) || changed;
  input.value = "";
  if (changed) {
    renderRecipientChips();
    queueDraftSave();
  }
  return changed;
}

async function loadActors() {
  try {
    const { actors, rosterAvailable: avail } = await api("/api/actors");
    rosterAvailable = !!avail;
    knownIds.clear();
    displayById.clear();
    const dl = $("actorList");
    dl.innerHTML = "";
    for (const a of actors) {
      knownIds.add(a.id);
      displayById.set(a.id, a.display_name || a.id);
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.label = a.display_name && a.display_name !== a.id ? a.display_name : a.id;
      dl.appendChild(opt);
    }
    renderRecipientChips();
  } catch {
    rosterAvailable = false;
    renderRecipientChips();
  }
}

async function loadMe() {
  try {
    const me = await api("/api/me");
    myId = me.id;
    myDisplay = me.display || "jac";
    $("me").textContent = myDisplay;
    renderUnreadTotal(inboxMessages);
  } catch { /* keep default */ }
}

function restoreStatus() {
  try {
    const status = JSON.parse(localStorage.getItem(STATUS_KEY) || "null");
    if (status && status.summary) $("statusDisplay").textContent = status.summary;
  } catch { /* ignore bad local state */ }
}

function toggleStatusForm(show) {
  const form = $("statusForm");
  form.hidden = show === undefined ? !form.hidden : !show;
  if (!form.hidden) $("statusSummary").focus();
}

async function publishStatus(ev) {
  ev.preventDefault();
  const summary = $("statusSummary").value.trim();
  const nextStep = $("statusNext").value.trim();
  if (!summary) return toast("Status summary is required", true);
  $("statusPublish").disabled = true;
  try {
    await api("/api/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ summary, nextStep }),
    });
    $("statusDisplay").textContent = summary;
    localStorage.setItem(STATUS_KEY, JSON.stringify({ summary, nextStep }));
    toggleStatusForm(false);
    toast("Status published");
  } catch (e) {
    toast("Status failed: " + e.message, true);
  } finally {
    $("statusPublish").disabled = false;
  }
}

// wire up
$("recipientInput").addEventListener("click", () => $("cTo").focus());
// Actor ids never contain whitespace, so a space commits the token just like a comma.
$("cTo").addEventListener("input", () => {
  if (/[,\s]/.test($("cTo").value)) commitRecipientInput();
});
$("cTo").addEventListener("keydown", (ev) => {
  if (ev.key === "Enter" || ev.key === "," || ev.key === " ") {
    ev.preventDefault();
    commitRecipientInput();
  } else if (ev.key === "Backspace" && !$("cTo").value && recipientIds.length) {
    ev.preventDefault();
    recipientIds.pop();
    renderRecipientChips();
    queueDraftSave();
  }
});
$("cTo").addEventListener("blur", commitRecipientInput);
$("cSubject").addEventListener("input", queueDraftSave);
$("cBody").addEventListener("input", queueDraftSave);
$("composeBtn").addEventListener("click", openCompose);
$("composeCancel").addEventListener("click", () => closeCompose());
$("composeDiscard").addEventListener("click", discardDraft);
$("composeForm").addEventListener("submit", sendCompose);
$("replyForm").addEventListener("submit", sendReply);
$("refreshBtn").addEventListener("click", loadInbox);
$("closeMsgBtn").addEventListener("click", closeCurrentMessage);
$("quoteBtn").addEventListener("click", quoteParent);
$("cAck").addEventListener("change", queueDraftSave);
$("cPriority").addEventListener("change", queueDraftSave);
for (const b of document.querySelectorAll("#filters .filter")) {
  b.addEventListener("click", () => setFilter(b.dataset.filter));
}
$("statusBoardBtn").addEventListener("click", openStatusBoard);
$("viewAllBtn").addEventListener("click", toggleSenderAll);
$("ackBtn").addEventListener("click", acknowledgeMessage);
$("statusBtn").addEventListener("click", () => toggleStatusForm());
$("statusCancel").addEventListener("click", () => toggleStatusForm(false));
$("statusForm").addEventListener("submit", publishStatus);
$("backBtn").addEventListener("click", () => {
  layout.classList.remove("reading-open");
});

loadMe();
loadActors();
loadSent();
loadStatusBoard();
restoreDraft();
restoreStatus();
loadInbox();
