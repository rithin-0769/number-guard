import type { CatalogService } from "../types";

/**
 * Curated Indian-ecosystem catalog. Risk levels are expert-curated:
 * Critical = money / national ID, a takeover is financially or legally catastrophic.
 * High     = account recovery or KYC is bound to this number.
 * Medium   = OTP login available, moderate exposure.
 * Low      = convenience account, low blast radius.
 */
export const CATALOG: CatalogService[] = [
  {
    name: "Aadhaar (UIDAI)",
    category: "Identity",
    risk: "critical",
    url: "https://myaadhaar.uidai.gov.in/",
    steps: [
      "Log in at myAadhaar and open Mobile & Email Address",
      "Select 'Update linked mobile number' and verify via OTP / e-PoS centre",
      "Confirm the change by opening the fresh OTP",
      "Re-download Aadhaar PDF to verify the new number",
    ],
  },
  {
    name: "PAN (NSDL / Protean)",
    category: "Identity",
    risk: "critical",
    url: "https://onlineservices.nsdl.co.in/TCWebClient/ISDL/Menu/Menu.jsp",
    steps: [
      "Log in to the NSDL e-Protean portal",
      "Go to Profile Update → Change Mobile Number",
      "Verify with OTP sent to the new number",
      "Download the updated PAN acknowledgment",
    ],
  },
  {
    name: "Voter ID (Voter Portal)",
    category: "Government",
    risk: "high",
    url: "https://voterportal.gov.in/",
    steps: [
      "Log in to the Voter Portal",
      "File Form 8A (correction of mobile number) with EPIC number",
      "Track the correction request to completion",
    ],
  },
  {
    name: "EPF (EPFO)",
    category: "Government",
    risk: "high",
    url: "https://unifiedportal.epfindia.gov.in/",
    steps: [
      "Log in to the EPFO unified portal",
      "KYC → Update mobile number linked to UAN",
      "Verify with OTP and check the confirmation SMS",
    ],
  },
  {
    name: "DigiLocker",
    category: "Government",
    risk: "medium",
    url: "https://www.digilocker.gov.in/",
    steps: [
      "Log in and open Account → Profile",
      "Update mobile number with OTP verification",
    ],
  },
  {
    name: "Passport Seva",
    category: "Government",
    risk: "high",
    url: "https://www.passportindia.gov.in/",
    steps: [
      "Log in to the Passport Seva portal",
      "Update contact number under applicant details",
      "Confirm with OTP on the new number",
    ],
  },
  {
    name: "SBI",
    category: "Banking",
    risk: "critical",
    url: "https://www.onlinesbi.sbi/",
    steps: [
      "Log in to SBI netbanking / YONO SBI",
      "Profile → Change registered mobile number",
      "Approve via OTP + card / netbanking auth",
      "Verify YONO login works with the new number",
    ],
  },
  {
    name: "HDFC Bank",
    category: "Banking",
    risk: "critical",
    url: "https://netbanking.hdfcbank.com/",
    steps: [
      "Log in to HDFC netbanking",
      "Manage Profile → Change Mobile Number (may require branch visit for the registered mobile)",
      "Confirm eSewa + SMS now reach the new number",
    ],
  },
  {
    name: "ICICI Bank",
    category: "Banking",
    risk: "critical",
    url: "https://www.icicibank.com/",
    steps: [
      "Log in to ICICI internet banking / ICICI app",
      "Profile → Change registered mobile",
      "Verify via OTP and re-set m-internet password",
    ],
  },
  {
    name: "Axis Bank",
    category: "Banking",
    risk: "high",
    url: "https://internetbanking.axisbank.com/",
    steps: [
      "Log in to Axis netbanking",
      "Profile → Update mobile number",
      "Confirm e-statements route to the new number",
    ],
  },
  {
    name: "CDSL (Demat)",
    category: "Banking",
    risk: "high",
    url: "https://eservices.cdsindia.com/CDSLISeSesWeb/Main.aspx",
    steps: [
      "Log in to CDSL e-Services with beneficiary ID",
      "Update registered mobile (Form IS-280) via the depository participant",
      "Confirm trade alerts reach the new number",
    ],
  },
  {
    name: "Google Account",
    category: "Social",
    risk: "critical",
    url: "https://myaccount.google.com/phone",
    steps: [
      "Open myaccount.google.com → Personal info → Phone",
      "Add the new number and verify it",
      "Remove the old number",
      "Re-verify 2FA passes on the new number",
    ],
  },
  {
    name: "WhatsApp",
    category: "Social",
    risk: "critical",
    url: "https://www.whatsapp.com/download",
    steps: [
      "Install WhatsApp on the new number and verify with its OTP",
      "On the old phone: Settings → Account → Log out",
      "Remove the old device under Linked devices if still shown",
      "Confirm chats / 2FA backup migrated to the new number",
    ],
  },
  {
    name: "Instagram",
    category: "Social",
    risk: "high",
    url: "https://www.instagram.com/accounts/edit/",
    steps: [
      "Open Settings → Accounts Center → Personal details → Phones",
      "Remove the old number, add the new one",
      "Verify login still works (2FA / email fallback)",
    ],
  },
  {
    name: "X (Twitter)",
    category: "Social",
    risk: "medium",
    url: "https://x.com/settings/account",
    steps: [
      "Settings → Your account → Mobile number",
      "Update and verify with OTP on the new number",
    ],
  },
  {
    name: "Facebook / Meta",
    category: "Social",
    risk: "high",
    url: "https://www.facebook.com/settings?tab=security",
    steps: [
      "Accounts Center → Personal details → Phones",
      "Replace the old number and verify",
      "Check login alerts point to the new number",
    ],
  },
  {
    name: "GPay",
    category: "UPI",
    risk: "critical",
    isUpi: true,
    url: "https://accounts.google.com/signin",
    steps: [
      "Open BHIM or your bank app: inventory every VPA linked to the old number",
      "Migrate each VPA to the new number (UPI app → Settings → Change mobile)",
      "Or retire the old VPA and register a fresh one on the new number",
      "Update salary credits, merchant autopays and insurance that use the old VPA",
      "Settle balances and pending requests before the SIM goes dead",
    ],
  },
  {
    name: "PhonePe",
    category: "UPI",
    risk: "critical",
    isUpi: true,
    url: "https://www.phonepe.com/",
    steps: [
      "PhonePe → Settings → Linked bank accounts & UPI ID",
      "Change registered mobile to the new number (OTP)",
      "Move or retire your @phonepe VPA",
      "Cancel autopay / mandates tied to the old number where possible",
    ],
  },
  {
    name: "Paytm",
    category: "UPI",
    risk: "critical",
    isUpi: true,
    url: "https://paytm.com/settings/profile",
    steps: [
      "Paytm → Settings → Profile → Change mobile number",
      "Verify with OTP on the new number",
      "Update the @paytm UPI ID mapping",
      "Settle wallet balance and pending collect requests",
    ],
  },
  {
    name: "BHIM (NPCI)",
    category: "UPI",
    risk: "high",
    isUpi: true,
    url: "https://bhim.npci.org.in/",
    steps: [
      "Open BHIM → My VPA: note every UPI ID on the old number",
      "Migrate each VPA to the new number via the linked bank",
      "Verify merchant QR scans work on the new number",
    ],
  },
  {
    name: "Amazon India",
    category: "Shopping",
    risk: "medium",
    url: "https://www.amazon.in/gp/css/homepage.html",
    steps: [
      "Account → Login & security → Edit mobile number",
      "Verify with OTP on the new number",
    ],
  },
  {
    name: "Flipkart",
    category: "Shopping",
    risk: "medium",
    url: "https://www.flipkart.com/account/settings",
    steps: [
      "Account Settings → Logins → Edit mobile number",
      "Verify with OTP on the new number",
    ],
  },
  {
    name: "Myntra",
    category: "Shopping",
    risk: "low",
    url: "https://www.myntra.com/account/settings",
    steps: ["Account → Profile settings → change phone number with OTP"],
  },
  {
    name: "IRCTC",
    category: "Travel",
    risk: "high",
    url: "https://www.irctc.co.in/nget/train-search",
    steps: [
      "Log in to IRCTC → Profile → Update mobile number",
      "Verify with OTP",
      "Confirm ticket alerts now reach the new number",
    ],
  },
  {
    name: "MakeMyTrip",
    category: "Travel",
    risk: "medium",
    url: "https://www.makemytrip.com/account",
    steps: [
      "Account → Profile → change registered mobile",
      "Verify with OTP on the new number",
    ],
  },
  {
    name: "Ola",
    category: "Travel",
    risk: "medium",
    url: "https://ola.com/",
    steps: [
      "Ola app → Profile → change mobile number",
      "Verify with OTP",
    ],
  },
  {
    name: "Uber",
    category: "Travel",
    risk: "low",
    url: "https://www.uber.com/",
    steps: ["Uber app → Profile → phone → replace with the new number"],
  },
  {
    name: "Zomato",
    category: "Lifestyle",
    risk: "low",
    url: "https://www.zomato.com/users/edit",
    steps: ["Profile → Edit mobile number → verify OTP"],
  },
  {
    name: "Swiggy",
    category: "Lifestyle",
    risk: "low",
    url: "https://www.swiggy.com/my-account",
    steps: ["My Account → Edit profile → change mobile number"],
  },
  {
    name: "Netflix",
    category: "Lifestyle",
    risk: "low",
    url: "https://www.netflix.com/account",
    steps: [
      "Account → contact info → update phone (used for payment alerts / 2FA)",
    ],
  },
];

