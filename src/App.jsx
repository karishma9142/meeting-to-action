import { useEffect, useState } from "react";
import Landing from "./Landing.jsx";

const getToken = () => localStorage.getItem("token");
const api = async (url, opts = {}) => {
  const headers = { ...(opts.headers || {}) };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const r = await fetch(url, { ...opts, headers });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && getToken()) { localStorage.removeItem("token"); window.location.reload(); }
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
};
const send = (method, body) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const fmt = (d) => (d ? new Date(d).toLocaleString() : "");
const STATUS = { sent: ["Sent", "#16a34a"], draft: ["Not sent", "#6b7280"], failed: ["Failed", "#dc2626"], no_email: ["No email address", "#d97706"] };

function AuthPage({ onAuth, initialMode = "login", onBack }) {
  const [mode, setMode] = useState(initialMode);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await api(`/api/auth/${mode}`, send("POST", Object.fromEntries(new FormData(e.target))));
      onAuth(r.token, r.user);
    } catch (ex) { setErr(ex.message); }
    setBusy(false);
  };
  const reg = mode === "register";
  return (
    <div className="wrap">
      <form className="card auth" onSubmit={submit}>
        {onBack && <button type="button" className="link" onClick={onBack}>← Back to home</button>}
        <h2>{reg ? "Create admin account" : "Admin login"}</h2>
        {reg && <label>Name<input name="name" required /></label>}
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" minLength={6} required /></label>
        <button className="primary" disabled={busy}>{busy ? "Please wait…" : reg ? "Register" : "Log in"}</button>
        {err && <p className="err">{err}</p>}
        <p className="muted">
          {reg ? "Already have an account? " : "New here? "}
          <button type="button" className="link" onClick={() => { setMode(reg ? "login" : "register"); setErr(""); }}>
            {reg ? "Log in" : "Create an account"}
          </button>
        </p>
      </form>
    </div>
  );
}

