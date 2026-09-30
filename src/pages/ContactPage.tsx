import React, { useState } from 'react';
import {
  DEVELOPER_INFO,
  VALID_CATEGORIES,
  VALID_COUNTRIES,
} from '../config/api';
import { useAuth } from '../context/AuthContext';
import { AppPage, InquiryTopic } from '../types/models';

interface ContactPageProps {
  onNavigate: (page: AppPage) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { user, profile, inquiries, submitContactInquiry } = useAuth();

  const [senderName, setSenderName] = useState(
    profile?.displayName || user?.displayName || ''
  );
  const [organization, setOrganization] = useState(
    profile?.organization || ''
  );
  const [topic, setTopic] = useState<InquiryTopic>('Custom Market Coverage');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Please sign in first to submit an inquiry.');
      return;
    }

    if (message.trim().length < 5) {
      setErrorMessage('Please provide at least 5 characters in your message.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactInquiry({
        senderName: senderName || user.displayName || 'Market Planner',
        organization: organization || 'Enterprise Team',
        topic,
        message,
      });
      setMessage('');
      setStatusMessage(
        'Your inquiry has been received and saved to your account.'
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to submit inquiry.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12 space-y-12">
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="text-xs text-slate-500">
          Direct Developer Contact &amp; Market Foresight Support
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Contact DemandAura &amp; {DEVELOPER_INFO.name}
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Connect directly with developer <strong>{DEVELOPER_INFO.name}</strong>{' '}
          or submit a market intelligence inquiry below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <h2 className="text-base font-semibold text-slate-900">
            Submit a Market Intelligence Inquiry
          </h2>

          {!user && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                Sign in to your account to submit inquiries and track responses
                in your workspace.
              </div>
              <button
                type="button"
                onClick={() => onNavigate('signin')}
                className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap"
              >
                Sign In
              </button>
            </div>
          )}

          {statusMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3.5">
              {statusMessage}
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3.5">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Your Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  maxLength={100}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="contact-org"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Organization / Brand *
                </label>
                <input
                  id="contact-org"
                  type="text"
                  required
                  maxLength={120}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Global Retail Group"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="contact-topic"
                className="block text-xs font-semibold text-slate-800"
              >
                Inquiry Topic *
              </label>
              <select
                id="contact-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value as InquiryTopic)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="Custom Market Coverage">
                  Custom Market &amp; Country Coverage
                </option>
                <option value="Enterprise Licensing">
                  Enterprise Team Access &amp; Licensing
                </option>
                <option value="Model Calibration">
                  Category Insights &amp; Advisory Walkthrough
                </option>
                <option value="API Integration">
                  Data Feeds &amp; Reporting Exports
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="contact-msg"
                className="block text-xs font-semibold text-slate-800"
              >
                How Can We Help? (5–2,000 characters) *
              </label>
              <textarea
                id="contact-msg"
                rows={5}
                required
                minLength={5}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us which countries, consumer categories, or planning workflows your team is focusing on..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !user}
              className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Sending Inquiry...' : 'Submit Inquiry'}
            </button>
          </form>
        </div>

        {/* Right Column: Developer Profile, Coverage Summary & Previous Inquiries */}
        <div className="lg:col-span-5 space-y-6">
          {/* Developer Direct Contact Card */}
          <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-400">
                Developer &amp; Platform Creator
              </div>
              <h3 className="text-lg font-semibold text-white">
                {DEVELOPER_INFO.name}
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Personal Email</span>
                <a
                  href={`mailto:${DEVELOPER_INFO.email}`}
                  className="text-white hover:underline font-mono-tabular"
                >
                  {DEVELOPER_INFO.email}
                </a>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">LinkedIn</span>
                <a
                  href={DEVELOPER_INFO.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline font-mono-tabular"
                >
                  {DEVELOPER_INFO.linkedinDisplay}
                </a>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">GitHub</span>
                <a
                  href={DEVELOPER_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline font-mono-tabular"
                >
                  {DEVELOPER_INFO.githubDisplay}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Current Global Coverage
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              DemandAura provides weekly updates across{' '}
              <strong>{VALID_COUNTRIES.length} countries</strong> and{' '}
              <strong>{VALID_CATEGORIES.length} consumer lifestyle verticals</strong>{' '}
              (Fashion &amp; Beauty, Fitness &amp; Wearables, and Nutrition &amp;
              Diets), tracking 63 distinct consumer search and media keywords.
            </p>
          </div>

          {user && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Your Submitted Inquiries ({inquiries.length})
              </h3>
              {inquiries.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No inquiries submitted from your account yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="border border-slate-200 rounded-lg p-3.5 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-slate-500 font-mono-tabular">
                        <span>{inq.topic}</span>
                        <span>Status: {inq.status}</span>
                      </div>
                      <p className="text-slate-800">{inq.message}</p>
                      <div className="text-slate-400 font-mono-tabular">
                        {new Date(inq.createdAtIso).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
