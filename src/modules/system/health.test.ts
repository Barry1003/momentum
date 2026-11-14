import { describe, expect, it } from "vitest";
import { getHealthResponse } from "./health";

describe("system health response", () => {
  it("reports a healthy Momentum API without exposing internal secrets", () => {
    expect(getHealthResponse()).toEqual({ service: "momentum", status: "ok" });
  });
});
