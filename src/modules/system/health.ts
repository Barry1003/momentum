export type HealthResponse = {
  service: "momentum";
  status: "ok";
};

export function getHealthResponse(): HealthResponse {
  return { service: "momentum", status: "ok" };
}
