// Nepali rupee price, e.g. 1250 -> "Rs 1,250"
export const npr = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;
