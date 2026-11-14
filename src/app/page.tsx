const workstreams = [
  {
    number: "01",
    name: "Backend foundation",
    detail: "Authentication, squad permissions, goals, tasks and progress APIs.",
  },
  {
    number: "02",
    name: "Avatar growth system",
    detail: "A permanent five-stage progression shared by 3D and anime styles.",
  },
  {
    number: "03",
    name: "Design integration",
    detail: "Approved Figma assets and responsive screens are integrated later.",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-violet-800">
            <span aria-hidden className="inline-block size-3 rounded-full bg-violet-600" />
            MOMENTUM
          </span>
          <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700">
            Engineering foundation · Phase 00
          </span>
        </header>

        <section className="mt-16 max-w-3xl sm:mt-24">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
            Build together. Grow together.
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            A little progress, <span className="text-violet-700">every day.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Momentum is a group accountability app for friends. This page is a temporary
            engineering placeholder while the backend is built and the final character
            designs are being reviewed in Figma.
          </p>
          <a
            href="/api/health"
            className="mt-8 inline-flex rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
          >
            Check the API health endpoint
          </a>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3" aria-label="Planned development workstreams">
          {workstreams.map((item) => (
            <article key={item.number} className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold tracking-widest text-violet-600">{item.number}</p>
              <h2 className="mt-3 text-lg font-semibold">{item.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </section>

        <footer className="mt-16 border-t border-slate-200 pt-6 text-xs text-slate-500">
          This foundation does not include a production login, connected database, or final Figma UI.
        </footer>
      </div>
    </main>
  );
}
