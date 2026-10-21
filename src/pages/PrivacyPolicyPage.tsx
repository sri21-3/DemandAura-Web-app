import React from 'react';
import {
  CheckCircle2,
  Database,
  ExternalLink,
  Eye,
  FileText,
  Lock,
  Mail,
  Shield,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { AppPage } from '../types/models';

interface PrivacyPolicyPageProps {
  onNavigate: (page: AppPage) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onNavigate,
}) => {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 space-y-10">
      {/* Header Banner */}
      <div className="bg-aura-banner text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-lg space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5" />
          <span>Legal &amp; Privacy Compliance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Effective Date: October 4, 2026 · Last Updated: October 2026
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          DemandAura (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your
          personal information and your right to privacy. This policy outlines how
          we collect, store, process, and protect your information when you access
          our web platform, use Google Sign-In, or interact with our market demand
          intelligence tools.
        </p>
      </div>

      <div className="space-y-8 text-slate-800 text-sm leading-relaxed">
        {/* Section 1: Overview & Scope */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-600" />
            <span>1. Overview &amp; Purpose of Platform</span>
          </h2>
          <p className="text-slate-600">
            DemandAura is an independent machine learning engineering and consumer demand
            foresight platform designed for market analytics and predictive research. The
            platform analyzes authentic, empirical public search interest trends and
            macroeconomic sentiment across 14 global economies in three consumer lifestyle
            verticals (Fashion &amp; Beauty, Fitness &amp; Wearables, and Nutrition &amp; Diets).
          </p>
          <p className="text-slate-600">
            The platform operates on a principle of <strong>strict data minimization</strong>. We
            do not sell user data, nor do we collect, process, or infer sensitive personal health records,
            biometrics, payment details, or personal financial data.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>2. Information We Collect</span>
          </h2>
          <div className="space-y-3 text-slate-600">
            <div>
              <strong className="text-slate-900 block">
                A. Authentication Data (Firebase Authentication / Google Sign-In):
              </strong>
              When you create an account or sign in with Google or Email/Password:
              <ul className="list-disc pl-5 mt-1 space-y-1 text-xs text-slate-600">
                <li>
                  Your unique, system-generated User Identification (UID).
                </li>
                <li>
                  Your verified email address and display name provided by your
                  identity provider.
                </li>
                <li>
                  <strong>No Passwords Persisted by Us:</strong> Authentication is
                  delegated to Google Firebase Authentication. We never receive,
                  log, or store your raw account passwords.
                </li>
              </ul>
            </div>

            <div>
              <strong className="text-slate-900 block">
                B. User Profile &amp; Default Market Preferences:
              </strong>
              You may optionally specify your organization name, job title, and
              default target country and category preferences in your profile.
            </div>

            <div>
              <strong className="text-slate-900 block">
                C. Saved Analysis Records &amp; Query History:
              </strong>
              When you run a Divergence Score or 4-Week Forecast prediction, you may
              save the resulting forecast output, country name, category, and
              optional planning notes to your private history.
            </div>

            <div>
              <strong className="text-slate-900 block">
                D. Technical Session &amp; Audit Logs:
              </strong>
              To prevent unauthorized access, brute-force attacks, and session
              hijacking, we log session events containing your client platform,
              browser type, resolved timezone, and login timestamp. We do not sell or
              monetize this operational log data.
            </div>
          </div>
        </section>

        {/* Section 3: Google API User Data Policy Compliance */}
        <section className="bg-gradient-to-br from-indigo-50/60 to-cyan-50/40 border border-indigo-200/80 rounded-2xl p-6 space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-indigo-950 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>3. Google API Services User Data Policy Compliance</span>
          </h2>
          <p className="text-xs text-indigo-900 leading-relaxed">
            DemandAura&apos;s use and transfer to any other app of information received
            from Google APIs adheres to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-700 underline inline-flex items-center gap-1"
            >
              Google API Services User Data Policy
              <ExternalLink className="w-3 h-3" />
            </a>
            , including the Limited Use requirements.
          </p>
          <div className="bg-white/80 border border-indigo-100 rounded-xl p-4 text-xs text-slate-700 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Limited Use Commitment:</strong> Information accessed
                via Google Sign-In is used exclusively to authenticate your session
                and personalize your user experience within DemandAura.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>No Advertising or Sale of Data:</strong> We do NOT sell,
                rent, or license Google user data to data brokers, advertisers, or
                third-party aggregators.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>No AI Training on Private Data:</strong> User data received
                from Google Sign-In is NOT used to train generalized artificial
                intelligence or machine learning models.
              </span>
            </div>
          </div>
        </section>

        {/* Section 4: Public Data Sources & Non-Affiliation Disclaimer */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>4. Data Sources, Academic Research &amp; Trademark Disclaimers</span>
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            DemandAura integrates publicly available, genuine macroeconomic, news sentiment, and
            search interest indicators strictly for statistical analysis and market intelligence:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>
              <strong>Google Trends™ Data:</strong> Aggregated, normalized search
              interest time series are referenced for statistical analysis under fair-use research principles. Google
              and Google Trends are registered trademarks of Google LLC. DemandAura does not redistribute, resell, or commercialize Google data.
            </li>
            <li>
              <strong>GDELT Project:</strong> Global database of news volume and
              sentiment indicators used in accordance with open research principles.
            </li>
            <li>
              <strong>World Bank Open Data:</strong> Public macroeconomic indicators
              including national GDP per capita and consumer inflation used under the Creative Commons CC-BY 4.0 license.
            </li>
          </ul>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium">
            <strong>Trademark &amp; Non-Affiliation Notice:</strong> DemandAura is an
            independent technical platform and research system. DemandAura is not affiliated with,
            endorsed by, sponsored by, or formally associated with Google LLC,
            Alphabet Inc., or any of their subsidiaries.
          </div>
        </section>

        {/* Section 5: Data Storage, Security & Retention */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>5. Data Security &amp; Storage</span>
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            All user preferences and prediction records are stored in Google Cloud
            Firebase Firestore, secured with attribute-based access control (ABAC)
            and Zero-Trust security rules. All communications between your browser,
            the application gateway, and backend services are encrypted in transit
            using Transport Layer Security (TLS 1.3 / HTTPS).
          </p>
        </section>

        {/* Section 6: User Rights & Data Deletion */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>6. Your Rights &amp; How to Delete Your Data</span>
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            Under GDPR, CCPA, and Google&apos;s User Data Policies, you have the right to
            access, rectify, export, or permanently delete your account and personal
            data:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <strong className="text-slate-900 block">
                Self-Service Deletion via Profile:
              </strong>
              <p className="text-slate-600">
                You can delete individual prediction records or permanently delete
                your user profile directly from the{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('profile')}
                  className="text-cyan-700 underline font-semibold"
                >
                  Member Profile
                </button>{' '}
                page at any time.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <strong className="text-slate-900 block">
                Manual Erasure Request:
              </strong>
              <p className="text-slate-600">
                To request complete data erasure or an export of your information,
                email us at{' '}
                <a
                  href="mailto:support@demandaura.com"
                  className="text-cyan-700 underline font-semibold"
                >
                  support@demandaura.com
                </a>
                . Requests are processed within 14 business days.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Cookies and Local Storage */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-600" />
            <span>7. Cookies &amp; Local Storage</span>
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            We use essential browser local storage and cookies strictly to maintain
            your authenticated session state (via Firebase Auth
            browserLocalPersistence). We do not use third-party advertising cookies
            or cross-site trackers.
          </p>
        </section>

        {/* Section 8: Contact Information */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>8. Contact Information</span>
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            If you have questions, feedback, or concerns regarding this Privacy
            Policy or our data handling practices, please contact our team:
          </p>
          <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 font-mono">
            <div>
              <strong>Data Governance &amp; Administration:</strong>{' '}
              DemandAura Operations Team
            </div>
            <div>
              <strong>Email:</strong>{' '}
              <a
                href="mailto:support@demandaura.com"
                className="text-cyan-700 underline font-semibold"
              >
                support@demandaura.com
              </a>
            </div>
            <div>
              <strong>Support Desk:</strong>{' '}
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="text-cyan-700 underline font-semibold"
              >
                DemandAura Contact Page
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
