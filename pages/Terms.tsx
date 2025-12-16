import React from 'react';
import { FileText, AlertTriangle, CheckCircle, XCircle, Scale, Mail } from 'lucide-react';

const Terms = () => {
  const lastUpdated = "December 16, 2024";

  return (
    <div className="min-h-screen bg-titan-bg">
      {/* Header */}
      <div className="bg-titan-bg py-12 border-b border-titan-border">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent-fuchsia/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-fuchsia" />
            </div>
            <span className="text-xs text-text-muted uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Terms of Service</h1>
          <p className="text-text-muted text-sm">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose prose-invert max-w-none">
          
          {/* Introduction */}
          <section className="mb-10">
            <p className="text-text-secondary leading-relaxed">
              Welcome to Titans! These Terms of Service ("Terms") govern your use of the Titans platform at titans-creator-hub.vercel.app (the "Platform"). By accessing or using our Platform, you agree to be bound by these Terms.
            </p>
          </section>

          {/* Acceptance */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">1. Acceptance of Terms</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              By creating an account or using our Platform, you confirm that you are at least 18 years old (or the age of majority in your jurisdiction) and agree to comply with these Terms. If you do not agree, please do not use the Platform.
            </p>
          </section>

          {/* Services */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">2. Our Services</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Titans provides tools and resources for TikTok Shop creators, including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Creator dashboard with performance metrics",
                "AI-powered video audit and feedback",
                "Trend analysis and insights",
                "Product discovery tools",
                "Educational resources",
                "Agency partnership benefits"
              ].map((service, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary bg-titan-surface border border-titan-border rounded px-3 py-2">
                  <CheckCircle className="w-4 h-4 text-accent-teal flex-shrink-0" />
                  {service}
                </div>
              ))}
            </div>
          </section>

          {/* Account */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">3. Your Account</h2>
            <div className="space-y-4 text-sm text-text-secondary">
              <p className="leading-relaxed">
                <strong className="text-text-primary">Registration:</strong> You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials.
              </p>
              <p className="leading-relaxed">
                <strong className="text-text-primary">TikTok Handle:</strong> If you link a TikTok handle to your account, you represent that you are the owner or authorized user of that TikTok account.
              </p>
              <p className="leading-relaxed">
                <strong className="text-text-primary">Account Security:</strong> You are responsible for all activities under your account. Notify us immediately of any unauthorized access.
              </p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-5 h-5 text-accent-teal" />
              <h2 className="text-xl font-semibold text-text-primary m-0">4. Acceptable Use</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              You agree to use the Platform only for lawful purposes and in accordance with these Terms. You agree NOT to:
            </p>
            <div className="bg-titan-surface border border-titan-border rounded-lg p-5 space-y-3">
              {[
                "Violate any applicable laws or regulations",
                "Impersonate another person or entity",
                "Share false or misleading information",
                "Attempt to gain unauthorized access to our systems",
                "Use automated tools to scrape or collect data",
                "Interfere with the Platform's operation",
                "Upload malicious code or content",
                "Harass, abuse, or harm other users"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">5. Intellectual Property</h2>
            <div className="space-y-4 text-sm text-text-secondary">
              <p className="leading-relaxed">
                <strong className="text-text-primary">Our Content:</strong> The Platform, including its design, features, text, graphics, and code, is owned by Titans and protected by intellectual property laws. You may not copy, modify, or distribute our content without permission.
              </p>
              <p className="leading-relaxed">
                <strong className="text-text-primary">Your Content:</strong> You retain ownership of content you submit (e.g., videos for audit). By submitting content, you grant us a limited license to process and analyze it for the purpose of providing our services.
              </p>
            </div>
          </section>

          {/* Video Audit */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">6. Video Audit Service</h2>
            <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                Our AI-powered video audit feature provides suggestions and feedback. Please note:
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-accent-fuchsia rounded-full mt-2 flex-shrink-0"></span>
                  <span>Feedback is AI-generated and should be considered as suggestions, not guarantees</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-accent-fuchsia rounded-full mt-2 flex-shrink-0"></span>
                  <span>We do not guarantee any specific results from implementing suggestions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 bg-accent-fuchsia rounded-full mt-2 flex-shrink-0"></span>
                  <span>Video content submitted for audit may be processed by third-party AI services</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Disclaimers */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-semibold text-text-primary m-0">7. Disclaimers</h2>
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-5">
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
              </p>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Merchantability and fitness for a particular purpose</li>
                <li>• Accuracy or completeness of metrics and data</li>
                <li>• Uninterrupted or error-free service</li>
                <li>• Results from using our tools or suggestions</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-5 h-5 text-accent-teal" />
              <h2 className="text-xl font-semibold text-text-primary m-0">8. Limitation of Liability</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              To the maximum extent permitted by law, Titans shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Platform.
            </p>
          </section>

          {/* Termination */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">9. Termination</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              We may suspend or terminate your account at any time for violation of these Terms or for any other reason at our discretion. You may also delete your account at any time. Upon termination, your right to use the Platform will immediately cease.
            </p>
          </section>

          {/* Changes */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">10. Changes to Terms</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting a notice on the Platform. Your continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">11. Governing Law</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
            </p>
          </section>

          {/* Contact */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-accent-teal" />
              <h2 className="text-xl font-semibold text-text-primary m-0">12. Contact Us</h2>
            </div>
            <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
              <p className="text-sm text-text-secondary leading-relaxed mb-3">
                If you have questions about these Terms, contact us at:
              </p>
              <a 
                href="mailto:legal@titans-creator-hub.com" 
                className="text-accent-teal hover:text-accent-teal/80 text-sm transition-colors"
              >
                Tiktoktitansmanagement@gmail.com
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Terms;
