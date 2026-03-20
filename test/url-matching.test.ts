import { describe, expect, it } from "vitest";
import { previewUrlMatches, toPreviewLookupUrl } from "../src/url-matching.js";

describe("toPreviewLookupUrl", () => {
  it("normalizes path to root and clears hash, preserving query", () => {
    expect(toPreviewLookupUrl("https://app.test/dashboard?foo=1#frag")).toBe(
      "https://app.test/?foo=1",
    );
  });

  it("returns null for invalid URLs", () => {
    expect(toPreviewLookupUrl("not a url")).toBeNull();
  });
});

describe("previewUrlMatches", () => {
  it("matches same origin and path with identical query", () => {
    expect(
      previewUrlMatches(
        "http://localhost:5173/?workspace=koala",
        "http://localhost:5173/?workspace=koala",
      ),
    ).toBe(true);
  });

  it("allows target to have extra query params", () => {
    expect(
      previewUrlMatches(
        "http://localhost:5173/?workspace=koala",
        "http://localhost:5173/?workspace=koala&trace=1",
      ),
    ).toBe(true);
  });

  it("rejects when preview query key is missing on target", () => {
    expect(
      previewUrlMatches(
        "http://localhost:5173/?workspace=koala",
        "http://localhost:5173/",
      ),
    ).toBe(false);
  });

  it("rejects mismatched query values", () => {
    expect(
      previewUrlMatches(
        "http://localhost:5173/?workspace=a",
        "http://localhost:5173/?workspace=b",
      ),
    ).toBe(false);
  });

  it("ignores trailing slash differences on path", () => {
    expect(
      previewUrlMatches("https://x.test/foo/", "https://x.test/foo"),
    ).toBe(true);
  });

  it("rejects different origins", () => {
    expect(
      previewUrlMatches(
        "https://a.test/path",
        "https://b.test/path",
      ),
    ).toBe(false);
  });

  it("returns false when either URL is invalid", () => {
    expect(previewUrlMatches("bad", "https://x.test/")).toBe(false);
    expect(previewUrlMatches("https://x.test/", "bad")).toBe(false);
  });
});
