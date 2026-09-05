// Local fixture only. These links cannot attribute purchases or earn commissions.
export function affiliatePreview(mode) {
  if (mode === "unauth") return { status: 401 };
  if (mode === "error") return { status: 503 };
  if (!["ai", "exclusive", "expired"].includes(mode)) return { status: 403 };
  return { status: 200, data: { preview: true,
    links: ["ai", "exclusive"].map(product => ({ product,
      url: `https://titans.example/${product}/?a=demo-creator`,
      commissionPercent: 30, payments: "first_payment" })),
    metrics: null, referrals: null,
  } };
}
