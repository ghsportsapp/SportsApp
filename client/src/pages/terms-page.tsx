import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
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
              Terms and Conditions
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
                Terms and Conditions – SportsApp
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Last Updated: July 15, 2025
              </p>
            </div>

            <div className="space-y-6 text-gray-700 dark:text-gray-300">
              <p className="text-lg leading-relaxed">
                Welcome to SportsApp! These Terms of Use (or "Terms") govern your access and use of SportsApp, except where we expressly state that separate terms (and not these) apply, and provide information about the SportsApp Service (the "Service"), outlined below. By using our website, mobile application, or any services provided by SportsApp, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
              </p>

              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
                <p className="text-red-800 dark:text-red-200 font-semibold">
                  ARBITRATION NOTICE: YOU AGREE THAT DISPUTES BETWEEN YOU AND US WILL BE RESOLVED BY BINDING, INDIVIDUAL ARBITRATION AND YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
                </p>
              </div>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. The SportsApp Service
                </h2>
                <p className="mb-3">
                  We agree to provide you with the SportsApp Service. The Service includes all of the SportsApp products, features, applications, services, technologies, and software that we provide to advance SportsApp's mission: To bring you closer to the sports and athletes you love. The Service is made up of the following aspects:
                </p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Offering personalized opportunities to create, connect, communicate, discover and share.</strong> People are different. So we offer you different types of accounts and features to help you create, share, grow your presence, and communicate with people on and off SportsApp. We also want to strengthen your relationships through shared sports experiences that you actually care about.</li>
                  <li><strong>Fostering a positive, inclusive, and safe environment.</strong> We develop and use tools and offer resources to our community members that help to make their experiences positive and inclusive. We also have teams and systems that work to combat abuse and violations of our Terms and policies.</li>
                  <li><strong>Developing and using technologies that help us consistently serve our growing community.</strong> Organizing and analyzing information for our growing community is central to our Service. Technologies like artificial intelligence and machine learning give us the power to apply complex processes across our Service.</li>
                  <li><strong>Ensuring access to our Service.</strong> To operate our global Service, we must store and transfer data across our systems around the world, including outside of your country of residence.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. How Our Service Is Funded
                </h2>
                <p className="mb-3">
                  Instead of paying to use SportsApp, by using the Service covered by these Terms, you acknowledge that we can show you ads that businesses and organizations pay us to promote. We use your personal data, such as information about your activity and interests, to show you ads that are more relevant to you.
                </p>
                <p>
                  We show you relevant and useful ads without telling advertisers who you are. We don't sell your personal data. We allow advertisers to tell us things like their business goal and the kind of audience they want to see their ads.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. The Privacy Policy
                </h2>
                <p>
                  Providing our Service requires collecting and using your information. The{" "}
                  <Button
                    variant="link"
                    type="button"
                    className="text-blue-600 dark:text-blue-400 hover:underline p-0 h-auto font-normal underline"
                    onClick={() => setLocation("/privacy")}
                  >
                    Privacy Policy
                  </Button>{" "}
                  explains how we collect, use, and share information. It also explains the many ways you can control your information, including in the SportsApp Privacy and Security Settings. You must agree to the{" "}
                  <Button
                    variant="link"
                    type="button"
                    className="text-blue-600 dark:text-blue-400 hover:underline p-0 h-auto font-normal underline"
                    onClick={() => setLocation("/privacy")}
                  >
                    Privacy Policy
                  </Button>{" "}
                  to use SportsApp.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. Your Commitments
                </h2>
                <p className="mb-3">In return for our commitment to provide the Service, we require you to make the below commitments to us.</p>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">4.1 Who Can Use SportsApp</h3>
                <p className="mb-3">We want our Service to be as open and inclusive as possible, but we also want it to be safe, secure, and in accordance with the law. So, we need you to commit to a few restrictions in order to be part of the SportsApp community.</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must be at least 13 years old.</li>
                  <li>You must not be prohibited from receiving any aspect of our Service under applicable laws or engaging in payments related Services if you are on an applicable denied party listing.</li>
                  <li>We must not have previously disabled your account for violation of law or any of our policies.</li>
                  <li>You must not be a convicted sex offender.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">4.2 How You Can't Use SportsApp</h3>
                <p className="mb-3">Providing a safe and open Service for a broad community requires that we all do our part.</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>You can't impersonate others or provide inaccurate information.</strong> You don't have to disclose your identity on SportsApp, but you must provide us with accurate and up to date information, which may include providing personal data. Also, you may not impersonate someone or something you aren't, and you can't create an account for someone else unless you have their express permission.</li>
                  <li><strong>You can't do anything unlawful, misleading, or fraudulent or for an illegal or unauthorized purpose.</strong></li>
                  <li><strong>You can't violate (or help or encourage others to violate) these Terms or our policies,</strong> including in particular the Community Standards and Sports Content Guidelines.</li>
                  <li><strong>You can't do anything to interfere with or impair the intended operation of the Service.</strong> This includes misusing any reporting, dispute, or appeals channel, such as by making fraudulent or groundless reports or appeals.</li>
                  <li><strong>You can't attempt to create accounts or access or collect information in unauthorized ways.</strong> This includes creating accounts or accessing or collecting information in an automated way without our express permission.</li>
                  <li><strong>You can't sell, license, or purchase any account or data obtained from us or our Service.</strong> This includes attempts to buy, sell, or transfer any aspect of your account (including your username).</li>
                  <li><strong>You can't post someone else's private or confidential information without permission or do anything that violates someone else's rights,</strong> including intellectual property rights (e.g., copyright infringement, trademark infringement, counterfeit, or pirated goods).</li>
                  <li><strong>You can't modify, translate, create derivative works of, or reverse engineer our products or their components.</strong></li>
                  <li><strong>You can't use a domain name or URL in your username without our prior written consent.</strong></li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 mt-4">4.3 Permissions You Give to Us</h3>
                <p className="mb-3">As part of our agreement, you also give us permissions that we need to provide the Service.</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>We do not claim ownership of your content, but you grant us a license to use it.</strong> Nothing is changing about your rights in your content. We do not claim ownership of your content that you post on or through the Service and you are free to share your content with anyone else, wherever you want. However, we need certain legal permissions from you (known as a "license") to provide the Service. When you share, post, or upload content that is covered by intellectual property rights (like photos or videos) on or in connection with our Service, you hereby grant to us a non-exclusive, royalty-free, transferable, sub-licensable, worldwide license to host, use, distribute, modify, run, copy, publicly perform or display, translate, and create derivative works of your content. This license will end when your content is deleted from our systems.</li>
                  <li><strong>Permission to use your username, profile picture, and information about your relationships and actions with accounts, ads, and sponsored content.</strong> You give us permission to show your username, profile picture, and information about your actions (such as likes) or relationships (such as follows) next to or in connection with accounts, ads, offers, and other sponsored content that you follow or engage with that are displayed on SportsApp, without any compensation to you.</li>
                  <li><strong>You agree that we can download and install updates to the Service on your device.</strong></li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. Verification System
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Profile verification is not automatic and is granted only after a detailed review by the SportsApp admin team.</li>
                  <li>To be verified, users must provide accurate profile details, post consistently with quality content, and follow community guidelines.</li>
                  <li>SportsApp reserves the right to approve or reject verification requests at its sole discretion.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Points & Rewards System
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Users earn points based on post engagement (likes, views, comments, shares) and drill submissions.</li>
                  <li>Points can only be redeemed after review by SportsApp, and only if the user's activity meets quality standards.</li>
                  <li>Fake engagement, spam posting, or repeated low-quality content will lead to rejection of reward requests or even account suspension.</li>
                  <li>SportsApp may update the points system at any time to ensure fairness and content integrity.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. Redemption of Vouchers
                </h2>
                <p className="mb-3">Vouchers or monetary redemptions can only be claimed when:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The user reaches the required points threshold (minimum 5 points).</li>
                  <li>The user's posts and activities are reviewed and approved for eligibility.</li>
                  <li>A valid email address is provided for voucher delivery.</li>
                  <li>SportsApp reserves the right to approve or deny any redemption request without prior notice, especially if suspicious activity is detected.</li>
                  <li>Redemption may take up to 7 working days post approval.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. Drill Upload and Management
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Users can upload sports drill videos for review and potential point rewards.</li>
                  <li>All drill submissions are subject to admin review and approval.</li>
                  <li>Drill content must be original, sports-related, and follow our quality guidelines.</li>
                  <li>Approved drills may earn users points based on quality and educational value.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  9. Cricket Coaching and AI Analysis
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>SportsApp provides AI-powered cricket coaching analysis for batting and bowling techniques.</li>
                  <li>Video analysis results are provided for educational purposes only.</li>
                  <li>SportsApp is not responsible for any injuries or decisions made based on AI analysis feedback.</li>
                  <li>Users should consult professional coaches for comprehensive training guidance.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  10. Tryouts and Sports Opportunities
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>SportsApp may feature tryout opportunities and sports-related events.</li>
                  <li>Participation in tryouts is subject to organizer terms and conditions.</li>
                  <li>SportsApp acts as a platform facilitator and is not responsible for tryout outcomes.</li>
                  <li>Users participate in tryouts at their own risk and responsibility.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  11. Community Guidelines
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Respect fellow users and maintain sportsmanship values.</li>
                  <li>Avoid hate speech, abusive language, or discriminatory content.</li>
                  <li>Share authentic sports content and experiences.</li>
                  <li>Any violation of guidelines may result in content removal, suspension, or permanent ban.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  12. Removal of Content
                </h2>
                <p className="mb-3">
                  We can remove or restrict access to content that is in violation of these provisions. We can also suspend or disable your account for conduct that violates these provisions, as we consider appropriate in our discretion.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  13. Suspension or Termination
                </h2>
                <p className="mb-3">SportsApp may suspend or terminate your account if:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You violate these terms or community guidelines.</li>
                  <li>You engage in fraudulent activity or misuse the points/reward system.</li>
                  <li>You attempt to manipulate verification, engagement, or redemption processes.</li>
                  <li>Your account poses a safety risk to our community.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  14. Our Agreement and What Happens if We Disagree
                </h2>
                <p className="mb-3">
                  If any aspect of this agreement is unenforceable, the rest will remain in effect. Any amendment or waiver to our agreement must be in writing and signed by us. If we fail to enforce any aspect of this agreement, it will not be a waiver.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  15. Limitation of Liability
                </h2>
                <p className="mb-3">SportsApp and its affiliates, directors, officers, stockholders, employees, licensors, and agents will not be liable for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Any technical issues, delays, or service outages.</li>
                  <li>Loss of earnings or opportunities resulting from account bans, verification denial, or redemption rejection.</li>
                  <li>Third-party links or content that may appear on the platform.</li>
                  <li>Any injuries or damages resulting from sports activities or coaching advice.</li>
                  <li>Any indirect, consequential, exemplary, incidental, or punitive damages.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  16. Modification of Services and Terms
                </h2>
                <p>
                  SportsApp reserves the right to update, modify, or discontinue any feature or service at any time without prior notice. We may change these Terms of Use from time to time. If we make changes, we will notify you by revising the date at the top of the terms and, in some cases, we may provide you with more prominent notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  17. Governing Law and Jurisdiction
                </h2>
                <p>
                  These terms shall be governed by and interpreted in accordance with the laws of India. All disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India. Any disputes will be resolved through binding arbitration in accordance with the rules of the Indian Arbitration and Conciliation Act, 2015.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  18. Definitions
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>"SportsApp"</strong> refers to the sports social networking platform and all its features and services.</li>
                  <li><strong>"Content"</strong> refers to any text, images, videos, audio, or other materials posted on SportsApp.</li>
                  <li><strong>"Service"</strong> refers to all features, tools, and functionality provided by SportsApp.</li>
                  <li><strong>"User"</strong> or "you" refers to any person who accesses or uses SportsApp.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  19. Effective Date
                </h2>
                <p>
                  These Terms of Use are effective as of July 15, 2025, and will remain in effect until modified or terminated by SportsApp. Your continued use of SportsApp after any modifications indicates your acceptance of the modified terms.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}