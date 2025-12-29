"use client";

import { useState, useEffect } from "react";

/* ===============================
   TYPES
================================ */
type UserType = "salary" | "freelancer" | "both" | "crypto";
type IncomeType = "monthly" | "yearly";
type CryptoTaxMethod = "cgt" | "pit"; // Capital Gains Tax or Personal Income Tax

type Expenses = {
  internet: string;
  tools: string;
  rent: string;
  others: string;
};

type TaxResult = {
  relief: number;
  taxableIncome: number;
  tax: number;
  breakdown: string[];
};

/* ===============================
   HELPER FUNCTIONS
================================ */
// Format number with commas
const formatWithCommas = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
};

// Parse formatted number back to raw digits
const parseFormattedNumber = (value: string): number => {
  return Number(value.replace(/,/g, "")) || 0;
};

function calculateTax(annualIncome: number, year: "2025" | "2026" = "2025"): {
  tax: number;
  relief: number;
  taxableIncome: number;
  breakdown: string[];
} {
  // 2026 Tax Reform (Nigeria Tax Act 2025 - effective Jan 1, 2026)
  if (year === "2026") {
    // New ₦800,000 tax-free threshold
    const taxFreeThreshold = 800_000;

    // No CRA in 2026 - just uses the new bands with the threshold
    const relief = 0; // CRA abolished
    const taxableIncome = Math.max(annualIncome - taxFreeThreshold, 0);

    // New 2026 tax bands (after the ₦800k threshold)
    const bands = [
      { limit: 2_200_000, rate: 0.15 },   // ₦800,001 - ₦3,000,000 (2.2M after threshold)
      { limit: 9_000_000, rate: 0.18 },   // ₦3,000,001 - ₦12,000,000
      { limit: 13_000_000, rate: 0.21 },  // ₦12,000,001 - ₦25,000,000
      { limit: 25_000_000, rate: 0.23 },  // ₦25,000,001 - ₦50,000,000
      { limit: Infinity, rate: 0.25 },    // Above ₦50,000,000
    ];

    let remaining = taxableIncome;
    let tax = 0;
    const breakdown: string[] = [];

    if (annualIncome <= taxFreeThreshold) {
      breakdown.push(`Income ₦${annualIncome.toLocaleString()} is tax-free (below ₦800,000 threshold)`);
      return { tax: 0, relief: 0, taxableIncome: 0, breakdown };
    }

    breakdown.push(`Tax-free threshold: ₦${taxFreeThreshold.toLocaleString()} @ 0% = ₦0`);

    for (const band of bands) {
      if (remaining <= 0) break;

      const amount = Math.min(remaining, band.limit);
      const bandTax = amount * band.rate;

      tax += bandTax;
      remaining -= amount;

      breakdown.push(
        `₦${amount.toLocaleString()} @ ${(band.rate * 100).toFixed(0)}% = ₦${Math.round(bandTax).toLocaleString()}`
      );
    }

    return { tax, relief, taxableIncome, breakdown };
  }

  // 2025 Tax Bands (Current PAYE with CRA)
  // Consolidated relief allowance (Nigeria)
  const relief =
    Math.max(200_000, annualIncome * 0.01) + annualIncome * 0.2;

  const taxableIncome = Math.max(annualIncome - relief, 0);

  const bands = [
    { limit: 300_000, rate: 0.07 },
    { limit: 300_000, rate: 0.11 },
    { limit: 500_000, rate: 0.15 },
    { limit: 500_000, rate: 0.19 },
    { limit: 1_600_000, rate: 0.21 },
    { limit: Infinity, rate: 0.24 },
  ];

  let remaining = taxableIncome;
  let tax = 0;
  const breakdown: string[] = [];

  for (const band of bands) {
    if (remaining <= 0) break;

    const amount = Math.min(remaining, band.limit);
    const bandTax = amount * band.rate;

    tax += bandTax;
    remaining -= amount;

    breakdown.push(
      `₦${amount.toLocaleString()} @ ${(band.rate * 100).toFixed(0)}% = ₦${bandTax.toLocaleString()}`
    );
  }

  return {
    tax,
    relief,
    taxableIncome,
    breakdown,
  };
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
  "FCT"
];

