import { headers } from "next/headers";

/** 現在のリクエストのホストから絶対URLを組み立てる（trustHostと同じ考え方）。 */
export async function getAppUrl(path: string) {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}${path}`;
}
