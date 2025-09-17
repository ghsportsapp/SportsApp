import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div className="h-6 border-l border-gray-300 dark:border-gray-600"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                Privacy Policy – SportsApp
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Last Updated: July 15, 2025
              </p>
            </div>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <p className="text-lg leading-relaxed">
                Welcome to SportsApp! We at SportsApp want you to understand what information we collect, and how we use and share it. That's why we encourage you to read our Privacy Policy. This helps you use SportsApp in the way that's right for you. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our website, mobile application, or services.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Highlights</h3>
                <p className="text-blue-800 dark:text-blue-200">
                  In this Privacy Policy, we explain how we collect, use, share, retain and transfer information. We also let you know your rights. Each section includes helpful examples to make our practices easier to understand. It's important to us that you know how to control your privacy, so we also show you where you can manage your information in SportsApp settings.
                </p>
              </div>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. What Information Do We Collect?
                </h2>
                <p className="mb-4">
                  The information we collect and process about you depends on how you use SportsApp. For example, we collect different information if you upload cricket coaching videos than if you post photos on the sports feed. When you use SportsApp, we collect some information about you even if you don't have an account.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Your Activity and Information You Provide</h3>
                <p className="mb-3">We collect content, communications and other information you provide when you use SportsApp, including when you sign up for an account, create or share content, and message or communicate with others. This can include information in or about the content you provide, such as metadata.</p>
                
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Content you create and share</h4>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Posts, photos, videos, stories, comments, and other content you share</li>
                  <li>Drill videos and sports coaching content you upload</li>
                  <li>Cricket coaching analysis videos and AI feedback data</li>
                  <li>Tryout application videos and information</li>
                  <li>Messages you send and receive, including their content</li>
                  <li>Metadata about content and messages</li>
                </ul>

                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Registration and account information</h4>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Full name and username</li>
                  <li>Email address and phone number</li>
                  <li>User type (Sports Fan or Athlete)</li>
                  <li>Profile picture and bio information</li>
                  <li>Payment information for redemptions (email addresses)</li>
                  <li>Verification status and related documentation</li>
                </ul>

                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Sports and activity information</h4>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Sports preferences and interests</li>
                  <li>Drill performance and completion data</li>
                  <li>Points earned and redemption history</li>
                  <li>Cricket coaching analysis results</li>
                  <li>Tryout applications and status</li>
                  <li>Sports news reading preferences</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Friends, Followers and Other Connections</h3>
                <p className="mb-3">We collect information about the people, accounts, hashtags, sports teams, and groups you are connected to and how you interact with them across SportsApp, such as people you communicate with the most or groups you are part of.</p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">App, Browser and Device Information</h3>
                <p className="mb-3">We collect and receive information from and about the different devices you use and how you use them.</p>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Device characteristics and device software</li>
                  <li>What you're doing on your device (like whether SportsApp is in the foreground)</li>
                  <li>Browser information and device identifiers</li>
                  <li>Device signals like GPS location, camera or gyroscope</li>
                  <li>Network and connections information</li>
                  <li>Performance reports and error logs</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Information from Partners, Vendors and Other Third Parties</h3>
                <p className="mb-3">We receive information about you and your activities on and off SportsApp from third-party partners, such as information from a partner when we jointly offer services or from an advertiser about your experiences or interactions with them.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. How Do We Use Your Information?
                </h2>
                <p className="mb-4">
                  We use information we collect to provide a personalized experience to you, including ads, along with the other purposes we explain in detail below. For some of these purposes, we use information across SportsApp features and across your devices. The information we use for these purposes is automatically processed by our systems.
                </p>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">To Provide, Personalize and Improve SportsApp</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Provide and improve the SportsApp experience, including the sports feed, drill system, cricket coaching, and tryout features</li>
                  <li>Personalize your sports feed content, news, and recommendations</li>
                  <li>Process AI-powered cricket coaching analysis using pose detection technology</li>
                  <li>Manage the points and rewards system, including redemption processing</li>
                  <li>Facilitate real-time messaging and notifications</li>
                  <li>Show you relevant sports news based on your interests</li>
                  <li>Connect you with relevant sports opportunities and tryouts</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">To Promote Safety, Security and Integrity</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Verify accounts and activity, combat harmful conduct, and maintain the integrity of SportsApp</li>
                  <li>Review and approve drill submissions, tryout applications, and redemption requests</li>
                  <li>Detect and prevent spam, fraud, and other harmful activities</li>
                  <li>Investigate suspicious or fraudulent activity and policy violations</li>
                  <li>Protect the safety and security of SportsApp users</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">To Provide Measurement, Analytics and Business Services</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Measure and analyze how people use SportsApp features</li>
                  <li>Provide insights about sports content performance</li>
                  <li>Help sports organizations and advertisers measure their content effectiveness</li>
                  <li>Generate reports about drill completion rates and coaching effectiveness</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">To Communicate with You</h3>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Send you notifications about your account activity, points, and rewards</li>
                  <li>Notify you about verification status updates</li>
                  <li>Send updates about tryout applications and drill review status</li>
                  <li>Provide customer support and respond to your inquiries</li>
                  <li>Send important announcements about SportsApp features and policies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. How Is Your Information Shared?
                </h2>
                
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">On SportsApp</h3>
                <p className="mb-3">Learn more about the different cases when your information can be shared on SportsApp:</p>
                
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">People and accounts you share and communicate with</h4>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>When you share content or send messages, we share that information with the specific people or accounts you choose</li>
                  <li>Your posts, comments, and interactions are visible to other users based on your sharing settings</li>
                  <li>Your profile information is visible to other SportsApp users</li>
                </ul>

                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Public content</h4>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Content you choose to make public (like public posts) can be seen by anyone on or off SportsApp</li>
                  <li>Your username, profile picture, and public profile information</li>
                  <li>Verification status and public achievements</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">With Third Parties</h3>
                <p className="mb-3">We don't sell any of your information to anyone, and we never will. We also require partners and other third parties to follow rules about how they can and cannot use and disclose the information we provide.</p>
                
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Service Providers</h4>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Companies that help us provide SportsApp services (hosting, analytics, customer support)</li>
                  <li>AI service providers for cricket coaching analysis</li>
                  <li>Payment processors for redemption services</li>
                  <li>News API providers for sports news content</li>
                </ul>

                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Legal Requirements</h4>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>When required by law, legal process, or government request</li>
                  <li>To protect the safety, rights, or property of SportsApp or others</li>
                  <li>To prevent fraud, abuse, or other harmful activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. How Long Do We Keep Your Information?
                </h2>
                <p className="mb-3">
                  We keep your information for as long as your account is active and as necessary to provide SportsApp services. We also keep information when required by law, for safety and security purposes, or to protect our or others' interests.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Account information: Until you delete your account</li>
                  <li>Posts and content: Until you delete them or your account</li>
                  <li>Messages: Until you or the recipient deletes them</li>
                  <li>Cricket coaching analysis: 90 days unless saved to your profile</li>
                  <li>Drill videos: Until deleted by you or admin rejection</li>
                  <li>Points and redemption history: 2 years for audit purposes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. How Do We Transfer Information?
                </h2>
                <p>
                  SportsApp is a global service. We may transfer, store and process your information outside of your country of residence to wherever we or our service providers operate for the purposes described in this policy. These data transfers allow us to provide SportsApp services and operate globally.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Your Rights and Controls
                </h2>
                <p className="mb-3">You have rights and choices about your information. Many of these rights you can exercise by using the tools we provide.</p>
                
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Access and Control Your Information</h3>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>View and edit your profile information at any time</li>
                  <li>Download your information from your account settings</li>
                  <li>Delete your posts, comments, and other content</li>
                  <li>Control who can see your content and contact you</li>
                  <li>Manage your notification preferences</li>
                  <li>Delete your account and all associated data</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Additional Rights</h3>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Object to certain processing of your information</li>
                  <li>Request restriction of processing in certain circumstances</li>
                  <li>Data portability rights where applicable</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. Cookies and Similar Technologies
                </h2>
                <p className="mb-3">
                  We use cookies, web beacons, and similar technologies to provide, protect and improve SportsApp. These technologies help us understand how you use SportsApp, remember your preferences, and personalize your experience.
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Essential cookies for basic functionality</li>
                  <li>Analytics cookies to understand usage patterns</li>
                  <li>Preference cookies to remember your settings</li>
                  <li>Security cookies to protect against fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. Children's Privacy
                </h2>
                <p>
                  SportsApp is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information promptly.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  9. Changes to This Privacy Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. When we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with more prominent notice. We encourage you to review this Privacy Policy periodically to stay informed about our practices.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  10. Security Measures
                </h2>
                <p className="mb-3">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication systems</li>
                  <li>Employee training on data protection</li>
                  <li>Incident response procedures</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  11. International Data Transfers
                </h2>
                <p>
                  SportsApp operates globally and may transfer your information to countries other than where you reside. We ensure appropriate safeguards are in place for such transfers as required by applicable data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  12. Contact Information
                </h2>
                <p>
                  If you have questions about this Privacy Policy or our privacy practices, please review the detailed information in this policy. You can also manage your information and privacy settings directly in your SportsApp account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  13. Effective Date
                </h2>
                <p>
                  This Privacy Policy is effective as of July 15, 2025. Your continued use of SportsApp after any modifications indicates your acceptance of the updated Privacy Policy.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}