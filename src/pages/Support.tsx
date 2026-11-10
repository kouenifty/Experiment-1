const FAQ = [
  {
    q: 'How is my balance calculated?',
    a: 'Your balance is the sum of all income minus all expenses you have recorded, including transfers and money moved into savings goals.',
  },
  {
    q: 'What happens when I add money to a savings goal?',
    a: 'The amount is recorded as a “Savings” expense so it leaves your spendable balance, and the goal’s progress goes up by the same amount.',
  },
  {
    q: 'Does “Send money” move real money?',
    a: 'No. Pocket is a tracker: sending records the transfer to that contact so your spending stays accurate. Use your bank to actually pay.',
  },
  {
    q: 'Can I use Pocket offline?',
    a: 'Yes, once installed the app shell loads offline. With a Supabase account, changes need a connection to sync; demo mode stores everything on this device.',
  },
  {
    q: 'How do I install the app?',
    a: 'On iPhone, tap Share → Add to Home Screen in Safari. On Android or desktop Chrome, use the Install button in Settings or the address bar.',
  },
  {
    q: 'Is my data private?',
    a: 'With Supabase, every table is protected by row-level security so only your signed-in account can read or change your rows.',
  },
]

export function Support() {
  return (
    <main className="page">
      <header className="bar-head">
        <span className="icon-btn-spacer" />
        <h1>Support</h1>
        <span className="icon-btn-spacer" />
      </header>
      <div className="support-hero tint-grad-lilac">
        <h2>How can we help?</h2>
        <p>Answers to the most common questions about Pocket.</p>
      </div>
      <div className="faq">
        {FAQ.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </main>
  )
}
