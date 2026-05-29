import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold text-text-primary tracking-tight leading-tight">
            Build web automations
            <br />
            <span className="text-accent-primary">in plain English.</span>
          </h1>
          <p className="mt-6 text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            Describe what you want. Get a live pipeline. Wire Composer turns
            natural language into executable multi-step web automation workflows
            — no code required.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/composer"
              className="inline-flex h-12 items-center justify-center px-8 rounded-md bg-accent-primary text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Start building →
            </Link>
            <Link
              href="/pipelines"
              className="inline-flex h-12 items-center justify-center px-8 rounded-md bg-bg-subtle text-text-secondary border border-border-default text-sm font-medium hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              Saved Pipelines
            </Link>
          </div>
        </div>
      </main>

      <section className="py-20 px-6 border-t border-border-default">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg bg-bg-surface border border-border-default">
            <div className="text-accent-primary text-2xl font-mono mb-3">01</div>
            <h3 className="text-base font-semibold text-text-primary">Parse</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Describe your workflow in plain English. Our AI compiler maps it
              to real Wire actions and assembles a visual pipeline DAG.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-bg-surface border border-border-default">
            <div className="text-accent-primary text-2xl font-mono mb-3">02</div>
            <h3 className="text-base font-semibold text-text-primary">Run</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Add your credentials and hit run. Watch each node execute in
              real-time with live status updates streaming into the canvas.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-bg-surface border border-border-default">
            <div className="text-accent-primary text-2xl font-mono mb-3">03</div>
            <h3 className="text-base font-semibold text-text-primary">Schedule</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Save your pipeline, set a cron schedule, or deploy it as a webhook
              endpoint for programmatic triggering.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
