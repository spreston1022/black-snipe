// modules/reject-bad-title.ts
import { ZuploContext, ZuploRequest } from "@zuplo/runtime";

export default async function rejectBadTitle(
  request: ZuploRequest,
  context: ZuploContext,
): Promise<ZuploRequest | Response> {
  // Only inspect JSON requests
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return request;
  }

  // Clone before reading so the original stream is not drained
  const clonedRequest = request.clone();

  let body: unknown;

  try {
    body = await clonedRequest.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "invalid_json",
        message: "Request body must be valid JSON.",
      }),
      {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  // Narrow the type safely
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return request;
  }

  const payload = body as Record<string, unknown>;
  const title = payload.title;

  // Exact match, case-insensitive, trimming whitespace
  if (
    typeof title === "string" &&
    title.trim().toLowerCase() === "kill sam"
  ) {
    context.log.warn("Blocked request due to disallowed title value.");

    return new Response(
      JSON.stringify({
        error: "request_blocked",
        message: 'The title value "kill sam" is not allowed.',
      }),
      {
        status: 403,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  // Return the original request because we only read the clone
  return request;
}