/** Global VPA migration protocol shown in the UPI Safety tab. */
export const VPA_PROTOCOL: { id: string; title: string; detail: string }[] = [
  {
    id: "vpa-1",
    title: "Inventory every VPA on the old number",
    detail:
      "Open BHIM (or your bank's UPI app) → 'My VPA' and list every UPI ID bound to the old number. Banks let you hold up to 10 UPI IDs per account.",
  },
  {
    id: "vpa-2",
    title: "Migrate each VPA to the new number",
    detail:
      "In each UPI app: Settings → Linked mobile → change to the new number (OTP). Where migration is blocked, retire the old VPA and register a fresh one.",
  },
  {
    id: "vpa-3",
    title: "Update every payer of the old VPA",
    detail:
      "Salary credits, landlord / rent, merchant QR on a stand, insurance premium debits, mutual fund SIPs via VPA — every one of them must point at the new ID.",
  },
  {
    id: "vpa-4",
    title: "Settle balances and pending transactions",
    detail:
      "Clear collect requests, return unwanted money to sender, cancel active mandates, and move wallet balances out of Paytm / PhonePe wallets.",
  },
  {
    id: "vpa-5",
    title: "Only then let the number go dead",
    detail:
      "Once every step above is done, the SIM can be dropped. Until day 90 of inactivity the line — and its last-linked UPI IDs — can be ported or recycled.",
  },
];