export default function CalculatorPage() {
  type TaxPeriod = "monthly" | "yearly";

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) {
      setIsDarkMode(stored === "true");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Styling classes with dark mode support
  const optionBase =
    "w-full flex items-center gap-3 rounded-xl border px-4 py-5 text-left transition cursor-pointer";

  const optionActive = isDarkMode
    ? "border-green-500 bg-green-900/30 text-gray-100"
    : "border-green-600 bg-green-50 text-gray-900";

  const optionInactive = isDarkMode
    ? "border-gray-600 bg-gray-800 text-gray-100 hover:border-green-500"
    : "border-gray-300 bg-white text-gray-900 hover:border-green-400";

  const [incomeAmount, setIncomeAmount] = useState<string>("");
  const [incomeType, setIncomeType] = useState<"monthly" | "yearly">("monthly");
  const [taxPeriod, setTaxPeriod] = useState<TaxPeriod>("yearly");
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [cryptoTaxMethod, setCryptoTaxMethod] = useState<CryptoTaxMethod>("cgt");
  const [selectedState, setSelectedState] = useState("");
  const [taxYear, setTaxYear] = useState<"2025" | "2026">("2025");
  const [annualRent, setAnnualRent] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);

  // Handle income input with formatting
  const handleIncomeChange = (value: string) => {
    setIncomeAmount(formatWithCommas(value));
  };

  // Handle navigation to results with loading state
  const goToResults = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setStep(5);
    }, 800);
  };

  const [expenses, setExpenses] = useState<Expenses>({
    internet: "",
    tools: "",
    rent: "",
    others: "",
  });

  const formatNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("en-NG");
  };

  const handleExpenseChange = (
    field: keyof Expenses,
    value: string
  ) => {
    const digitsOnly = value.replace(/\D/g, "");
    const numericValue = digitsOnly ? Number(digitsOnly) : 0;

    setExpenses((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
  };


  const handleNumberInput = (
    value: string,
    setter: (value: number) => void
  ) => {
    const raw = value.replace(/,/g, "");

    // Allow only digits
    if (!/^\d*$/.test(raw)) return;

    // Remove leading zeros
    const normalized = raw.replace(/^0+/, "");

    setter(normalized === "" ? 0 : Number(normalized));
  };

  // ---------- Helpers ----------
  const toNumber = (v: string | number | undefined) =>
    Number(String(v || "").replace(/,/g, "")) || 0;

  // ---------- Normalize income ----------
  const numericIncome = toNumber(incomeAmount);

  const yearlyIncome =
    incomeType === "monthly"
      ? numericIncome * 12
      : numericIncome;


  // ---------- Expenses ----------
  const totalExpenses =
    toNumber(expenses.internet) +
    toNumber(expenses.tools) +
    toNumber(expenses.rent) +
    toNumber(expenses.others);

  // --- Tax calculation ---
  const {
    tax,
    relief,
    taxableIncome,
    breakdown,
  } =
    yearlyIncome > 0
      ? calculateTax(Math.max(yearlyIncome - totalExpenses, 0))
      : { tax: 0, relief: 0, taxableIncome: 0, breakdown: [] };

  // --- Derived values ---
  const yearlyTax = tax;
  const monthlyTax = yearlyTax / 12;

  const effectiveTaxRate =
    yearlyIncome > 0 ? (yearlyTax / yearlyIncome) * 100 : 0;


  useEffect(() => {
    if (step === 3 && userType === "salary") {
      setStep(4);
    }
  }, [step, userType]);

  return (
    <div className={`min-h-screen flex items-center justify-center py-8 px-4 transition-colors ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`w-full max-w-xl rounded-xl p-6 transition-colors ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border`}>
        <div className="mb-10 text-center">

          {/* Title */}
          <h2 className="text-2xl font-bold flex justify-center items-center gap-2">
            <span className={isDarkMode ? "text-gray-100" : "text-gray-900"}>Nigeria</span>
            <span className="bg-green-700 text-white px-2 py-0.5 rounded-md">
              Tax
            </span>
            <span className={isDarkMode ? "text-gray-100" : "text-gray-900"}>Calculator</span>
          </h2>

          {/* Subtitle */}
          <p className={`text-sm mt-2 mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Learn how personal income tax works in Nigeria
          </p>

          {/* Progress bar */}
          <div className={`w-full rounded-full h-2 mb-6 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}>
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>

          <div className={`h-px w-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}></div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="mt-8">
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
              How do you earn money?
            </h1>

            <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              This helps us know which tax rules apply to you. There are no right or wrong answers.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setUserType("salary");
                  setStep(2);
                }}
                className={`${optionBase} ${userType === "salary" ? optionActive : optionInactive}`}
              >
                <span className="text-xl">💼</span>
                <span className="font-medium">I earn a regular salary</span>
              </button>

              <button
                onClick={() => {
                  setUserType("freelancer");
                  setStep(2);
                }}
                className={`${optionBase} ${userType === "freelancer" ? optionActive : optionInactive
                  }`}

              >
                <span className="text-xl">🧑‍💻</span>
                <span className="font-medium">I’m a freelancer or self-employed</span>
              </button>

              <button
                onClick={() => {
                  setUserType("both");
                  setStep(2);
                }}
                className={`${optionBase} ${userType === "both" ? optionActive : optionInactive
                  }`}

              >
                <span className="text-xl">🔀</span>
                <span className="font-medium">I earn from both</span>
              </button>

              <button
                onClick={() => {
                  setUserType("crypto");
                  setStep(2);
                }}
                className={`${optionBase} ${userType === "crypto" ? optionActive : optionInactive
                  }`}
              >
                <span className="text-xl">🪙</span>
                <span className="font-medium">I trade cryptocurrency</span>
              </button>
            </div>

            {/* Category Guide */}
            <div className={`mt-6 p-4 rounded-lg text-sm ${isDarkMode ? "bg-gray-700/50 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
              <p className="font-medium mb-2">📋 Quick Guide:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Salary earners:</strong> Employees receiving PAYE wages</li>
                <li>• <strong>Freelancers:</strong> Artisans, FX traders, consultants, self-employed</li>
                <li>• <strong>Crypto traders:</strong> Cryptocurrency investors & traders</li>
                <li className="text-gray-500">• <em>Registered businesses pay different taxes (CIT)</em></li>
              </ul>
              <p className="mt-3 text-xs">
                For official tax guidelines, visit{" "}
                <a
                  href="https://www.firs.gov.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-medium underline ${isDarkMode ? "text-green-400" : "text-green-600"}`}
                >
                  FIRS.gov.ng
                </a>
              </p>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              How much do you earn?
            </h1>

            <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Enter your income before tax. An estimate is perfectly fine.
            </p>

            {/* Monthly / Yearly toggle */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setIncomeType("monthly")}
                className={`flex-1 py-3 rounded-lg font-medium border transition ${incomeType === "monthly"
                  ? "bg-green-700 text-white border-green-700"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-100 border-gray-600 hover:border-green-500"
                    : "bg-white text-gray-900 border-gray-300 hover:border-green-700"
                  }`}
              >
                Monthly income
              </button>

              <button
                onClick={() => setIncomeType("yearly")}
                className={`flex-1 py-3 rounded-lg font-medium border transition ${incomeType === "yearly"
                  ? "bg-green-700 text-white border-green-700"
                  : isDarkMode
                    ? "bg-gray-700 text-gray-100 border-gray-600 hover:border-green-500"
                    : "bg-white text-gray-900 border-gray-300 hover:border-green-700"
                  }`}
              >
                Yearly income
              </button>
            </div>

            {/* Income input */}
            <div className="mb-8">
              <label className={`block text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Income amount
              </label>

              <div className={`flex items-center rounded-lg border focus-within:ring-2 focus-within:ring-green-600 ${isDarkMode
                ? "bg-gray-700 border-gray-600"
                : "bg-white border-gray-300"
                }`}>
                <span className={`pl-4 text-lg font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>₦</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={incomeAmount}
                  onChange={(e) => handleIncomeChange(e.target.value)}
                  className={`w-full px-2 py-3 text-lg font-medium focus:outline-none bg-transparent ${isDarkMode
                    ? "text-gray-100 placeholder-gray-500"
                    : "text-gray-900 placeholder-gray-400"
                    }`}
                />
              </div>

            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className={`text-sm ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"}`}
              >
                ← Back
              </button>

              <button
                disabled={numericIncome <= 0}
                onClick={() => setStep(3)}
                className={`px-6 py-3 rounded-lg font-medium ${numericIncome > 0
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                Continue →
              </button>

            </div>
          </div>
        )}

        {/* STEP 3 - Crypto Tax Method (for crypto traders only) */}
        {step === 3 && userType === "crypto" && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              How should we calculate your tax?
            </h1>

            <p className="text-sm text-gray-600 mb-6">
              Choose the tax method that applies to your crypto trading activity.
            </p>

            <div className="space-y-4 mb-8">
              <button
                onClick={() => setCryptoTaxMethod("cgt")}
                className={`${optionBase} ${cryptoTaxMethod === "cgt" ? optionActive : optionInactive}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">📈</span>
                    <span className="font-medium">Capital Gains Tax (10%)</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Flat 10% rate on your profits. Best for occasional traders.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setCryptoTaxMethod("pit")}
                className={`${optionBase} ${cryptoTaxMethod === "pit" ? optionActive : optionInactive}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">💼</span>
                    <span className="font-medium">Personal Income Tax (7-24%)</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Progressive rates based on PAYE bands. Best if trading is your main income.
                  </p>
                </div>
              </button>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-800">
                <strong>💡 Not sure which to pick?</strong> If you trade crypto occasionally,
                choose CGT. If it's your main source of income, choose Personal Income Tax.
              </p>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                ← Back
              </button>

              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 - Business Expenses (for non-crypto) */}
        {step === 3 && userType !== "crypto" && (
          <div className="mt-8">
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
              Business & work expenses
            </h1>

            <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              If you're self-employed, some work-related expenses can reduce the tax you pay.
              If you're unsure, you can skip this step.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Internet & data
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenses.internet}
                  onChange={(e) => handleExpenseChange("internet", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                    }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Tools & software
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenses.tools}
                  onChange={(e) => handleExpenseChange("tools", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                    }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Rent / workspace
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenses.rent}
                  onChange={(e) => handleExpenseChange("rent", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                    }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Other expenses
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenses.others}
                  onChange={(e) => handleExpenseChange("others", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                    }`}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`text-sm ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"}`}
              >
                ← Back
              </button>

              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="opacity-100 pointer-events-auto">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your tax details
            </h1>

            <p className="text-sm text-gray-600 mb-8">
              This helps us apply the correct Nigerian tax rules.
            </p>

            <div className="space-y-6">
              {/* State of residence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State of residence
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Select your state</option>
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Income source (read-only, not disabled) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Income source
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    userType === "salary"
                      ? "Salary (PAYE)"
                      : userType === "freelancer"
                        ? "Self-employed"
                        : userType === "crypto"
                          ? "Crypto Trader"
                          : "Salary + self-employed"
                  }
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 cursor-default"
                />
              </div>

              {/* Tax Year */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Tax Year
                </label>
                <select
                  value={taxYear}
                  onChange={(e) => setTaxYear(e.target.value as "2025" | "2026")}
                  className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                    }`}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>

              {/* Rent Relief - only for 2026 */}
              {taxYear === "2026" && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Annual Rent (for Rent Relief)
                  </label>
                  <div className={`flex items-center rounded-lg border overflow-hidden ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}>
                    <span className={`px-3 py-3 text-lg font-medium ${isDarkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
                      ₦
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 1,200,000"
                      value={annualRent}
                      onChange={(e) => setAnnualRent(formatWithCommas(e.target.value))}
                      className={`flex-1 px-4 py-3 focus:outline-none ${isDarkMode ? "bg-gray-700 text-gray-100" : "bg-white text-gray-900"}`}
                    />
                  </div>
                  <p className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    ✨ You can deduct 20% of your rent (max ₦500,000). Leave empty to skip.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10">
              <button
                onClick={() => setStep(3)}
                className={`text-sm ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"}`}
              >
                ← Back
              </button>

              <button
                onClick={goToResults}
                disabled={!selectedState || isCalculating}
                className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${selectedState && !isCalculating
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
              >
                {isCalculating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Calculating...
                  </>
                ) : (
                  "See results →"
                )}
              </button>
            </div>
          </div>
        )}

        {step === 5 && (() => {
          // Normalize income to yearly (using parseFormattedNumber to handle commas)
          const incomeValue = parseFormattedNumber(incomeAmount);
          const yearlyIncome =
            incomeType === "monthly"
              ? incomeValue * 12
              : incomeValue;

          // Check if crypto CGT applies
          const isCryptoCGT = userType === "crypto" && cryptoTaxMethod === "cgt";

          // Calculate Rent Relief for 2026 (20% of rent, max ₦500,000)
          const rentAmount = parseFormattedNumber(annualRent);
          const rentRelief = taxYear === "2026" ? Math.min(rentAmount * 0.2, 500_000) : 0;

          // Apply rent relief to income
          const incomeAfterRentRelief = Math.max(yearlyIncome - rentRelief, 0);

          // Calculate tax based on method
          let tax: number;
          let relief: number;
          let taxableIncome: number;
          let breakdown: string[];

          if (isCryptoCGT && taxYear === "2025") {
            // 2025: Capital Gains Tax: 10% flat rate
            tax = yearlyIncome * 0.1;
            relief = 0;
            taxableIncome = yearlyIncome;
            breakdown = [`₦${yearlyIncome.toLocaleString()} @ 10% = ₦${tax.toLocaleString()}`];
          } else if (isCryptoCGT && taxYear === "2026") {
            // 2026: CGT now uses progressive rates (per Nigeria Tax Act 2025)
            const result = calculateTax(incomeAfterRentRelief, "2026");
            tax = result.tax;
            relief = result.relief;
            taxableIncome = result.taxableIncome;
            breakdown = result.breakdown;
          } else {
            // Personal Income Tax: progressive PAYE bands
            const result = calculateTax(incomeAfterRentRelief, taxYear);
            tax = result.tax;
            relief = result.relief;
            taxableIncome = result.taxableIncome;
            breakdown = result.breakdown;
          }

          const monthlyTax = tax / 12;

          return (
            <div>
              {/* Title */}
              <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                Your {taxYear} tax estimate
              </h1>

              <p className={`text-sm mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                {taxYear === "2026"
                  ? "Based on the new Nigeria Tax Act 2025 (effective Jan 1, 2026)."
                  : isCryptoCGT
                    ? "This estimate is based on Nigeria's Capital Gains Tax rate of 10%."
                    : "This is an estimate based on Nigerian personal income tax rules."}
              </p>

              {/* Tax method badge for crypto */}
              {userType === "crypto" && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 ${isCryptoCGT
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
                  }`}>
                  {isCryptoCGT ? "📈 Capital Gains Tax (10%)" : "💼 Personal Income Tax (PAYE)"}
                </div>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className={`rounded-xl border p-5 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {userType === "crypto" ? "Annual crypto profit" : "Annual income"}
                  </p>
                  <p className={`text-base md:text-xl font-semibold mt-1 truncate ${isDarkMode ? "text-gray-100" : ""}`}>
                    ₦{yearlyIncome.toLocaleString()}
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total tax (yearly)</p>
                  <p className="text-base md:text-xl font-semibold mt-1 text-green-600 truncate">
                    ₦{Math.round(tax).toLocaleString()}
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Monthly tax</p>
                  <p className={`text-base md:text-xl font-semibold mt-1 truncate ${isDarkMode ? "text-gray-100" : ""}`}>
                    ₦{Math.round(monthlyTax).toLocaleString()}
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Effective rate</p>
                  <p className={`text-xl font-semibold mt-1 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                    {yearlyIncome > 0 ? ((tax / yearlyIncome) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              {/* Take-home pay - prominent display */}
              <div className={`rounded-xl border-2 p-6 mb-8 text-center ${isDarkMode
                ? "bg-green-900/30 border-green-600"
                : "bg-green-50 border-green-500"
                }`}>
                <p className={`text-sm font-medium mb-1 ${isDarkMode ? "text-green-400" : "text-green-700"}`}>
                  💰 Your Annual Take-Home Pay
                </p>
                <p className={`text-2xl md:text-3xl font-bold ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
                  ₦{Math.round(yearlyIncome - tax).toLocaleString()}
                </p>
                <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Monthly: ₦{((yearlyIncome - tax) / 12).toLocaleString()}
                </p>
              </div>

              {/* Explanation */}
              <div className={`rounded-xl border p-6 mb-8 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50"}`}>
                <h2 className={`font-semibold mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  How your {taxYear} tax was calculated
                </h2>

                {isCryptoCGT && taxYear === "2025" ? (
                  <ul className={`text-sm space-y-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <li>
                      • Tax method: <strong>Capital Gains Tax</strong>
                    </li>
                    <li>
                      • Rate: <strong>10% flat rate</strong> on crypto profits
                    </li>
                    <li>
                      • Crypto profit: <strong>₦{yearlyIncome.toLocaleString()}</strong>
                    </li>
                    <li>
                      • Tax payable: <strong>₦{Math.round(tax).toLocaleString()}</strong>
                    </li>
                  </ul>
                ) : taxYear === "2026" ? (
                  <ul className={`text-sm space-y-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <li>
                      • Tax-free threshold: <strong>₦800,000</strong> (0% tax)
                    </li>
                    <li>
                      • Your income: <strong>₦{yearlyIncome.toLocaleString()}</strong>
                    </li>
                    {rentRelief > 0 && (
                      <li className={isDarkMode ? "text-green-400" : "text-green-600"}>
                        • Rent relief applied: <strong>₦{rentRelief.toLocaleString()}</strong> (20% of rent)
                      </li>
                    )}
                    <li>
                      • Taxable income (after deductions): <strong>₦{taxableIncome.toLocaleString()}</strong>
                    </li>
                    <li>
                      • New progressive rates applied: <strong>15% - 25%</strong>
                    </li>
                    {userType !== "salary" && userType !== "crypto" && (
                      <li>
                        • Business expenses deducted where applicable
                      </li>
                    )}
                  </ul>
                ) : (
                  <ul className={`text-sm space-y-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <li>
                      • Consolidated relief allowance:{" "}
                      <strong>₦{Math.round(relief).toLocaleString()}</strong>
                    </li>
                    <li>
                      • Taxable income after relief:{" "}
                      <strong>₦{taxableIncome.toLocaleString()}</strong>
                    </li>
                    {userType !== "salary" && userType !== "crypto" && (
                      <li>
                        • Business expenses were deducted where applicable
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Tax Benefits Info Box */}
              <div className={`rounded-xl border p-6 mb-8 ${isDarkMode ? "bg-blue-900/20 border-blue-700" : "bg-blue-50 border-blue-200"}`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
                  💡 Your Tax Benefits
                </h3>

                {userType === "salary" && (
                  <div className={`text-sm space-y-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <p><strong>As a salary earner, you receive:</strong></p>
                    <ul className="list-disc ml-5 space-y-1">
                      {taxYear === "2025" ? (
                        <>
                          <li>Consolidated Relief Allowance (CRA) - automatically applied</li>
                          <li>20% of income + ₦200,000 (or 1% of income) as tax relief</li>
                        </>
                      ) : (
                        <>
                          <li>₦800,000 tax-free threshold - first ₦800k is not taxed</li>
                          <li>Rent Relief - up to 20% of annual rent (max ₦500,000)</li>
                        </>
                      )}
                    </ul>
                    <p className={`mt-3 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                      Note: Salary earners cannot deduct business expenses as tax is deducted at source.
                    </p>
                  </div>
                )}

                {(userType === "freelancer" || userType === "both") && (
                  <div className={`text-sm space-y-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <p><strong>As self-employed, you can deduct:</strong></p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Internet & data costs</li>
                      <li>Tools & software subscriptions</li>
                      <li>Rent / workspace expenses</li>
                      <li>Other legitimate business expenses</li>
                      {taxYear === "2025" ? (
                        <li>Consolidated Relief Allowance (CRA)</li>
                      ) : (
                        <>
                          <li>₦800,000 tax-free threshold</li>
                          <li>Rent Relief (up to ₦500,000)</li>
                        </>
                      )}
                    </ul>
                    <p className={`mt-3 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                      Tip: Keep receipts for all business expenses for tax filing.
                    </p>
                  </div>
                )}

                {userType === "crypto" && (
                  <div className={`text-sm space-y-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <p><strong>As a crypto trader:</strong></p>
                    {isCryptoCGT && taxYear === "2025" ? (
                      <ul className="list-disc ml-5 space-y-1">
                        <li>10% flat Capital Gains Tax rate</li>
                        <li>No additional deductions available with CGT</li>
                        <li>Consider PIT if you have significant trading expenses</li>
                      </ul>
                    ) : (
                      <ul className="list-disc ml-5 space-y-1">
                        {taxYear === "2026" ? (
                          <>
                            <li>₦800,000 tax-free threshold applies</li>
                            <li>Progressive rates (15% - 25%) on profits</li>
                            <li>Rent Relief available (up to ₦500,000)</li>
                          </>
                        ) : (
                          <>
                            <li>Treated as personal income (PIT)</li>
                            <li>Consolidated Relief Allowance applies</li>
                            <li>Trading expenses may be deductible</li>
                          </>
                        )}
                      </ul>
                    )}
                    <p className={`mt-3 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                      {taxYear === "2026"
                        ? "Note: In 2026, CGT uses progressive rates same as PIT."
                        : "Tip: CGT is simpler, but PIT may result in lower tax if you have expenses."}
                    </p>
                  </div>
                )}
              </div>

              {/* Tax Breakdown Section */}
              {isCryptoCGT && taxYear === "2025" ? (
                /* Simple CGT explanation for crypto traders in 2025 */
                <div className="mb-8">
                  <h2 className={`font-semibold mb-4 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                    Capital Gains Tax Calculation
                  </h2>

                  <div className={`rounded-lg p-6 ${isDarkMode ? "bg-purple-900/30 border border-purple-700" : "bg-purple-50 border border-purple-200"}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">📈</span>
                      <div>
                        <p className={`font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>10% Flat Rate</p>
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Applied to your crypto profits</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className={`flex justify-between py-2 border-b ${isDarkMode ? "border-purple-700" : "border-purple-200"}`}>
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Crypto Profit</span>
                        <span className={`font-medium ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>₦{yearlyIncome.toLocaleString()}</span>
                      </div>
                      <div className={`flex justify-between py-2 border-b ${isDarkMode ? "border-purple-700" : "border-purple-200"}`}>
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Tax Rate</span>
                        <span className={`font-medium ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>10%</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className={`font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>Tax Payable</span>
                        <span className="font-bold text-purple-500">₦{tax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* PAYE bands table (year-aware) */
                <div className="mb-8">
                  <h2 className={`font-semibold mb-4 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                    {taxYear === "2026" ? "2026 Tax Bands (New Reform)" : "2025 PAYE Tax Bands"}
                  </h2>

                  <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {taxYear === "2026"
                      ? <>The first <strong>₦800,000</strong> is tax-free. Your taxable income of{" "}
                        <strong className={isDarkMode ? "text-gray-100" : "text-gray-900"}>₦{taxableIncome.toLocaleString()}</strong>{" "}
                        is taxed using the new progressive bands:</>
                      : <>Nigeria uses a progressive tax system. Your taxable income of{" "}
                        <strong className={isDarkMode ? "text-gray-100" : "text-gray-900"}>₦{taxableIncome.toLocaleString()}</strong>{" "}
                        is taxed across these bands:</>}
                  </p>

                  {/* Tax bands table */}
                  <div className={`border rounded-lg overflow-hidden mb-6 ${isDarkMode ? "border-gray-700" : ""}`}>
                    <table className="w-full text-sm">
                      <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-100"}>
                        <tr>
                          <th className={`text-left px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Income Band</th>
                          <th className={`text-center px-4 py-3 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {taxYear === "2026" ? (
                          <>
                            <tr className={isDarkMode ? "bg-gray-800" : "bg-green-50"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-green-400" : "text-green-700"}`}>First ₦800,000</td>
                              <td className={`px-4 py-3 text-center font-bold ${isDarkMode ? "text-green-400" : "text-green-700"}`}>0% (Tax-Free)</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-700" : "bg-white"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>₦800,001 - ₦3,000,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>15%</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>₦3,000,001 - ₦12,000,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>18%</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-700" : "bg-white"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>₦12,000,001 - ₦25,000,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>21%</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-800" : "bg-gray-50"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>₦25,000,001 - ₦50,000,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>23%</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-700" : "bg-white"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Above ₦50,000,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>25%</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr className={isDarkMode ? "bg-gray-800" : "bg-white"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>First ₦300,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>7%</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Next ₦300,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>11%</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-800" : "bg-white"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Next ₦500,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>15%</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Next ₦500,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>19%</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-800" : "bg-white"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Next ₦1,600,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>21%</td>
                            </tr>
                            <tr className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                              <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Above ₦3,200,000</td>
                              <td className={`px-4 py-3 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>24%</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Your calculation breakdown */}
                  <h3 className={`font-medium mb-3 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                    Your tax calculation
                  </h3>

                  <div className={`rounded-lg p-4 space-y-2 ${isDarkMode ? "bg-green-900/30 border border-green-700" : "bg-green-50 border border-green-200"}`}>
                    {breakdown.map((line: string, idx: number) => (
                      <div key={idx} className="flex items-center text-sm">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>{line}</span>
                      </div>
                    ))}
                    <div className={`border-t mt-3 pt-3 flex justify-between font-semibold ${isDarkMode ? "border-green-700" : "border-green-300"}`}>
                      <span className={isDarkMode ? "text-gray-100" : "text-gray-900"}>Total Annual Tax</span>
                      <span className="text-green-500">₦{Math.round(tax).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
              }

              {/* Actions */}
              <div className="flex items-center justify-between no-print">
                <button
                  onClick={() => setStep(4)}
                  className={`text-sm ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"}`}
                >
                  ← Back
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.print()}
                    className={`px-4 py-3 rounded-lg font-medium border transition ${isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    🖨️ Print
                  </button>

                  <button
                    onClick={() => {
                      const tweetText = `I just calculated my Nigerian tax! 🇳🇬\n\n📊 Income: ₦${yearlyIncome.toLocaleString()}\n💰 Tax: ₦${tax.toLocaleString()}\n✨ Take-home: ₦${(yearlyIncome - tax).toLocaleString()}\n\nTry it yourself 👇`;
                      const url = window.location.href;
                      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`, '_blank');
                    }}
                    className={`px-4 py-3 rounded-lg font-medium border transition ${isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    Share on 𝕏
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    Start over
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {step === 6 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your tax results
            </h1>

            <p className="text-sm text-gray-600 mb-6">
              Based on the information you provided, here’s an estimate of your Nigerian
              personal income tax.
            </p>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl border p-5">
                <p className="text-sm text-gray-500">Annual tax payable</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{tax.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border p-5">
                <p className="text-sm text-gray-500">Monthly tax</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{monthlyTax.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border p-5">
                <p className="text-sm text-gray-500">Taxable income</p>
                <p className="text-xl font-semibold text-gray-900">
                  ₦{taxableIncome.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border p-5">
                <p className="text-sm text-gray-500">Effective tax rate</p>
                <p className="text-xl font-semibold text-gray-900">
                  {effectiveTaxRate.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Tax band breakdown */}
            <div className="mb-8">
              <h2 className="font-semibold text-gray-900 mb-3">
                Tax band breakdown
              </h2>

              <div className="space-y-2">
                {breakdown.map((line: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between text-sm text-gray-700 border-b pb-2"
                  >
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep(4)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setIncomeAmount("");
                  setExpenses({
                    internet: "",
                    tools: "",
                    rent: "",
                    others: "",
                  });
                }}
                className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-8 pt-6 border-t flex items-center justify-between ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Designed by{" "}
            <a
              href="https://x.com/mysucesstory"
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium hover:underline ${isDarkMode ? "text-green-400" : "text-green-600"}`}
            >
              @mysucesstory
            </a>
          </p>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors no-print ${isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
        </div>

      </div>
    </div>
  );
}
