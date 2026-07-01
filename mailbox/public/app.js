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

function esc(s) {
  return String(s == null ? "" : s);
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
  from.textContent = showFrom ? esc(m.from) : "";
  const when = document.createElement("span");
  when.className = "when";
  when.textContent = fmtWhen(m.created_at);
  const subj = document.createElement("span");
  subj.className = "subj";
  subj.textContent = esc(m.subject) || "(no subject)";
  li.append(dot, from, when, subj);
  if (needsAck(m)) li.appendChild(ackFlag());
  li.addEventListener("click", () => openMessage(m.id));
  return li;
}

function renderInbox(messages) {
  const ul = $("messages");
  ul.innerHTML = "";
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
    head.innerHTML =
      `<span class="caret">${expanded ? "▾" : "▸"}</span>` +
      `<span class="from">${esc(senderLabel(sender))}</span>` +
      (unread ? `<span class="badge">${unread}</span>` : "") +
      `<span class="when">${fmtWhen(latest.created_at)}</span>` +
      `<span class="count">${msgs.length}</span>` +
      `<span class="subj">${esc(latest.subject) || "(no subject)"}</span>`;
    if (groupNeedsAck) head.appendChild(ackFlag());
    head.addEventListener("click", () => {
      if (expandedGroups.has(sender)) expandedGroups.delete(sender);
      else expandedGroups.add(sender);
      renderInbox(messages);
    });
    group.appendChild(head);

    const sub = document.createElement("ul");
    sub.className = "group-msgs";
    sub.hidden = !expanded;
    for (const m of msgs) sub.appendChild(makeMsgRow(m, { showFrom: false }));
    group.appendChild(sub);

    ul.appendChild(group);
  }
}

// Last loaded inbox, so "View all from <sender>" can list a sender's messages
// without a refetch. The operator seat only returns messages addressed TO jac,
// so this is the sender's messages to you, not a two-sided thread.
let inboxMessages = [];
let sentMessages = [];
let sentAvailable = false;

async function loadInbox() {
  try {
    const { messages } = await api("/api/inbox");
    inboxMessages = Array.isArray(messages) ? messages : [];
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
    meta.textContent = `${esc(m.from)} - ${esc(m.subject)} - ${fmtWhen(m.created_at)}`;
    const body = document.createElement("div");
    body.className = "t-body";
    body.textContent = esc(m.body);
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
        `${m.status === "sent" ? "* " : ""}${esc(m.subject) || "(no subject)"}` +
        ` - ${fmtWhen(m.created_at)}` +
        (m.id === selectedId ? " - (open)" : "");
      const body = document.createElement("div");
      body.className = "t-body";
      body.textContent = esc(m.body_snippet || "");
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
      ? `${myDisplay} (you) - ${esc(m.subject) || "(no subject)"} - ${fmtWhen(m.created_at)}`
      : `${m.status === "sent" ? "* " : ""}${esc(m.subject) || "(no subject)"}` +
        ` - ${fmtWhen(m.created_at)}` +
        (m.id === selectedId ? " - (open)" : "");
    const body = document.createElement("div");
    body.className = "t-body";
    body.textContent = esc(m.body_snippet || "");
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

async function openMessage(id) {
  selectedId = id;
  layout.classList.add("reading-open");
  $("backBtn").hidden = false;
  $("placeholder").hidden = true;
  $("composeForm").hidden = true;
  $("reader").hidden = false;
  try {
    const { message, thread } = await api("/api/message?id=" + encodeURIComponent(id));
    $("rSubject").textContent = esc(message.subject) || "(no subject)";
    $("rFrom").textContent = "From: " + esc(senderLabel(message.from));
    $("rWhen").textContent = fmtWhen(message.created_at);
    $("rBody").textContent = esc(message.body);
    renderAckControl(message);
    renderThread(thread);
    setupSenderAll(message.from);
    // store reply context
    $("replyForm").dataset.to = message.from;
    $("replyForm").dataset.parent = message.id;
    $("replyForm").dataset.subject = message.subject || "";
    $("replyBody").value = "";
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

async function sendReply(ev) {
  ev.preventDefault();
  const form = $("replyForm");
  const body = $("replyBody").value.trim();
  if (!body) return toast("Reply is empty", true);
  const subject = form.dataset.subject || "";
  const replySubject = subject.startsWith("Re:") ? subject : "Re: " + subject;
  $("replySend").disabled = true;
  try {
    await api("/api/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to: form.dataset.to,
        subject: replySubject,
        body,
        parentMessageId: form.dataset.parent,
      }),
    });
    $("replyBody").value = "";
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
      body: JSON.stringify({ toAgents, subject: $("cSubject").value.trim() || "(no subject)", body }),
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
$("cTo").addEventListener("input", () => {
  if ($("cTo").value.includes(",")) commitRecipientInput();
});
$("cTo").addEventListener("keydown", (ev) => {
  if (ev.key === "Enter" || ev.key === ",") {
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
restoreDraft();
restoreStatus();
loadInbox();
