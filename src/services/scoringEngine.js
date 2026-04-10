function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEFAULT_WEIGHTS = { w1: 1.0, w2: 2.0, w3: 1.5, w4: 3.0 };

const WEIGHT_KEY_MAP = {
  distance_to_pickup: "w1",
  extra_route_time: "w2",
  idle_time: "w3",
  lateness_risk: "w4",
};

function parseTimeWindow(tw) {
  if (!tw) return null;
  const parts = tw.split("-");
  if (parts.length !== 2) return null;
  const [startH, startM] = parts[0].split(":").map(Number);
  const [endH, endM] = parts[1].split(":").map(Number);
  if (isNaN(startH) || isNaN(endH)) return null;
  return { startMinutes: startH * 60 + (startM || 0), endMinutes: endH * 60 + (endM || 0) };
}

function estimateArrivalMinutes(driver, job) {
  const dist = haversineDistance(driver.lat, driver.lng, job.pickup_lat, job.pickup_lng);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const travelMinutes = Math.round(dist * 2.5);
  return currentMinutes + travelMinutes;
}

function layer1_candidateFilter(drivers, job) {
  const tw = parseTimeWindow(job.time_window);

  return drivers
    .filter((d) => d.status === "available")
    .filter((d) => d.vehicle_type === job.vehicle_type)
    .filter((d) => d.capacity - d.current_load >= job.weight)
    .filter((d) => {
      const dist = haversineDistance(d.lat, d.lng, job.pickup_lat, job.pickup_lng);
      return dist <= 30;
    })
    .filter((d) => {
      if (!tw) return true;
      const eta = estimateArrivalMinutes(d, job);
      return eta <= tw.endMinutes;
    });
}

function layer2_scoreDriver(driver, job, weights) {
  const w = weights || DEFAULT_WEIGHTS;
  const distance_to_pickup = haversineDistance(driver.lat, driver.lng, job.pickup_lat, job.pickup_lng);
  const routeDist = haversineDistance(job.pickup_lat, job.pickup_lng, job.dropoff_lat, job.dropoff_lng);
  const totalDist = distance_to_pickup + routeDist;
  const extra_route_time = (distance_to_pickup / totalDist) * 10;
  const idle_time = distance_to_pickup * 0.8;

  let lateness_risk = Math.min(10, distance_to_pickup * 1.2 + (driver.completedToday > 6 ? 2 : 0));
  const tw = parseTimeWindow(job.time_window);
  if (tw) {
    const eta = estimateArrivalMinutes(driver, job);
    const windowSize = tw.endMinutes - tw.startMinutes;
    const bufferRatio = Math.max(0, (tw.endMinutes - eta) / windowSize);
    lateness_risk += (1 - bufferRatio) * 3;
  }

  const priorityMultiplier = job.priority === "high" ? 1.3 : job.priority === "low" ? 0.8 : 1.0;

  const score =
    (distance_to_pickup * w.w1 +
    extra_route_time * w.w2 +
    idle_time * w.w3 +
    lateness_risk * w.w4) * priorityMultiplier;

  return {
    driver_id: driver.id,
    driver_name: driver.name,
    score: Math.round(score * 10) / 10,
    breakdown: {
      distance_to_pickup: Math.round(distance_to_pickup * 10) / 10,
      extra_route_time: Math.round(extra_route_time * 10) / 10,
      idle_time: Math.round(idle_time * 10) / 10,
      lateness_risk: Math.round(lateness_risk * 10) / 10,
    },
  };
}

function layer3_calculateMetrics(driver, job) {
  const pickupDist = haversineDistance(driver.lat, driver.lng, job.pickup_lat, job.pickup_lng);
  const routeDist = haversineDistance(job.pickup_lat, job.pickup_lng, job.dropoff_lat, job.dropoff_lng);
  const totalDist = Math.round((pickupDist + routeDist) * 10) / 10;
  const time = Math.round(totalDist * 2.2);
  const idleTime = Math.round(pickupDist * 1.5);
  const cost = Math.round(totalDist * 12 + time * 2.5);
  const efficiency = Math.max(0, Math.min(100, Math.round(100 - (pickupDist / totalDist) * 40 - (driver.completedToday > 8 ? 10 : 0))));

  return { distance: totalDist, time, idle_time: idleTime, cost, efficiency_score: efficiency };
}

export function runOptimization(drivers, job, weights) {
  const w = weights || DEFAULT_WEIGHTS;
  const candidates = layer1_candidateFilter(drivers, job);

  if (candidates.length === 0) {
    return { success: false, message: "No eligible drivers found for this job." };
  }

  const scored = candidates.map((d) => ({ ...layer2_scoreDriver(d, job, w), driver: d }));
  scored.sort((a, b) => a.score - b.score);

  const best = scored[0];
  const rejected = scored.slice(1, 4).map((s) => {
    let reason = "";
    if (s.breakdown.distance_to_pickup > best.breakdown.distance_to_pickup + 2)
      reason = `${s.breakdown.distance_to_pickup} km from pickup — significantly further than selected driver.`;
    else if (s.breakdown.lateness_risk > best.breakdown.lateness_risk + 2)
      reason = `Higher lateness risk (${s.breakdown.lateness_risk}) due to current workload.`;
    else if (s.breakdown.idle_time > best.breakdown.idle_time + 1)
      reason = `Higher idle driving time (${s.breakdown.idle_time} min) reduces efficiency.`;
    else reason = `Overall score ${s.score} is ${(s.score - best.score).toFixed(1)} points higher than selected driver.`;

    return {
      driver_id: s.driver_id,
      name: s.driver_name,
      score: s.score,
      reason,
      score_diff: Math.round((s.score - best.score) * 10) / 10,
    };
  });

  const metrics = layer3_calculateMetrics(best.driver, job);

  return {
    success: true,
    assignment: {
      driver_id: best.driver_id,
      driver_name: best.driver_name,
      job_id: job.id,
      score: best.score,
      score_breakdown: best.breakdown,
      weights: { ...w },
      explanation: {
        selected_reason: `Lowest scoring ${best.driver.vehicle_type} driver at ${best.breakdown.distance_to_pickup} km from pickup with score of ${best.score}.${job.priority === "high" ? " Priority weighting applied." : ""}`,
        distance_advantage: `${best.breakdown.distance_to_pickup} km from pickup`,
        route_efficiency_gain: `${metrics.efficiency_score}% route efficiency`,
        workload_comparison: `${best.driver.completedToday} deliveries today`,
        rejected_candidates: rejected,
      },
      metrics,
    },
  };
}

export { DEFAULT_WEIGHTS, WEIGHT_KEY_MAP };