function MeetingView({ id }) {
  const [data, setData] = useState(null);
  const [busyIdx, setBusyIdx] = useState(null);
  const [msg, setMsg] = useState({});
  useEffect(() => { api(`/api/meetings/${id}`).then(setData); }, [id]);
  if (!data) return <p className="muted">Loading…</p>;
  const { meeting: m, actions } = data;

  // one handler for BOTH "Send now" and "Resend"
  const sendMail = async (i) => {
    setBusyIdx(i);
    setMsg((p) => ({ ...p, [i]: "" }));
    try {
      const meeting = await api(`/api/meetings/${id}/emails/${i}/send`, { method: "POST" });
      setData((d) => ({ ...d, meeting }));
      const e = meeting.emails[i];
      setMsg((p) => ({ ...p, [i]: e.status === "sent" ? "✅ Email sent" : "⚠ " + (e.error || "Not sent") }));
    } catch (ex) {
      setMsg((p) => ({ ...p, [i]: "⚠ " + ex.message }));
    }
    setBusyIdx(null);
  };

  return (
    <>
      <div className="card">
        <h2>{m.title} <span className="muted">· {m.date}</span></h2>
        <p>{m.minutes.summary}</p>
        <h3>Discussion</h3>
        <ul>{m.minutes.discussionPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
        <h3>Decisions</h3>
        {m.minutes.decisions.length === 0 && <p className="muted">No decisions were made.</p>}
        <ul>{m.minutes.decisions.map((d, i) => <li key={i}>{d.decision} <span className="muted">({d.owner || "no owner"})</span></li>)}</ul>
      </div>
      <div className="card">
        <h2>New action items</h2>
        {actions.length === 0 && <p className="muted">No new action items. Tasks already tracked from earlier meetings are not duplicated, so check the Dashboard for open ones.</p>}
        {actions.map((a) => (
          <div className="row" key={a._id}>
            <div>{a.task}<div className="muted">{a.owner || "⚠ UNASSIGNED"} · due {a.due || "not set"} {a.extUrl && <>· <a href={a.extUrl} target="_blank" rel="noreferrer">task link</a></>}</div></div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Emails</h2>
        {m.emails.length === 0 && <p className="muted">No emails.</p>}
        {m.emails.map((e, i) => {
          const [label, color] = STATUS[e.status] || STATUS.draft;
          return (
            <div key={i}>
              <h3>To: {e.to} {e.status !== "sent" && <span className="badge" style={{ background: color }}>{label}</span>}</h3>
              {e.toEmails?.length > 0 && <p className="muted">{e.toEmails.join(", ")}</p>}
              {e.error && <p className="muted">{e.error}</p>}
              <p className="muted"><b>{e.subject}</b></p>
              <pre>{e.body}</pre>
              <div className="actions">
                <button type="button" className="small" disabled={busyIdx === i} onClick={() => sendMail(i)}>
                  {busyIdx === i ? "Sending…" : "Send"}
                </button>
                <button type="button" className="small" onClick={() => navigator.clipboard.writeText(e.body)}>Copy</button>
                {e.previewUrl && <a href={e.previewUrl} target="_blank" rel="noreferrer">Preview sent email</a>}
                {e.sentAt && <span className="muted">sent {fmt(e.sentAt)}</span>}
              </div>
              {msg[i] && <p style={{ marginTop: 8 }}>{msg[i]}</p>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Upload({ onDone, mail }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [file, setFile] = useState(null);
  const [autoSend, setAutoSend] = useState(true);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const fd = new FormData(e.target);
      fd.set("autoSend", String(autoSend));
      const m = await api("/api/meetings", { method: "POST", body: fd });
      onDone(m._id);
    } catch (ex) { setErr(ex.message); }
    setBusy(false);
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>New meeting</h2>
      {mail === "off" && <div className="notice">⚠ Email is not configured, so emails will be saved as drafts. See .env.example.</div>}
      {mail === "test" && <div className="notice">Email test mode: messages go to a fake inbox and you get a preview link. No real emails are sent.</div>}
      <label>Title (optional)<input name="title" /></label>
      <label>Date<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
      <label>Attendees (comma separated, same names as on the Team tab)<input name="attendees" placeholder="Asha, Ravi, Meera" /></label>
      <label>Audio or video recording (mp3, wav, m4a, mp4, mov, mkv, webm · up to 500MB)
        <input name="audio" type="file" accept="audio/*,video/*,.mkv,.mov" onChange={(e) => setFile(e.target.files[0] || null)} />
      </label>
      {file && <p className="muted">{file.type.startsWith("video") ? "🎬" : "🎵"} {file.name} · {(file.size / 1048576).toFixed(1)} MB</p>}
      <label>…or paste a transcript<textarea name="transcriptText" rows={5} /></label>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" style={{ width: "auto", margin: 0 }} checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} />
        Email reminders and the recap automatically
      </label>
      <br />
      <button className="primary" disabled={busy}>{busy ? "Agents working… (can take a minute)" : "Process meeting"}</button>
      {err && <p className="err">{err}</p>}
    </form>
  );
}

const Section = ({ title, color, empty, children, count }) => (
  <div className="card"><h2 style={{ color }}>{title} ({count})</h2>{count === 0 ? <p className="muted">{empty}</p> : children}</div>
);

function Dashboard() {
  const [r, setR] = useState(null);
  const load = () => api("/api/report").then(setR);
  useEffect(() => { load(); }, []);
  if (!r) return <p className="muted">Loading…</p>;
  const done = (id) => api(`/api/actions/${id}`, send("PATCH", { status: "done" })).then(load);
  const reopenAction = (id) => api(`/api/actions/${id}`, send("PATCH", { status: "open" })).then(load);
  const resolve = (id) => {
    const resolution = window.prompt("What was decided? (optional)");
    if (resolution === null) return;
    api(`/api/topics/${id}/resolve`, send("PATCH", { resolution })).then(load);
  };
  const reopenTopic = (id) => api(`/api/topics/${id}/reopen`, { method: "PATCH" }).then(load);
  const remind = () => api("/api/reminders/run", { method: "POST" }).then((x) => alert(`${x.sent} reminder email(s) sent, ${x.skipped} skipped (no email address or not configured)`));
  return (
    <>
      <div className="actions" style={{ marginBottom: 14 }}>
        <button className="small" onClick={remind}>Send overdue reminders now</button>
      </div>
      <Section title="🔴 Slipping / overdue" color="var(--red)" count={r.slipping.length} empty="Nothing slipping.">
        {r.slipping.map((a) => (
          <div className="row" key={a._id}>
            <div>{a.task}<div className="muted">{a.owner || "UNASSIGNED"} · due {a.due || "—"} · <b>slipped {a.slips}×</b></div></div>
            <button className="small" onClick={() => done(a._id)}>Mark done</button>
          </div>
        ))}
      </Section>
      <Section title="🟠 No owner" color="var(--amber)" count={r.unowned.length} empty="Everything has an owner.">
        {r.unowned.map((a) => <div className="row" key={a._id}><div>{a.task}</div><button className="small" onClick={() => done(a._id)}>Mark done</button></div>)}
      </Section>
      <Section title="🟡 Unresolved decisions" color="var(--yellow)" count={r.unresolved.length} empty="No open decisions.">
        {r.unresolved.map((t) => (
          <div className="row" key={t._id}>
            <div>{t.topic}<div className="muted">{t.why} · raised {t.raised}×</div></div>
            <button className="small" onClick={() => resolve(t._id)}>Resolved</button>
          </div>
        ))}
      </Section>
      <Section title="✅ Completed" color="#16a34a" count={r.completedActions.length + r.resolvedTopics.length} empty="Nothing completed yet.">
        {r.completedActions.map((a) => (
          <div className="row" key={a._id}>
            <div>✔ {a.task}<div className="muted">Task · {a.owner || "—"} · done {fmt(a.doneAt)} · by {a.doneBy}</div></div>
            <button className="small" onClick={() => reopenAction(a._id)}>Reopen</button>
          </div>
        ))}
        {r.resolvedTopics.map((t) => (
          <div className="row" key={t._id}>
            <div>✔ {t.topic}<div className="muted">Decision · resolved {fmt(t.resolvedAt)} · by {t.resolvedBy}{t.resolution ? ` · ${t.resolution}` : ""}</div></div>
            <button className="small" onClick={() => reopenTopic(t._id)}>Reopen</button>
          </div>
        ))}
      </Section>
    </>
  );
}

function History({ open }) {
  const [list, setList] = useState([]);
  useEffect(() => { api("/api/meetings").then(setList); }, []);
  return (
    <div className="card"><h2>Past meetings</h2>
      {list.length === 0 && <p className="muted">No meetings yet.</p>}
      {list.map((m) => <div className="row" key={m._id}><div>{m.title}<div className="muted">{m.date}</div></div><button className="small" onClick={() => open(m._id)}>Open</button></div>)}
    </div>
  );
}

function Team() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const load = () => api("/api/contacts").then(setList);
  useEffect(() => { load(); }, []);
  const add = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await api("/api/contacts", send("POST", Object.fromEntries(new FormData(form))));
      form.reset(); setErr(""); load();
    } catch (ex) { setErr(ex.message); }
  };
  const remove = (id) => api(`/api/contacts/${id}`, { method: "DELETE" }).then(load);
  return (
    <>
      <form className="card" onSubmit={add}>
        <h2>Add team member</h2>
        <p className="muted">Emails are sent automatically to these addresses. The name must match how you type attendees (for example “Meera”).</p>
        <label>Name<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <button className="primary">Add</button>
        {err && <p className="err">{err}</p>}
      </form>
      <div className="card"><h2>Team ({list.length})</h2>
        {list.length === 0 && <p className="muted">No team members yet.</p>}
        {list.map((c) => <div className="row" key={c._id}><div>{c.name}<div className="muted">{c.email}</div></div><button className="small" onClick={() => remove(c._id)}>Remove</button></div>)}
      </div>
    </>
  );
}

function Main({ user, onLogout }) {
  const [tab, setTab] = useState("new");
  const [openId, setOpenId] = useState(null);
  const [mail, setMail] = useState("");
  useEffect(() => { api("/api/status").then((s) => setMail(s.mail)); }, []);
  const show = (id) => { setOpenId(id); setTab("view"); };
  const reset = () => {
    if (window.confirm("Delete ALL meetings, tasks and decisions? Team contacts are kept."))
      api("/api/dev/reset", { method: "DELETE" }).then(() => window.location.reload());
  };
  return (
    <div className="wrap">
      <div className="top">
        <h1>Meeting → Action</h1>
        <div className="muted">
          {user.name} (admin) · <button className="link" onClick={onLogout}>Log out</button> · <button className="link" onClick={reset}>Reset data</button>
        </div>
      </div>
      <nav>
        {[["new", "New meeting"], ["dash", "Dashboard"], ["hist", "History"], ["team", "Team"]].map(([k, l]) =>
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
      </nav>
      {tab === "new" && <Upload onDone={show} mail={mail} />}
      {tab === "dash" && <Dashboard />}
      {tab === "hist" && <History open={show} />}
      {tab === "team" && <Team />}
      {tab === "view" && openId && <MeetingView id={openId} />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("landing");
  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api("/api/auth/me").then(setUser).catch(() => localStorage.removeItem("token")).finally(() => setReady(true));
  }, []);
  if (!ready) return null;
  if (!user && view === "landing") return <Landing onStart={setView} />;
  if (!user) return <AuthPage initialMode={view} onBack={() => setView("landing")} onAuth={(token, u) => { localStorage.setItem("token", token); setUser(u); }} />;
  return <Main user={user} onLogout={() => { localStorage.removeItem("token"); setUser(null); setView("landing"); }} />;
}
