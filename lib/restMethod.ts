/** First rest phase: classic autolyse vs fermentolyse (starter in the rest mix). */
export type RestMethod = "autolyse" | "fermentolyse";

export const REST_METHOD_DEFAULT: RestMethod = "autolyse";

export function parseRestMethod(value?: string): RestMethod {
  if (value === "f" || value === "fermentolyse") return "fermentolyse";
  return "autolyse";
}

export function restMethodToUrl(method: RestMethod): string {
  return method === "fermentolyse" ? "f" : "a";
}

export function isFermentolyse(method: RestMethod): boolean {
  return method === "fermentolyse";
}
