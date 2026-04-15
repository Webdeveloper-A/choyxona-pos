export const PLACE_STATUS = {
  FREE: "bo'sh",
  OCCUPIED: "band",
} as const;

export type PlaceStatus = (typeof PLACE_STATUS)[keyof typeof PLACE_STATUS];

export function isPlaceOccupied(status: unknown): boolean {
  return typeof status === "string" && status.trim().toLowerCase() === PLACE_STATUS.OCCUPIED;
}

export function isPlaceFree(status: unknown): boolean {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  return normalized === "" || normalized === PLACE_STATUS.FREE;
}
