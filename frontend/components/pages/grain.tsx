"use client";
import { useState } from "react";
import { AudioLines, Upload, Thermometer, Wind, Droplets } from "lucide-react";
import { useDashboard } from "@/components/dashboard-provider";
import { EmptyState, SensorCard, StatusBadge } from "@/components/cards";
import { PageHeading } from "@/components/page-heading";
export default function Grain() {
  const { data, error, sampleId, setSampleId } = useDashboard();
  const [file, setFile] = useState("");
  const [fileError, setFileError] = useState("");
  if (!data)
    return <EmptyState message={error || "Loading storage examples…"} />;
  const sample = data.storageSamples.find((s) => s.id === sampleId)!;
  return (
    <>
      <PageHeading
        eyebrow="PROTECT YOUR HARVEST"
        title="Listen. Inspect. Protect."
        description="Explore how audio and storage conditions can inform a grain inspection."
      />
      <div className="two-column grain-grid">
        <section className="panel">
          <div className="section-heading">
            <h2>
              <AudioLines size={21} />
              Grain audio
            </h2>
            <span className="pill neutral">Demo samples</span>
          </div>
          <label>
            Choose an example result
            <select
              value={sampleId}
              onChange={(event) => {
                setSampleId(event.target.value);
                setFile("");
                setFileError("");
              }}
            >
              {data.storageSamples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="waveform" aria-hidden="true">
            {Array.from({ length: 45 }, (_, i) => (
              <span
                key={i}
                style={{ height: `${12 + Math.abs(Math.sin(i * 1.7)) * 54}%` }}
              />
            ))}
          </div>
          <p className="muted small">
            Illustrative waveform · No audio recording is being played.
          </p>
          <label className="upload-zone">
            <Upload size={24} />
            <strong>Select your own audio</strong>
            <span>WAV or MP3 · Up to 10 MB</span>
            <input
              aria-label="Select grain audio file"
              type="file"
              accept=".wav,.mp3,audio/wav,audio/mpeg"
              onChange={(e) => {
                const chosen = e.target.files?.[0];
                if (!chosen) return;
                if (
                  chosen.size > 10 * 1024 * 1024 ||
                  !/\.(wav|mp3)$/i.test(chosen.name)
                ) {
                  setFileError("Choose a WAV or MP3 file smaller than 10 MB.");
                  setFile("");
                  e.target.value = "";
                  return;
                }
                setFile(
                  `${chosen.name} · ${(chosen.size / 1024).toFixed(0)} KB`,
                );
                setFileError("");
              }}
            />
          </label>
          {fileError && (
            <p role="alert" className="error">
              {fileError}
            </p>
          )}
          {file && (
            <div role="status" className="inline-feedback">
              <strong>{file}</strong>
              <p>
                Selected locally. Audio analysis is not connected; no insect
                result has been generated for this file.
              </p>
            </div>
          )}
        </section>
        <section className="panel storage-result">
          <div className="section-heading">
            <h2>Example acoustic result</h2>
            <AudioLines size={22} />
          </div>
          <StatusBadge tone={sample.risk}>{sample.activity}</StatusBadge>
          <div className="confidence-value">
            {sample.acousticConfidence === null
              ? "—"
              : `${sample.acousticConfidence}%`}
          </div>
          <p>Mock acoustic confidence · Not evaluated</p>
          <div className="result-divider" />
          <h3>Overall storage risk</h3>
          <StatusBadge tone={sample.risk}>
            {sample.risk === "urgent"
              ? "High · Inspect soon"
              : sample.risk === "warning"
                ? "Needs a closer look"
                : "Low in this example"}
          </StatusBadge>
          <p>
            Storage risk considers the sample result and environmental
            conditions. It is separate from acoustic confidence.
          </p>
          <div className="action-note">
            <strong>Recommended action</strong>
            <p>{sample.action}</p>
          </div>
        </section>
      </div>
      <div className="three-column">
        <SensorCard
          title="Storage temperature"
          value={`${sample.temperature}°C`}
          detail="Mock storage conditions"
          icon={Thermometer}
        />
        <SensorCard
          title="Storage humidity"
          value={`${sample.humidity}%`}
          detail="Mock relative humidity"
          icon={Wind}
          tone={sample.risk}
        />
        <SensorCard
          title="Grain moisture"
          value={`${sample.moisture}%`}
          detail="Mock grain moisture content"
          icon={Droplets}
          tone={sample.risk}
        />
      </div>
    </>
  );
}
