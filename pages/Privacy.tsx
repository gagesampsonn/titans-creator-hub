import React from 'react';
import { Shield, Lock, Eye, Database, Mail, Trash2 } from 'lucide-react';

const Privacy = () => {
  const lastUpdated = "December 16, 2024";

  return (
    <div className="min-h-screen bg-titan-bg">
      {/* Header */}
      <div className="bg-titan-bg py-12 border-b border-titan-border">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent-teal/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-teal" />
            </div>
            <span className="text-xs text-text-muted uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Privacy Policy</h1>
          <p className="text-text-muted text-sm">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose prose-invert max-w-none">
          
          {/* Introduction */}
          <section className="mb-10">
            <p className="text-text-secondary leading-relaxed">
              Titans ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services at titans-creator-hub.vercel.app (the "Platform").
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-accent-teal" />
              <h2 className="text-xl font-semibold text-text-primary m-0">Information We Collect</h2>
            </div>
            <div className="bg-titan-surface border border-titan-border rounded-lg p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Account Information</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  When you create an account, we collect your email address and password (encrypted). You may also provide your TikTok handle to access creator-specific features.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Usage Data</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  We automatically collect information about how you interact with our Platform, including pages visited, features used, and video audit requests.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Creator Metrics</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  If you're a linked creator, we may display performance metrics (GMV, items sold, commission) provided by our agency partnership. This data is only visible to you.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-accent-teal" />
              <h2 className="text-xl font-semibold text-text-primary m-0">How We Use Your Information</h2>
            </div>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-accent-teal rounded-full mt-2 flex-shrink-0"></span>
                <span>To provide and maintain our Platform services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-accent-teal rounded-full mt-2 flex-shrink-0"></span>
                <span>To personalize your dashboard with relevant creator metrics</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-accent-teal rounded-full mt-2 flex-shrink-0"></span>
                <span>To process video audits and provide AI-powered feedback</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-accent-teal rounded-full mt-2 flex-shrink-0"></span>
                <span>To communicate with you about updates, features, or support</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-accent-teal rounded-full mt-2 flex-shrink-0"></span>
                <span>To improve our Platform based on usage patterns</span>
              </li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-accent-teal" />
              <h2 className="text-xl font-semibold text-text-primary m-0">Data Security</h2>
            </div>
            <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "SSL/TLS encryption in transit",
                  "Passwords hashed with bcrypt",
                  "Row-level security on database",
                  "Secure cloud infrastructure (Supabase)",
                  "Regular security updates",
                  "Access controls and authentication"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="w-4 h-4 bg-accent-teal/20 rounded flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-accent-teal rounded-full"></span>
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Data Sharing</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              We do not sell your personal information. We may share data only in these circumstances:
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-accent-fuchsia rounded-full mt-2 flex-shrink-0"></span>
                <span><strong className="text-text-primary">Service Providers:</strong> Third-party services that help us operate (e.g., Supabase for database, Vercel for hosting, Google for AI analysis)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-accent-fuchsia rounded-full mt-2 flex-shrink-0"></span>
                <span><strong className="text-text-primary">Legal Requirements:</strong> When required by law or to protect our rights</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-accent-fuchsia rounded-full mt-2 flex-shrink-0"></span>
                <span><strong className="text-text-primary">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</span>
              </li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-accent-teal" />
              <h2 className="text-xl font-semibold text-text-primary m-0">Your Rights</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              You have the right to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Access your personal data",
                "Correct inaccurate data",
                "Request deletion of your data",
                "Export your data",
                "Withdraw consent",
                "Lodge a complaint"
              ].map((right, i) => (
                <div key={i} className="bg-titan-surface border border-titan-border rounded px-4 py-3 text-sm text-text-secondary">
                  {right}
                </div>
              ))}
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Cookies & Analytics</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              We use essential cookies for authentication and session management. We also use Vercel Analytics to understand Platform usage. These tools collect anonymous usage data and do not track you across other websites.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-accent-teal" />
              <h2 className="text-xl font-semibold text-text-primary m-0">Contact Us</h2>
            </div>
            <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                If you have questions about this Privacy Policy or your data, contact us at:
              </p>
              <a 
                href="mailto:privacy@titans-creator-hub.com" 
                className="text-accent-teal hover:text-accent-teal/80 text-sm transition-colors"
              >
                Tiktoktitansmanagement@gmail.com
              </a>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Changes to This Policy</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Privacy;
