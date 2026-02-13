import type { NextRequest } from "next/server";

const configuredBaseUrl =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const baseUrl = (
  configuredBaseUrl.startsWith("http://") || configuredBaseUrl.startsWith("https://")
    ? configuredBaseUrl
    : "http://localhost:8000"
).replace(/\/$/, "");

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

export const dynamic = "force-dynamic";

async function proxy(request: NextRequest, path: string[] = []): Promise<Response> {
  const incoming = new URL(request.url);
  const targetPath = path.map((part) => encodeURIComponent(part)).join("/");
  const targetUrl = `${baseUrl}/${targetPath}${incoming.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("expect");

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();
  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upstream proxy error";
    return Response.json(
      { detail: `API proxy failed for ${targetUrl}: ${message}` },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(upstream.headers);
  for (const header of hopByHopHeaders) {
    responseHeaders.delete(header);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path || []);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path || []);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path || []);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path || []);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path || []);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path || []);
}
