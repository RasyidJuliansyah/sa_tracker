import type { LocationState } from './visit-rules'

export interface LocationFix {
  lat: number
  lng: number
  accuracy: number
}
export type LocationFailure = Exclude<LocationState, 'idle' | 'loading' | 'ok'>

/** Ambil lokasi dari browser. Gagal dengan salah satu dari denied, unavailable, timeout. */
export function getLocation(timeoutMs = 10_000): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject('unavailable' satisfies LocationFailure)
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => reject((e.code === e.PERMISSION_DENIED ? 'denied' : e.code === e.TIMEOUT ? 'timeout' : 'unavailable') satisfies LocationFailure),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    )
  })
}
