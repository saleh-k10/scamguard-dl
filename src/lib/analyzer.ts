export type Channel = "email" | "sms" | "other";
export type Level = "low" | "medium" | "high";

export interface Sign {
  id: string;
  title: string;
  why: string;
  weight: number;
  technique: string;
  techniqueText: string;
}

export interface Result {
  id: string;
  channel: Channel;
  message: string;
  score: number;
  level: Level;
  signs: Sign[];
  actions: string[];
  quiz: {
    question: string; options: string[]; answer: number; explain: string;
    meta?: { source: "ai" | "rules"; education: string; fallback?: string };
  };
  createdAt: string;
}

const RULES: (Omit<Sign, "id"> & { id: string; test: RegExp })[] = [
  { id: "urgency", test: /\b(urgent|immediately|within \d+ ?(hours?|minutes?)|act now|expires?|last chance|today only|final notice)\b/i, title: "Artificial urgency", why: "Deadlines push you to act before you have time to think or verify.", weight: 22, technique: "Pressure & urgency", techniqueText: "Scammers invent time limits so fear overrides careful judgement. Real organisations rarely demand action within hours." },
  { id: "link", test: /(bit\.ly|tinyurl|t\.co|goo\.gl|is\.gd|https?:\/\/\S+)/i, title: "Link you didn't ask for", why: "Links — especially shortened ones — can hide a fake login page or malware.", weight: 22, technique: "Disguised links", techniqueText: "Shortened or look-alike links hide the real destination. Always type a company's address yourself instead of clicking." },
  { id: "credentials", test: /\b(password|verify your (account|identity)|login|log in|confirm your details|bank details|card number|pin|ssn|social security)\b/i, title: "Request for personal details", why: "Legitimate services never ask you to confirm passwords or bank details by message.", weight: 24, technique: "Credential harvesting", techniqueText: "The goal is to get you to type sensitive details into a page the scammer controls." },
  { id: "money", test: /\b(gift ?card|wire|transfer|bitcoin|crypto|payment (failed|required)|fee|refund|invoice overdue|pay now)\b/i, title: "Money or payment request", why: "Unexpected requests for payment, fees or gift cards are a hallmark of fraud.", weight: 20, technique: "Payment pressure", techniqueText: "Scams usually end in money moving — via fees, gift cards, crypto or ‘refunds’ that need your card." },
  { id: "prize", test: /\b(won|winner|prize|congratulations|free|reward|selected|lottery)\b/i, title: "Too good to be true", why: "Unexpected prizes are bait to make you lower your guard.", weight: 16, technique: "Reward bait", techniqueText: "Promises of prizes trigger excitement, making people overlook obvious red flags." },
  { id: "threat", test: /\b(suspended|frozen|locked|closed|legal action|arrest|police|penalty|unauthori[sz]ed)\b/i, title: "Threat or account warning", why: "Threats of suspension or legal action create fear to rush you.", weight: 18, technique: "Fear & authority", techniqueText: "Impersonating banks, police or tax offices adds false authority to a threat." },
  { id: "code", test: /\b(code|otp|one[- ]time)\b/i, title: "Asks for a code", why: "Sharing a one-time code can hand someone full access to your account.", weight: 18, technique: "Account takeover", techniqueText: "Verification codes are the last lock on your account — nobody legitimate will ask you to read one back." },
  { id: "generic", test: /\b(dear (customer|user|client|sir|madam)|valued customer)\b/i, title: "Generic greeting", why: "Real companies usually address you by name.", weight: 8, technique: "Mass targeting", techniqueText: "Generic greetings reveal a message sent to thousands of people at once." },
];

export function levelOf(score: number): Level {
  return score >= 65 ? "high" : score >= 35 ? "medium" : "low";
}

export function analyze(message: string, channel: Channel): Result {
  const signs: Sign[] = RULES.filter((r) => r.test.test(message)).map(({ test: _t, ...s }) => s);
  let score = signs.reduce((a, s) => a + s.weight, 4);
  if (signs.length >= 3) score += 8;
  score = Math.min(98, score);
  const level = levelOf(score);

  const actions =
    level === "high"
      ? ["Do not click any links or reply to the message.", "Never share passwords, codes or bank details.", "Contact the organisation using a number or website you find yourself.", "Report the message, then delete it and block the sender."]
      : level === "medium"
        ? ["Pause before acting — don't click links yet.", "Verify the sender through an official channel.", "If in doubt, ask someone you trust before responding."]
        : ["No strong warning signs found, but stay alert.", "Still avoid sharing sensitive details by message.", "Verify anything unexpected through official channels."];

  const top = [...signs].sort((a, b) => b.weight - a.weight)[0];
  const quiz = top
    ? {
        question: "Which detail in this message is the strongest scam tell?",
        options: shuffle([top.title, "The message length", "The time it was sent"], top.title),
        answer: 0,
        explain: top.why,
      }
    : {
        question: "A message asks you to ‘verify your account’ via a link. What should you do?",
        options: ["Open the official site yourself", "Click the link quickly", "Reply with your details"],
        answer: 0,
        explain: "Always reach services through an address you type yourself, never through a link in a message.",
      };
  // place correct answer at its shuffled index
  quiz.answer = quiz.options.indexOf(top ? top.title : (quiz.options[0] ?? ""));

  return {
    id: Math.random().toString(36).slice(2, 10),
    channel,
    message,
    score,
    level,
    signs,
    actions,
    quiz,
    createdAt: new Date().toISOString(),
  };
}

function shuffle(arr: string[], seed: string) {
  const i = seed.length % arr.length;
  const copy = arr.slice(1);
  const first = arr[0];
  if (first !== undefined) copy.splice(i, 0, first);
  return copy;
}


export const LEVEL_LABEL: Record<Level, string> = { low: "Low risk", medium: "Medium risk", high: "High risk" };
export const LEVEL_TEXT: Record<Level, string> = { low: "text-low", medium: "text-medium", high: "text-high" };
export const LEVEL_BG: Record<Level, string> = { low: "bg-low", medium: "bg-medium", high: "bg-high" };
export const LEVEL_SOFT: Record<Level, string> = { low: "bg-low/10 text-low border-low/30", medium: "bg-medium/10 text-medium border-medium/30", high: "bg-high/10 text-high border-high/30" };

export const SAMPLES: Result[] = [
  analyze("URGENT: Netflix payment failed. Update your card number within 24 hours or your account will be suspended: bit.ly/nf-fix", "email"),
  analyze("Your parcel is held at customs. A small fee is required: https://dhl-track.co", "sms"),
  analyze("Hi Sam, attached is invoice #4471 for last month's design work. Thanks, Brightline Co.", "email"),
].map((r, i) => ({ ...r, id: `sample-${i}`, createdAt: new Date(Date.now() - (i + 1) * 3600_000 * (i * 6 + 2)).toISOString() }));
