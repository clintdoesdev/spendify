/** Nigerian banks and fintechs we know, with an approximate brand colour for their mark. */
export const KNOWN_BANKS: { name: string; color: string; match: RegExp }[] = [
  { name: "GTBank", color: "#e35205", match: /^(gt|gtb|gtbank|guaranty)/ },
  { name: "Access Bank", color: "#f28c00", match: /^access/ },
  { name: "Zenith Bank", color: "#e2001a", match: /^zenith/ },
  { name: "UBA", color: "#d42e12", match: /^(uba|united bank)/ },
  { name: "First Bank", color: "#003b65", match: /^(first ?bank|fbn)/ },
  { name: "Fidelity Bank", color: "#1c2b6b", match: /^fidelity/ },
  { name: "FCMB", color: "#5c2d91", match: /^fcmb/ },
  { name: "Stanbic IBTC", color: "#0033a1", match: /^stanbic/ },
  { name: "Sterling Bank", color: "#db353a", match: /^sterling/ },
  { name: "Union Bank", color: "#00aeef", match: /^union/ },
  { name: "Wema Bank", color: "#990d81", match: /^(wema|alat)/ },
  { name: "Ecobank", color: "#004c97", match: /^ecobank/ },
  { name: "Polaris Bank", color: "#6f2c91", match: /^polaris/ },
  { name: "Providus Bank", color: "#c79a2c", match: /^providus/ },
  { name: "Kuda", color: "#40196d", match: /^kuda/ },
  { name: "OPay", color: "#12b886", match: /^opay/ },
  { name: "PalmPay", color: "#6c3ef4", match: /^palm ?pay/ },
  { name: "Moniepoint", color: "#0357ee", match: /^monie ?point/ },
  { name: "Carbon", color: "#2e3192", match: /^carbon/ },
  { name: "FairMoney", color: "#0b3d91", match: /^fair ?money/ },
  { name: "VFD / V Bank", color: "#ff5c00", match: /^(vfd|v ?bank)/ },
];

export function bankColor(institution: string) {
  const key = institution.trim().toLowerCase();
  return KNOWN_BANKS.find((b) => b.match.test(key))?.color ?? "#1f1f1f";
}

export function bankInitials(institution: string) {
  const words = institution.trim().split(/\s+/).filter((w) => !/^(bank|plc|mfb|microfinance)$/i.test(w));
  const first = words[0] ?? institution;
  return (words.length > 1 ? first[0] + words[1][0] : first.slice(0, 2)).toUpperCase();
}
