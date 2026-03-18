import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function rejectBadTitle(
  request: ZuploRequest,
  context: ZuploContext
): Promise<ZuploRequest | Response> {
  const contentType = request.headers.get("content-type") || "";

  // Require JSON
  if (!contentType.toLowerCase().includes("application/json")) {
    return new Response(
      JSON.stringify({
        error: "unsupported_media_type",
        message: "Content-Type must be application/json"
      }),
      {
        status: 415,
        headers: { "content-type": "application/json" }
      }
    );
  }

  // Clone request so we can safely read body
  const clonedRequest = request.clone();

  let body: unknown;

  try {
    body = await clonedRequest.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "invalid_json",
        message: "Request body must be valid JSON"
      }),
      {
        status: 400,
        headers: { "content-type": "application/json" }
      }
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return request;
  }

  const payload = body as Record<string, unknown>;
  const title = payload.title;

  // Block bad value
  if (
    typeof title === "string" &&
    title.trim().toLowerCase() === "kill sam"
  ) {
    return new Response(
      JSON.stringify({
        error: "request_blocked",
        message: 'The title value "kill sam" is not allowed.'
      }),
      {
        status: 403,
        headers: { "content-type": "application/json" }
      }
    );
  }

  return request;
}