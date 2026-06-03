"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { applyThemePreference, getStoredThemePreference, setStoredThemePreference, ThemePreference } from "@/lib/theme-client";

type BusinessSettings = {
  accountData?: Record<string, unknown> | null;
  teamData?: Record<string, unknown> | null;
  notificationData?: Record<string, unknown> | null;
  billingData?: Record<string, unknown> | null;
  securityData?: Record<string, unknown> | null;
  integrationData?: Record<string, unknown> | null;
  preferenceData?: Record<string, unknown> | null;
};

type LinkStatus = {
  otpVerified: boolean;
  linked: boolean;
  instagramUsername: string | null;
  connectedAt: string | null;
};

const SECTIONS = [
  "Account",
  "Team & Permissions",
  "Notifications",
  "Billing & Invoices",
  "Security",
  "Integrations",
  "Preferences"
] as const;

type SectionName = (typeof SECTIONS)[number];

export default function BusinessSettingsClient() {
  const searchParams = useSearchParams();
  const settingsError = searchParams.get("error");
  const [activeSection, setActiveSection] = useState<SectionName>("Account");
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [accountName, setAccountName] = useState("");
  const [accountPhone, setAccountPhone] = useState("");
  const [teamInviteEmail, setTeamInviteEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [billingAddress, setBillingAddress] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [defaultTheme, setDefaultTheme] = useState<ThemePreference>("system");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [currency, setCurrency] = useState("INR");

  async function loadSettings() {
    const res = await fetch("/api/business/settings", { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to load settings.");
      return;
    }
    const data = json.data as BusinessSettings;
    setSettings(data);
    const account = (data.accountData ?? {}) as Record<string, unknown>;
    const notificationData = (data.notificationData ?? {}) as Record<string, unknown>;
    const billingData = (data.billingData ?? {}) as Record<string, unknown>;
    const securityData = (data.securityData ?? {}) as Record<string, unknown>;
    const preferenceData = (data.preferenceData ?? {}) as Record<string, unknown>;
    setAccountName(String(account.accountName ?? ""));
    setAccountPhone(String(account.accountPhone ?? ""));
    setEmailNotifications(Boolean(notificationData.emailNotifications ?? true));
    setWeeklyDigest(Boolean(notificationData.weeklyDigest ?? true));
    setBillingAddress(String(billingData.billingAddress ?? ""));
    setInvoiceEmail(String(billingData.invoiceEmail ?? ""));
    setTwoFaEnabled(Boolean(securityData.twoFaEnabled ?? false));
    const prefTheme = preferenceData.defaultTheme;
    setDefaultTheme(prefTheme === "light" || prefTheme === "dark" || prefTheme === "system" ? prefTheme : "system");
    setTimezone(String(preferenceData.timezone ?? "Asia/Kolkata"));
    setCurrency(String(preferenceData.currency ?? "INR"));
  }

  async function loadStatus() {
    const res = await fetch("/api/business/integrations/instagram/link-status", { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to load integration status.");
      return;
    }
    setStatus(json.data as LinkStatus);
  }

  useEffect(() => {
    void loadSettings();
    void loadStatus();
  }, []);

  useEffect(() => {
    const stored = getStoredThemePreference();
    setDefaultTheme(stored);
    applyThemePreference(stored);
  }, []);

  async function sendOtp() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/business/integrations/instagram/send-otp", {
        method: "POST",
        credentials: "include"
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Unable to send OTP.");
        return;
      }
      setMessage("Verification code sent to your business email.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/business/integrations/instagram/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ otp })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Invalid verification code.");
        return;
      }
      setMessage("Email verified. You can now connect Instagram.");
      setOtp("");
      await loadStatus();
    } finally {
      setLoading(false);
    }
  }

  async function saveActiveSection() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      let payload: Record<string, unknown> = {};
      if (activeSection === "Account") {
        payload = {
          accountData: {
            accountName,
            accountPhone
          }
        };
      } else if (activeSection === "Team & Permissions") {
        const teamData = (settings?.teamData ?? { members: [] }) as Record<string, unknown>;
        payload = { teamData };
      } else if (activeSection === "Notifications") {
        payload = {
          notificationData: {
            emailNotifications,
            weeklyDigest
          }
        };
      } else if (activeSection === "Billing & Invoices") {
        payload = {
          billingData: {
            billingAddress,
            invoiceEmail
          }
        };
      } else if (activeSection === "Security") {
        payload = {
          securityData: {
            twoFaEnabled
          }
        };
      } else if (activeSection === "Integrations") {
        payload = {
          integrationData: {
            instagramLinked: status?.linked ?? false,
            instagramUsername: status?.instagramUsername ?? null
          }
        };
      } else if (activeSection === "Preferences") {
        payload = {
          preferenceData: {
            defaultTheme,
            timezone,
            currency
          }
        };
      }

      const res = await fetch("/api/business/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save settings.");
        return;
      }
      setSettings(json.data as BusinessSettings);
      setMessage(`${activeSection} saved.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="stack">
      <div className="card hero">
        <h1 className="title">Settings</h1>
        <p className="subtitle m-0">Manage account, integrations, and workspace preferences.</p>
      </div>

      {settingsError === "otp_verification_required" ? (
        <p className="text-sm text-destructive">
          Verify OTP before connecting Instagram from Integrations.
        </p>
      ) : null}
      {settingsError === "instagram_already_linked" ? (
        <p className="text-sm text-destructive">
          This Instagram account is already linked to another business account.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="card">
          <h2 className="section-title">Categories</h2>
          <div className="mt-3 flex flex-col gap-2">
            {SECTIONS.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={`btn ${activeSection === section ? "primary" : "ghost"} justify-start`}
              >
                {section}
              </button>
            ))}
          </div>
        </aside>

        <div className="card">
          <h2 className="section-title">{activeSection}</h2>
          {activeSection === "Account" ? (
            <div className="form-grid">
              <input
                className="form-full"
                type="text"
                placeholder="Account name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
              <input
                className="form-full"
                type="text"
                placeholder="Phone"
                value={accountPhone}
                onChange={(e) => setAccountPhone(e.target.value)}
              />
            </div>
          ) : null}

          {activeSection === "Team & Permissions" ? (
            <div className="form-grid">
              <input
                className="form-full"
                type="email"
                placeholder="Invite team member email"
                value={teamInviteEmail}
                onChange={(e) => setTeamInviteEmail(e.target.value)}
              />
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  if (!teamInviteEmail.trim()) return;
                  const current = (settings?.teamData ?? { members: [] }) as Record<string, unknown>;
                  const members = Array.isArray(current.members) ? current.members : [];
                  const next = { ...current, members: [...members, { email: teamInviteEmail.trim(), role: "MEMBER" }] };
                  setSettings((prev) => ({ ...(prev ?? {}), teamData: next }));
                  setTeamInviteEmail("");
                  setMessage("Team member added to pending list. Save to persist.");
                }}
              >
                Add invite
              </button>
              <div className="form-full rounded-lg border border-border p-3 text-sm">
                <p className="m-0 font-medium">Pending team members</p>
                <ul className="m-0 mt-2 pl-4">
                  {Array.isArray((settings?.teamData as Record<string, unknown> | undefined)?.members) &&
                  ((settings?.teamData as Record<string, unknown>).members as Array<{ email?: string; role?: string }>).length >
                    0 ? (
                    ((settings?.teamData as Record<string, unknown>).members as Array<{ email?: string; role?: string }>).map(
                      (m, idx) => <li key={`${m.email ?? "member"}-${idx}`}>{m.email ?? "Unknown"} ({m.role ?? "MEMBER"})</li>
                    )
                  ) : (
                    <li>No members yet.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : null}

          {activeSection === "Notifications" ? (
            <div className="stack">
              <label className="row items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                Email notifications
              </label>
              <label className="row items-center gap-2 text-sm">
                <input type="checkbox" checked={weeklyDigest} onChange={(e) => setWeeklyDigest(e.target.checked)} />
                Weekly digest
              </label>
            </div>
          ) : null}

          {activeSection === "Billing & Invoices" ? (
            <div className="form-grid">
              <textarea
                className="form-full"
                placeholder="Billing address"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
              />
              <input
                className="form-full"
                type="email"
                placeholder="Invoice email"
                value={invoiceEmail}
                onChange={(e) => setInvoiceEmail(e.target.value)}
              />
            </div>
          ) : null}

          {activeSection === "Security" ? (
            <div className="stack">
              <label className="row items-center gap-2 text-sm">
                <input type="checkbox" checked={twoFaEnabled} onChange={(e) => setTwoFaEnabled(e.target.checked)} />
                Enable 2FA (flag)
              </label>
            </div>
          ) : null}

          {activeSection === "Integrations" ? (
            <div className="stack">
              <p className="muted">Instagram linking is manual and requires email OTP verification first.</p>
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                <p className="m-0">
                  Status:{" "}
                  <strong>{status?.linked ? `Linked to @${status.instagramUsername ?? "instagram"}` : "Not linked"}</strong>
                </p>
                {status?.connectedAt ? (
                  <p className="m-0 mt-1 text-xs text-muted-foreground">
                    Linked on {new Date(status.connectedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>

              <div className="row">
                <button type="button" className="btn secondary" onClick={sendOtp} disabled={loading}>
                  {loading ? "Sending..." : "Send OTP to business email"}
                </button>
              </div>

              <div className="form-grid">
                <input
                  className="form-full"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <div className="form-full row">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={verifyOtp}
                    disabled={loading || otp.length !== 6}
                  >
                    Verify OTP
                  </button>
                  <a
                    className={`btn primary ${status?.otpVerified ? "" : "pointer-events-none opacity-60"}`}
                    href="/api/auth/instagram/start?mode=connect&role=business"
                    aria-disabled={!status?.otpVerified}
                  >
                    Connect Instagram
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {activeSection === "Preferences" ? (
            <div className="form-grid">
              <select
                className="form-full"
                value={defaultTheme}
                onChange={(e) => setDefaultTheme((e.target.value as ThemePreference) ?? "system")}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <input
                className="form-full"
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Timezone"
              />
              <input
                className="form-full"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="Currency"
              />
            </div>
          ) : null}

          <div className="mt-4 row">
            <button type="button" className="btn primary" onClick={saveActiveSection} disabled={saving}>
              {saving ? "Saving..." : `Save ${activeSection}`}
            </button>
            {activeSection === "Preferences" ? (
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setStoredThemePreference(defaultTheme);
                  applyThemePreference(defaultTheme);
                  setMessage("Theme applied.");
                }}
              >
                Apply Theme
              </button>
            ) : null}
          </div>

          {message ? <p className="help">{message}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
