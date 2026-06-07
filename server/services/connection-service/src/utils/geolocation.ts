export interface Coordinates {
  latitude: number;
  longitude: number;
}
export class GeolocationUtils {
  // Calculate distance between two coordinates using Haversine formula
  static calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coords2.latitude - coords1.latitude);
    const dLon = this.toRad(coords2.longitude - coords1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coords1.latitude)) *
        Math.cos(this.toRad(coords2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get approximate location string (for privacy)
  static getApproximateLocation(city: string, state: string): string {
    return `Near ${city}, ${state}`;
  }

  // Calculate bounding box for distance search
  static getBoundingBox(lat: number, lon: number, distanceKm: number): any {
    const latDelta = distanceKm / 111; // 1 degree latitude ≈ 111 km
    const lonDelta = distanceKm / (111 * Math.cos(this.toRad(lat)));

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLon: lon - lonDelta,
      maxLon: lon + lonDelta,
    };
  }
}