"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFarm } from "@/components/farm-provider";
import { PageHeading } from "@/components/page-heading";
import { FarmApiError } from "@/services/farms";
import type { FarmProfile, FarmProfileInput } from "@/types/farm-profile";

type Field = { key: keyof FarmProfileInput; label: string; type?: "number" | "date"; min?: number; max?: number; options?: string[]; required?: boolean };
const sections: { title: string; fields: Field[] }[] = [
  { title: "Farm Identity", fields: [{ key: "name", label: "Farm name", required: true }, { key: "farmer_name", label: "Farmer name" }] },
  { title: "Location", fields: [{ key: "location_name", label: "Location name" }, { key: "district", label: "District" }, { key: "state", label: "State" }, { key: "latitude", label: "Latitude", type: "number", min: -90, max: 90 }, { key: "longitude", label: "Longitude", type: "number", min: -180, max: 180 }] },
  { title: "Farm Details", fields: [{ key: "area_acres", label: "Area (acres)", type: "number", min: 0.000001, max: 1000000 }, { key: "soil_type", label: "Soil type", options: ["Clay", "Loamy", "Sandy", "Silty", "Black", "Red", "Alluvial", "Other"] }, { key: "soil_ph", label: "Soil pH", type: "number", min: 0, max: 14 }, { key: "nitrogen", label: "Nitrogen (kg/ha)", type: "number", min: 0 }, { key: "phosphorus", label: "Phosphorus (kg/ha)", type: "number", min: 0 }, { key: "potassium", label: "Potassium (kg/ha)", type: "number", min: 0 }] },
  { title: "Crop Details", fields: [{ key: "current_crop", label: "Current crop" }, { key: "crop_variety", label: "Variety" }, { key: "sowing_date", label: "Sowing date", type: "date" }] },
  { title: "Resources", fields: [{ key: "irrigation_type", label: "Irrigation type", options: ["Borewell", "Drip", "Canal", "Sprinkler", "Rainfed", "Other"] }, { key: "water_availability", label: "Available water (m³)", type: "number", min: 0 }, { key: "budget", label: "Budget (₹)", type: "number", min: 0 }] },
];
type Values = Record<keyof FarmProfileInput, string>;
function valuesFor(farm: FarmProfile | null): Values {
  return Object.fromEntries(sections.flatMap(section => section.fields).map(field => [field.key, farm?.[field.key] == null ? "" : String(farm[field.key])])) as Values;
}
function Editor({ farm, onSaved, onCancel }: { farm: FarmProfile | null; onSaved: () => void; onCancel: () => void }) {
  const { saveFarm, saving } = useFarm();
  const [values, setValues] = useState<Values>(() => valuesFor(farm));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const found: Record<string, string> = {};
    const data: Record<string, string | number | null> = {};
    for (const { fields } of sections) for (const field of fields) {
      const value = values[field.key].trim();
      data[field.key] = value === "" ? null : field.type === "number" ? Number(value) : value;
      if (field.required && !value) found[field.key] = "Farm name is required.";
      if (value && field.type === "number") {
        const number = Number(value);
        if (!Number.isFinite(number) || (field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max)) found[field.key] = "Enter a value within the allowed range.";
      }
    }
    if (Boolean(values.latitude.trim()) !== Boolean(values.longitude.trim())) {
      found.latitude = found.longitude = "Enter both coordinates, or leave both blank.";
    }
    setErrors(found);
    if (Object.keys(found).length) { setMessage("Please check the highlighted fields."); return; }
    try {
      await saveFarm(data as unknown as FarmProfileInput, farm?.id);
      setDirty(false); onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save farm. Please try again.");
      if (error instanceof FarmApiError) setErrors(error.fields);
    }
  }
  return <form onSubmit={submit} className="farm-profile-form">
    <p className="muted">Only farm name is required. Add both coordinates for local weather.</p>
    {sections.map(section => <fieldset className="panel farm-profile-section" key={section.title} disabled={saving}>
      <legend>{section.title}</legend>
      <div className="farm-profile-grid">{section.fields.map(field => <label key={field.key} htmlFor={`farm-${field.key}`}>
        {field.label}{field.required ? " *" : ""}
        {field.options ? <select id={`farm-${field.key}`} value={values[field.key]} onChange={event => { setValues({ ...values, [field.key]: event.target.value }); setDirty(true); }} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `error-${field.key}` : undefined}>
          <option value="">Not specified</option>
          {values[field.key] && !field.options.includes(values[field.key]) && <option>{values[field.key]}</option>}
          {field.options.map(option => <option key={option}>{option}</option>)}
        </select> : <input id={`farm-${field.key}`} type={field.type || "text"} required={field.required} min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined} maxLength={field.key === "location_name" ? 200 : 100} value={values[field.key]} onChange={event => { setValues({ ...values, [field.key]: event.target.value }); setDirty(true); }} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `error-${field.key}` : undefined} />}
        {errors[field.key] && <span className="farm-field-error" id={`error-${field.key}`}>{errors[field.key]}</span>}
      </label>)}</div>
    </fieldset>)}
    {message && <p role="alert" className="farm-field-error">{message}{errors.form ? ` ${errors.form}` : ""}</p>}
    <div className="farm-profile-actions">
      <button className="button" disabled={saving} type="submit">{saving ? "Saving…" : farm ? "Save changes" : "Create farm"}</button>
      <button className="button outline" disabled={saving} type="button" onClick={() => { setValues(valuesFor(farm)); setErrors({}); setMessage(""); setDirty(false); onCancel(); }}>Cancel</button>
      <span className="muted" aria-live="polite">{saving ? "Saving to database…" : dirty ? "Unsaved changes" : ""}</span>
    </div>
  </form>;
}
export function FarmProfilePage({ initialCreate = false }: { initialCreate?: boolean }) {
  const { farms, selectedFarm, selectFarm, status, error, reloadFarms, saving } = useFarm();
  const [creating, setCreating] = useState(initialCreate);
  const [saved, setSaved] = useState(false);
  const newFarm = creating || (status === "ready" && !farms.length);
  return <>
    <PageHeading eyebrow="YOUR FARM" title={newFarm ? "Farm Setup" : "Edit Farm Profile"} description="Your farm details, saved for the decisions ahead." />
    {status === "loading" ? <section className="panel" role="status">Loading farm profiles…</section> : status === "error" ? <section className="panel"><p role="alert">{error}</p><button className="button" onClick={reloadFarms}>Try again</button></section> : <>
      <div className="panel farm-profile-toolbar">
        <label htmlFor="profile-farm-selector">Selected farm<select id="profile-farm-selector" disabled={saving || !farms.length} value={selectedFarm?.id || ""} onChange={event => { selectFarm(event.target.value); setCreating(false); setSaved(false); }}>
          {!farms.length && <option value="">No farms yet</option>}
          {farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}{farm.location_name ? ` · ${farm.location_name}` : ""}</option>)}
        </select></label>
        <button className="button outline" disabled={saving || newFarm} onClick={() => { setCreating(true); setSaved(false); }}>Add farm</button>
        <Link href="/overview" className="text-button">Back to overview →</Link>
      </div>
      {saved && <p className="inline-feedback" role="status">Farm profile saved. Weather uses the selected farm’s coordinates.</p>}
      <Editor key={newFarm ? "new" : selectedFarm?.id} farm={newFarm ? null : selectedFarm} onSaved={() => { setCreating(false); setSaved(true); }} onCancel={() => { setCreating(false); setSaved(false); }} />
    </>}
  </>;
}
