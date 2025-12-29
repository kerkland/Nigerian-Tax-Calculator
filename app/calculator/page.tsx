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

function calculateTax(annualIncome: number): {
  tax: number;
  relief: number;
  taxableIncome: number;
  breakdown: string[];
} {
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
  const [taxYear, setTaxYear] = useState<"2024" | "2025">("2024");
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
        <div className="mb-10 text-center relative">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className={`absolute top-0 right-0 p-2 rounded-lg transition-colors no-print ${isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Business & work expenses
            </h1>

            <p className="text-sm text-gray-600 mb-6">
              If you’re self-employed, some work-related expenses can reduce the tax you pay.
              If you’re unsure, you can skip this step.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm text-gray-600">Internet & data</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenses.internet}
                  onChange={(e) =>
                    handleExpenseChange("internet", e.target.value)
                  }

                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"

                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Tools & software</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenses.tools}
                  onChange={(e) =>
                    handleExpenseChange("tools", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"

                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rent / workspace
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={expenses.rent}
                  onChange={(e) =>
                    handleExpenseChange("rent", e.target.value)
                  }

                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
                />

              </div>

              <div>
                <label className="text-sm text-gray-600">Other expenses</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expenses.others}
                  onChange={(e) =>
                    handleExpenseChange("others", e.target.value)
                  }

                  className="w-full mt-1 px-4 py-3 border rounded-lg
          text-lg font-semibold text-gray-900
          placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-green-200"

                />
              </div>
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
                className="px-6 py-3 rounded-lg font-medium text-white
                   bg-green-600 hover:bg-green-700"
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
                  onChange={(e) => setTaxYear(e.target.value as "2024" | "2025")}
                  className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 ${isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                    }`}
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>
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

          // Calculate tax based on method
          let tax: number;
          let relief: number;
          let taxableIncome: number;
          let breakdown: string[];

          if (isCryptoCGT) {
            // Capital Gains Tax: 10% flat rate
            tax = yearlyIncome * 0.1;
            relief = 0;
            taxableIncome = yearlyIncome;
            breakdown = [`₦${yearlyIncome.toLocaleString()} @ 10% = ₦${tax.toLocaleString()}`];
          } else {
            // Personal Income Tax: progressive PAYE bands
            const result = calculateTax(yearlyIncome);
            tax = result.tax;
            relief = result.relief;
            taxableIncome = result.taxableIncome;
            breakdown = result.breakdown;
          }

          const monthlyTax = tax / 12;

          return (
            <div>
              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Your tax estimate
              </h1>

              <p className="text-sm text-gray-600 mb-8">
                {isCryptoCGT
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
                  <p className={`text-xl font-semibold mt-1 ${isDarkMode ? "text-gray-100" : ""}`}>
                    ₦{yearlyIncome.toLocaleString()}
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total tax (yearly)</p>
                  <p className="text-xl font-semibold mt-1 text-green-600">
                    ₦{tax.toLocaleString()}
                  </p>
                </div>

                <div className={`rounded-xl border p-5 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-white"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Monthly tax</p>
                  <p className={`text-xl font-semibold mt-1 ${isDarkMode ? "text-gray-100" : ""}`}>
                    ₦{monthlyTax.toLocaleString()}
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
                <p className={`text-3xl font-bold ${isDarkMode ? "text-green-300" : "text-green-700"}`}>
                  ₦{(yearlyIncome - tax).toLocaleString()}
                </p>
                <p className={`text-sm mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Monthly: ₦{((yearlyIncome - tax) / 12).toLocaleString()}
                </p>
              </div>

              {/* Explanation */}
              <div className="rounded-xl bg-gray-50 border p-6 mb-8">
                <h2 className="font-semibold text-gray-900 mb-3">
                  How this was calculated
                </h2>

                {isCryptoCGT ? (
                  <ul className="text-sm text-gray-700 space-y-2">
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
                      • Tax payable: <strong>₦{tax.toLocaleString()}</strong>
                    </li>
                  </ul>
                ) : (
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li>
                      • Consolidated relief allowance:{" "}
                      <strong>₦{relief.toLocaleString()}</strong>
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

              {/* Tax Breakdown Section */}
              {isCryptoCGT ? (
                /* Simple CGT explanation for crypto traders */
                <div className="mb-8">
                  <h2 className="font-semibold text-gray-900 mb-4">
                    Capital Gains Tax Calculation
                  </h2>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">📈</span>
                      <div>
                        <p className="font-semibold text-gray-900">10% Flat Rate</p>
                        <p className="text-sm text-gray-600">Applied to your crypto profits</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-purple-200">
                        <span className="text-gray-600">Crypto Profit</span>
                        <span className="font-medium text-gray-900">₦{yearlyIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-purple-200">
                        <span className="text-gray-600">Tax Rate</span>
                        <span className="font-medium text-gray-900">10%</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-semibold text-gray-900">Tax Payable</span>
                        <span className="font-bold text-purple-700">₦{tax.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Full PAYE bands table for non-CGT */
                <div className="mb-8">
                  <h2 className="font-semibold text-gray-900 mb-4">
                    Nigerian PAYE Tax Bands
                  </h2>

                  <p className="text-sm text-gray-600 mb-4">
                    Nigeria uses a progressive tax system. Your taxable income of{" "}
                    <strong className="text-gray-900">₦{taxableIncome.toLocaleString()}</strong>{" "}
                    is taxed across these bands:
                  </p>

                  {/* Tax bands table */}
                  <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-gray-700">Income Band</th>
                          <th className="text-center px-4 py-3 font-medium text-gray-700">Rate</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-700">Tax</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-gray-700">First ₦300,000</td>
                          <td className="px-4 py-3 text-center text-gray-700">7%</td>
                          <td className="px-4 py-3 text-right text-gray-900">₦21,000</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">Next ₦300,000</td>
                          <td className="px-4 py-3 text-center text-gray-700">11%</td>
                          <td className="px-4 py-3 text-right text-gray-900">₦33,000</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-gray-700">Next ₦500,000</td>
                          <td className="px-4 py-3 text-center text-gray-700">15%</td>
                          <td className="px-4 py-3 text-right text-gray-900">₦75,000</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">Next ₦500,000</td>
                          <td className="px-4 py-3 text-center text-gray-700">19%</td>
                          <td className="px-4 py-3 text-right text-gray-900">₦95,000</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="px-4 py-3 text-gray-700">Next ₦1,600,000</td>
                          <td className="px-4 py-3 text-center text-gray-700">21%</td>
                          <td className="px-4 py-3 text-right text-gray-900">₦336,000</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-gray-700">Above ₦3,200,000</td>
                          <td className="px-4 py-3 text-center text-gray-700">24%</td>
                          <td className="px-4 py-3 text-right text-gray-900">Variable</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Your calculation breakdown */}
                  <h3 className="font-medium text-gray-900 mb-3">
                    Your tax calculation
                  </h3>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                    {breakdown.map((line: string, idx: number) => (
                      <div key={idx} className="flex items-center text-sm">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-gray-700">{line}</span>
                      </div>
                    ))}
                    <div className="border-t border-green-300 mt-3 pt-3 flex justify-between font-semibold">
                      <span className="text-gray-900">Total Annual Tax</span>
                      <span className="text-green-700">₦{tax.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

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
        <div className={`mt-8 pt-6 border-t text-center ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
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
        </div>

      </div>
    </div>
  );
}
