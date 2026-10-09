"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Droplets, MapPin, Thermometer } from "lucide-react";
import {
  aggregateFieldStatus,
  deriveIllustrativeZones,
  FIELD_ZONE_COLORS,
  type FieldZoneStatus,
} from "@/services/field-zone-model";
import type { FarmProfile } from "@/types/farm-profile";
import type { SensorReading } from "@/types/sensor";

const statuses: FieldZoneStatus[] = [
  "Healthy",
  "Monitor",
  "Stress",
  "Critical",
  "Sensor Issue",
  "Awaiting Data",
];

function farmContext(farm: FarmProfile | null) {
  return [
    farm?.area_acres != null
      ? `${Number(farm.area_acres.toFixed(2))} acres`
      : null,
    farm?.current_crop || null,
    farm?.location_name || null,
  ].filter(Boolean);
}

export function FieldZoneMap({
  farm,
  readings,
}: {
  farm: FarmProfile | null;
  readings: SensorReading[];
}) {
  const zones = useMemo(() => deriveIllustrativeZones(readings), [readings]);
  const [selectedId, setSelectedId] = useState("zone-a");
  useEffect(() => setSelectedId("zone-a"), [farm?.id]);
  const selected = zones.find((zone) => zone.id === selectedId) || zones[0];
  const overall = aggregateFieldStatus(zones);
  const context = farmContext(farm);

  return (
    <section className="field-zone-card" aria-labelledby="field-zone-title">
      <div className="field-zone-heading">
        <div>
          <span className="field-zone-kicker">Illustrative zone model</span>
          <h2 id="field-zone-title">{farm?.name || "Selected farm"}</h2>
          <p>
            {context.length ? context.join(" · ") : "Farm context unavailable"}
          </p>
        </div>
        <div
          className={`field-overall field-overall-${overall.label.toLowerCase().replace(" ", "-")}`}
        >
          <small>FIELD STATUS</small>
          <strong>{overall.label}</strong>
        </div>
      </div>

      <div className="field-zone-layout">
        <div className="field-zone-visual">
          <svg
            viewBox="0 0 760 370"
            role="img"
            aria-label={`Illustrative zone map for ${farm?.name || "selected farm"}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <pattern
                id="field-lines"
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(12)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="16"
                  stroke="rgba(255,255,255,.2)"
                  strokeWidth="3"
                />
              </pattern>
              <filter
                id="field-shadow"
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
              >
                <feDropShadow
                  dx="0"
                  dy="5"
                  stdDeviation="7"
                  floodColor="#294332"
                  floodOpacity=".16"
                />
              </filter>
            </defs>
            <path
              className="field-boundary"
              d="M18 22 L248 7 L497 24 L740 13 L724 344 L493 357 L247 360 L13 336 Z"
            />
            {zones.map((zone) => (
              <g
                key={zone.id}
                className={`field-zone ${selected?.id === zone.id ? "is-selected" : ""}`}
                role="button"
                tabIndex={0}
                data-zone-id={zone.id}
                data-zone-status={zone.status}
                aria-label={`${zone.label}, ${zone.status}${zone.moisture == null ? "" : `, soil moisture ${zone.moisture}%`}`}
                aria-pressed={selected?.id === zone.id}
                onClick={() => setSelectedId(zone.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(zone.id);
                  }
                }}
              >
                <path
                  d={zone.path}
                  fill={FIELD_ZONE_COLORS[zone.status]}
                  filter="url(#field-shadow)"
                />
                <path d={zone.path} fill="url(#field-lines)" />
                <text x={zone.labelX} y={zone.labelY} textAnchor="middle">
                  {zone.label.replace("Zone ", "")}
                </text>
              </g>
            ))}
          </svg>
          <div
            className="field-zone-legend"
            aria-label="Field zone status legend"
          >
            {statuses.map((status) => (
              <span key={status}>
                <i style={{ background: FIELD_ZONE_COLORS[status] }} />
                {status}
              </span>
            ))}
          </div>
        </div>

        <aside className="field-zone-details" aria-live="polite">
          {selected && (
            <>
              <div className="field-zone-detail-title">
                <div>
                  <small>SELECTED PARCEL</small>
                  <h3>{selected.label}</h3>
                </div>
                <span style={{ color: FIELD_ZONE_COLORS[selected.status] }}>
                  <i
                    style={{ background: FIELD_ZONE_COLORS[selected.status] }}
                  />
                  {selected.status}
                </span>
              </div>
              <div className="field-zone-values">
                <div>
                  <Droplets size={17} />
                  <span>Soil Moisture</span>
                  <strong>
                    {selected.moisture == null ? "--" : `${selected.moisture}%`}
                  </strong>
                  {selected.sensorQuality != null &&
                    selected.sensorQuality !== "healthy" && (
                      <em>⚠ Unreliable reading</em>
                    )}
                </div>
                <div>
                  <Thermometer size={17} />
                  <span>Temperature</span>
                  <strong>
                    {selected.temperature == null
                      ? "--"
                      : `${selected.temperature}°C`}
                  </strong>
                </div>
                <div>
                  <Activity size={17} />
                  <span>Humidity</span>
                  <strong>
                    {selected.humidity == null ? "--" : `${selected.humidity}%`}
                  </strong>
                </div>
                <div>
                  <MapPin size={17} />
                  <span>Sensor Quality</span>
                  <strong>
                    {selected.sensorQuality == null
                      ? "--"
                      : selected.sensorQuality === "healthy"
                        ? "Healthy"
                        : "Needs verification"}
                  </strong>
                </div>
              </div>
              <dl className="field-zone-guidance">
                <div>
                  <dt>Reason</dt>
                  <dd>{selected.reason}</dd>
                </div>
                <div>
                  <dt>Recommended action</dt>
                  <dd>{selected.action}</dd>
                </div>
                <div>
                  <dt>When</dt>
                  <dd>{selected.timing}</dd>
                </div>
              </dl>
              <p className="field-zone-updated">
                Last updated{" "}
                {selected.lastUpdated
                  ? new Date(selected.lastUpdated).toLocaleString()
                  : "--"}
              </p>
            </>
          )}
        </aside>
      </div>

      <p className="field-zone-method">
        Zone values are deterministic estimates from the current field stream;
        they do not represent six physical sensors, GPS measurements, or
        satellite data.
      </p>
      <p className="field-zone-overall-detail">{overall.detail}</p>
    </section>
  );
}
