import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Bukhari Fabrics',
  description: 'How Bukhari Fabrics collects, uses, and protects your information.',
};

export default function PrivacyPolicyPage() {
  return <main className="policy-page">
    <a className="policy-back" href="/">← Back to Bukhari Fabrics</a>
    <span className="overline">BUKHARI FABRICS</span>
    <h1>Privacy Policy</h1>
    <p className="policy-updated">Last updated: November 9, 2026</p>
    <p>Bukhari Fabrics (“we”, “us”, or “our”) respects your privacy. This policy explains what information is collected when you use our website and how it is used.</p>

    <h2>Information we collect</h2>
    <p>When you create an account or place an order, we may collect your name, email address, phone number, delivery address, city, postal code, and order details. If you contact us, we receive the name, email address, subject, and message you submit. If you subscribe to updates, we store your email address.</p>
    <p>If you choose Google sign-in, Supabase Authentication receives the account information Google shares with us, such as your email address and basic profile information.</p>

    <h2>How we use information</h2>
    <p>We use this information to manage your account, respond to enquiries, process and fulfil order requests, provide customer support, and send store updates when you subscribe. We do not sell personal information.</p>

    <h2>Service providers</h2>
    <p>Our website uses Supabase for authentication, database, and image storage services. Contact form messages are delivered using Resend. These providers process information on our behalf to provide their services and under their respective privacy and security practices.</p>

    <h2>Cookies and local storage</h2>
    <p>The site stores your shopping bag and saved fabrics in your browser’s local storage so they remain available when you return. Authentication may use cookies or browser storage to maintain your signed-in session.</p>

    <h2>Retention and security</h2>
    <p>We keep account, order, and enquiry information for as long as needed to provide the service, respond to you, and meet applicable business obligations. We use access controls and reputable hosted providers, but no method of online storage or transmission can be guaranteed to be completely secure.</p>

    <h2>Your choices</h2>
    <p>You can contact us to request access to, correction of, or deletion of your personal information, subject to information we need to retain for completed orders or legal obligations. You can unsubscribe from store updates by contacting us.</p>

    <h2>Children</h2>
    <p>This website is intended for a general audience and is not directed to children under 13. Please contact us if you believe a child has submitted personal information.</p>

    <h2>Changes and contact</h2>
    <p>We may update this policy as our services change. The latest version will be posted on this page. For privacy questions or requests, contact <a href="mailto:bukharifabricstailoring@gmail.com">bukharifabricstailoring@gmail.com</a>.</p>
  </main>;
}
