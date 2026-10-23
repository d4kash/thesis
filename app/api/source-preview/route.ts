import { NextResponse } from "next/server";
import { fetchUntrustedUrl, readResponseWithSizeLimit } from "@ai-sdk/provider-utils";
import {
  extractPublicSourcePreview,
  MAX_PUBLIC_SOURCE_HTML_BYTES,
  parseSupportedPublicSourceUrl,
  PublicSourceUrlError,
} from "@/lib/public-source-preview";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let rawUrl: unknown;

  try {
    ({ url: rawUrl } = await request.json());
  } catch {
    return errorResponse("Send one source URL to preview.", 400);
  }

  if (typeof rawUrl !== "string") return errorResponse("Send one source URL to preview.", 400);

  let sourceUrl: URL;
  try {
    sourceUrl = parseSupportedPublicSourceUrl(rawUrl);
  } catch (error) {
    return errorResponse(error instanceof PublicSourceUrlError ? error.message : "The source URL could not be checked.", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetchUntrustedUrl({
      url: sourceUrl.toString(),
      abortSignal: controller.signal,
      maxRedirects: 3,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "ThesisStudioSourcePreview/0.2",
      },
    });

    if (!response.ok) {
      return errorResponse(`The public source returned ${response.status}. Open it in a browser and add the citation manually.`, 422);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/^(text\/html|application\/xhtml\+xml)/i.test(contentType)) {
      return errorResponse("This link is not a public HTML record. Add its citation and your checked notes manually instead.", 422);
    }

    let finalUrl: URL;
    try {
      finalUrl = parseSupportedPublicSourceUrl(response.url || sourceUrl.toString());
    } catch {
      return errorResponse("The source redirected outside the approved public record sites, so it was not imported.", 422);
    }

    const html = new TextDecoder().decode(await readResponseWithSizeLimit({
      response,
      url: finalUrl.toString(),
      maxBytes: MAX_PUBLIC_SOURCE_HTML_BYTES,
    }));

    return NextResponse.json(
      { preview: extractPublicSourcePreview(html, finalUrl.toString()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return errorResponse("We could not preview that source safely. Open the original record, then add its title, stable link, and your own notes manually.", 422);
  } finally {
    clearTimeout(timeout);
  }
}
