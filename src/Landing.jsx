import "./landing.css";

export default function Landing({ onStart }) {
  return (
    <div className="lp">
      <div className="lp-w">
        <header className="lp-nav">
          <span className="lp-logo"><i>✓</i>Meeting → Action</span>
          <button className="lp-btn sm" onClick={() => onStart("login")}>Log in</button>
        </header>

        <section className="lp-hero">
          <span className="lp-pill">Audio and video in. Tasks and emails out.</span>
          <h1>Every meeting ends with an <em>owner</em> and a date.</h1>
          <p className="lp-sub">
            Upload a recording. Get the minutes, tasks with owners and deadlines, and reminder emails that send
            themselves. Then see what keeps slipping.
          </p>
          <div className="lp-cta">
            <button className="lp-btn main" onClick={() => onStart("register")}>Create an account</button>
            <button className="lp-btn" onClick={() => onStart("login")}>Log in</button>
          </div>

          <div className="lp-stage" aria-label="Example dashboard">
            <div className="lp-win">
              <div className="lp-bar"><b /><b /><b /><span>Dashboard</span></div>
              <div className="lp-cols">
                <div>
                  <p className="lp-h" style={{ color: "var(--rose)" }}>Slipping</p>
                  <div className="lp-r"><div>Fix the login bug<small>Ravi · was due Fri 23 Oct</small></div><span className="tag rose">slipped 2×</span></div>
                  <div className="lp-r"><div>Prepare the Q4 report<small>Meera · due 13 Nov</small></div><span className="tag rose">slipped 1×</span></div>
                </div>
                <div>
                  <p className="lp-h" style={{ color: "var(--amb)" }}>No owner</p>
                  <div className="lp-r"><div>Onboarding emails<small>Raised in 2 meetings</small></div><span className="tag amb">needs owner</span></div>
                </div>
                <div>
                  <p className="lp-h" style={{ color: "var(--vio)" }}>Unresolved decisions</p>
                  <div className="lp-r"><div>Stripe or Razorpay?<small>Nobody decided</small></div><span className="tag vio">raised 3×</span></div>
                </div>
                <div>
                  <p className="lp-h" style={{ color: "var(--teal)" }}>Completed</p>
                  <div className="lp-r"><div>Send the pricing deck<small>Meera · done on 21 Oct</small></div><span className="tag teal">done</span></div>
                </div>
              </div>
            </div>
            <div className="lp-float a"><i>✓</i>Reminder sent to Ravi</div>
            <div className="lp-float b"><i>✓</i>Card created in Trello</div>
          </div>
        </section>

        <section className="lp-sec">
          <h2>It keeps watching after the meeting ends</h2>
          <p className="lead">Most notes are forgotten by Friday. These four things make sure the work actually happens.</p>
          <div className="lp-bento">
            <div className="lp-card w4">
              <h3>Tasks appear where your team already works</h3>
              <p>Each action item becomes a GitHub issue or a Trello card. Mark it done here and it closes there.</p>
              <div className="lp-mini">
                <div className="lp-r"><div>Fix the login bug<small>Ravi · due Fri 23 Oct</small></div><span className="tag vio">GitHub #42</span></div>
                <div className="lp-r"><div>Send the pricing deck<small>Meera · due Wed 21 Oct</small></div><span className="tag vio">Trello card</span></div>
              </div>
            </div>
            <div className="lp-card w2">
              <h3>Emails send themselves</h3>
              <p>Owners get reminders and everyone gets a recap, with no copying and pasting.</p>
              <div className="lp-mini"><div className="lp-r"><div>To Ravi<small>Reminder: 1 task due</small></div><span className="tag teal">sent</span></div></div>
            </div>
            <div className="lp-card w2">
              <h3>See what keeps slipping</h3>
              <p>Every missed or pushed deadline adds a slip. At two, it turns red.</p>
              <div className="lp-mini"><div className="lp-r"><div>Fix the login bug</div><span className="lp-dots"><b /><b /><b className="o" /></span></div></div>
            </div>
            <div className="lp-card w4">
              <h3>Catch decisions nobody made</h3>
              <p>"We never decided who owns this" gets flagged and counted each time it comes back. When it is settled, you record what was decided and when.</p>
              <div className="lp-mini">
                <div className="lp-r"><div>"Stripe or Razorpay? Let's circle back."<small>Meetings 1, 2 and 3</small></div><span className="tag vio">unresolved</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-sec">
          <h2>From recording to follow-up in four steps</h2>
          <p className="lead">No setup per meeting. Add your team once, then upload.</p>
          <ol className="lp-steps">
            <li><b>Upload</b><span>Audio or video, up to 500 MB.</span></li>
            <li><b>Read the minutes</b><span>A summary, discussion points and decisions.</span></li>
            <li><b>Check the tasks</b><span>Owners and deadlines pulled from what was said.</span></li>
            <li><b>Let emails go out</b><span>Reminders to owners, a recap to everyone.</span></li>
          </ol>
        </section>

        <section className="lp-band">
          <h2>Stop chasing people for updates</h2>
          <button className="lp-btn white" onClick={() => onStart("register")}>Create an account</button>
        </section>

        <footer className="lp-foot">Meeting → Action</footer>
      </div>
    </div>
  );
}
