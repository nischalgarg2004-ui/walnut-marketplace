import type { Metadata } from "next";
import PublicMarketingShell from "@/components/PublicMarketingShell";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";
import { BRAND_NAME, SUPPORT_EMAIL, SUPPORT_MAILTO, appUrl } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND_NAME}`,
  description: `${BRAND_NAME} privacy policy for creator and business marketplace workflows.`
};

export default function PrivacyPolicyPage() {
  const updatedOn = "April 21, 2026";
  const deauthorizeUrl = appUrl("/api/meta/deauthorize");
  const dataDeletionUrl = appUrl("/api/meta/data-deletion");

  return (
    <PublicMarketingShell mainClassName="main-content">
      <div className="mx-auto max-w-4xl">
          <PageScaffold
            eyebrow="Legal"
            title="Privacy Policy"
            description={`This policy explains how ${BRAND_NAME} collects, uses, stores, and shares data when creators and businesses use the marketplace and Instagram-connected features.`}
            actions={<p className="help">Last updated: {updatedOn}</p>}
          >
            <PagePanel className="stack">
            <h2 className="section-title">1) Information we collect</h2>
            <p className="section-subtitle">
              We collect account and marketplace information needed to operate {BRAND_NAME}, including email, role, profile
              details, campaign applications, contracts, deliverables, and payout-related records.
            </p>
            <p className="section-subtitle">
              If you connect Instagram, we may collect and process Instagram account identifiers, username, account
              type, follower and media counts, profile image URL, and media performance signals such as views for
              submitted deliverables.
            </p>
            </PagePanel>

            <PagePanel className="stack">
            <h2 className="section-title">2) How we use data</h2>
            <p className="section-subtitle">
              We use data to provide marketplace features, including account creation, creator-brand matching,
              application processing, deliverable verification, payout workflows, fraud/risk monitoring, and product
              analytics.
            </p>
            <p className="section-subtitle">
              Instagram data is used to authenticate connected professional accounts and to fetch creator profile and
              content-performance metrics relevant to active campaigns.
            </p>
            </PagePanel>

            <PagePanel className="stack">
            <h2 className="section-title">3) Instagram and Meta platform data</h2>
            <p className="section-subtitle">
              {BRAND_NAME} uses Instagram APIs made available by Meta for connected professional accounts. Access tokens are
              stored in encrypted form. {BRAND_NAME} fetches creator metrics through Instagram Graph API endpoints available
              to connected professional accounts.
            </p>
            <p className="section-subtitle">
              Use of Instagram platform data remains subject to Meta Platform Terms and Instagram Platform policies.
            </p>
            </PagePanel>

            <PagePanel className="stack">
            <h2 className="section-title">4) Data sharing</h2>
            <p className="section-subtitle">
              We share data only as necessary to operate {BRAND_NAME}, such as with infrastructure providers, payment
              providers, analytics/monitoring tools, and legal/compliance advisors under appropriate safeguards.
            </p>
            <p className="section-subtitle">
              We do not sell personal information. We may disclose information where required by law, regulation, or
              valid legal process.
            </p>
            </PagePanel>

            <PagePanel className="stack">
            <h2 className="section-title">5) Retention and security</h2>
            <p className="section-subtitle">
              We retain data for as long as needed to provide services, satisfy legal and accounting requirements, and
              resolve disputes. We apply technical and organizational controls to protect data, including encryption
              for sensitive credentials and controlled access to production systems.
            </p>
            </PagePanel>

            <PagePanel className="stack">
            <h2 className="section-title">6) Your choices and rights</h2>
            <p className="section-subtitle">
              You can disconnect Instagram from your {BRAND_NAME} account and update profile information from account
              settings. You may also request access, correction, or deletion of personal data, subject to legal and
              operational obligations.
            </p>
            <p className="section-subtitle">
              To make a privacy request, contact {BRAND_NAME} support at
              {" "}
              <a className="link" href={SUPPORT_MAILTO}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
            </PagePanel>

            <PagePanel className="stack">
            <h2 className="section-title">7) Instagram / Meta deauthorization and data deletion</h2>
            <p className="section-subtitle">
              {BRAND_NAME} exposes the two endpoints required by Meta App Review:
            </p>
            <ul className="m-0 list-disc space-y-1 pl-5 text-sm">
              <li>
                <strong>Deauthorize Callback URL:</strong>{" "}
                <code className="break-all">{deauthorizeUrl}</code>
                {" "}— invoked when you remove {BRAND_NAME} from your Instagram apps. We immediately clear the
                encrypted Instagram access token, the Instagram user id, handle, account type, follower /
                post / view counts, profile photo URL, and connection timestamp on your {BRAND_NAME} profile.
              </li>
              <li>
                <strong>Data Deletion Request URL:</strong>{" "}
                <code className="break-all">{dataDeletionUrl}</code>
                {" "}— invoked when you submit a Meta-initiated data-deletion request. We do everything the
                deauthorize step does, plus remove Instagram media-id references stored against your
                contract deliverables, and we issue a confirmation code so you can verify the outcome.
              </li>
            </ul>
            <p className="section-subtitle">
              Track or look up a deletion request at{" "}
              <a className="link" href="/privacy/data-deletion">
                /privacy/data-deletion
              </a>
              . If Meta redirected you here from the Instagram app you will arrive with the confirmation
              code already in the URL. You can also email{" "}
              <a className="link" href={SUPPORT_MAILTO}>
                {SUPPORT_EMAIL}
              </a>{" "}
              to request deletion directly.
            </p>
            <p className="section-subtitle">
              Both endpoints verify Meta&apos;s HMAC-SHA256 signature with our app secret before doing any
              work; unsigned or malformed requests are rejected.
            </p>
            </PagePanel>

            <PagePanel className="stack">
            <h2 className="section-title">8) Policy updates</h2>
            <p className="section-subtitle">
              We may update this Privacy Policy periodically. Material updates will be reflected by revising the
              &quot;Last updated&quot; date on this page.
            </p>
            </PagePanel>
          </PageScaffold>
      </div>
    </PublicMarketingShell>
  );
}
