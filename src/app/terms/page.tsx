import { MarketingHeader } from "@/components/layout/MarketingHeader";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#0f2038_0%,#090f1b_45%,#050810_100%)] text-slate-100">
      <MarketingHeader />

      <article className="prose prose-invert mx-auto max-w-3xl px-6 py-16 prose-headings:font-semibold prose-p:text-slate-300 prose-li:text-slate-300">
        <h1>Terms of Service</h1>
        <p>Last updated: 2026-04-08</p>

        <h2>1. Use of Service</h2>
        <p>
          ArquiFX provides browser-based architectural design and simulation tools. You agree to use the platform in
          compliance with applicable laws and without attempting to disrupt service availability.
        </p>

        <h2>2. Accounts and Access</h2>
        <p>
          You are responsible for maintaining the confidentiality of your credentials and for all activities occurring
          under your account.
        </p>

        <h2>3. Project Data</h2>
        <p>
          Project files are stored in cloud infrastructure associated with your account. You retain ownership of your
          content, while granting ArquiFX the technical rights needed to store and process your data.
        </p>

        <h2>4. Beta Disclaimer</h2>
        <p>
          During beta, features may change without notice. Service interruptions or data inconsistencies may occur and
          should be considered part of early access participation.
        </p>

        <h2>5. Contact</h2>
        <p>For legal inquiries, contact: legal@arquifx.app</p>
      </article>
    </main>
  );
}
