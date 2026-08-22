import { useEffect, useRef, useState } from "react";

type LatLng = [number, number];

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/** أقرب مسافة (بالمتر تقريبًا) من نقطة لأقرب segment على خط المسار */
function distanceToRoute(point: LatLng, route: LatLng[]): number {
  if (route.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const d = distanceToSegment(point, route[i], route[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

// تحويل تقريبي من فرق إحداثيات لمتر (كافي لمسافات قصيرة داخل المدينة)
function toMeters(a: LatLng, b: LatLng): [number, number] {
  const latMid = ((a[0] + b[0]) / 2) * (Math.PI / 180);
  const dLat = (b[0] - a[0]) * 111320;
  const dLng = (b[1] - a[1]) * 111320 * Math.cos(latMid);
  return [dLat, dLng];
}

function distanceToSegment(p: LatLng, a: LatLng, b: LatLng): number {
  const [pyx, pyy] = toMeters(a, p);
  const [bx, by] = toMeters(a, b);
  const segLenSq = bx * bx + by * by;
  if (segLenSq === 0) return Math.hypot(pyx, pyy);
  let t = (pyx * bx + pyy * by) / segLenSq;
  t = Math.max(0, Math.min(1, t));
  const projx = t * bx;
  const projy = t * by;
  return Math.hypot(pyx - projx, pyy - projy);
}

async function fetchOsrmRoute(
  from: LatLng,
  to: LatLng,
): Promise<LatLng[] | null> {
  try {
    const url = `${OSRM_BASE}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates as
      | [number, number][]
      | undefined;
    if (!coords) return null;
    return coords.map(([lng, lat]) => [lat, lng] as LatLng);
  } catch {
    return null;
  }
}

const OFF_ROUTE_THRESHOLD_M = 45; // حساس بدرجة كافية داخل المدينة، مش حساس زيادة لضجيج الـ GPS
const REROUTE_COOLDOWN_MS = 8000; // ما نعيد الحساب أكثر من مرة كل 8 ثواني

export function useAutoReroute(
  navMode: boolean,
  userPos: LatLng | null,
  destination: LatLng | null,
  initialRoute: LatLng[] | null,
) {
  const [route, setRoute] = useState<LatLng[] | null>(initialRoute);
  const lastRerouteAt = useRef(0);
  const rerouting = useRef(false);

  // لما يبلش navMode جديد أو الوجهة تتغير، رجّع للمسار الأساسي
  useEffect(() => {
    setRoute(initialRoute);
  }, [initialRoute, destination]);

  useEffect(() => {
    if (!navMode || !userPos || !destination || !route) return;

    const dist = distanceToRoute(userPos, route);
    if (dist <= OFF_ROUTE_THRESHOLD_M) return;

    const now = Date.now();
    if (rerouting.current || now - lastRerouteAt.current < REROUTE_COOLDOWN_MS)
      return;

    rerouting.current = true;
    lastRerouteAt.current = now;
    fetchOsrmRoute(userPos, destination).then((newRoute) => {
      rerouting.current = false;
      if (newRoute) setRoute(newRoute);
    });
  }, [navMode, userPos, destination, route]);

  return route;
}
