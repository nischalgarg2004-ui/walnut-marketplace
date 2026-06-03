import raw from "@/data/india-state-districts.json";

export const INDIA_GEO_DATASET_VERSION = "india-state-districts@1.8.0";

export type IndiaStateOption = { id: string; name: string };
export type IndiaDistrictOption = { id: string; name: string; stateId: string };

type Region = { name: string; districts: string[] };

function slugPart(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function build() {
  const data = raw as { states: Region[]; union_territories: Region[] };
  const regions: Region[] = [...data.states, ...data.union_territories];
  const stateIdSet = new Set<string>();
  const districtIdSet = new Set<string>();
  const states: IndiaStateOption[] = [];
  const districtsByState = new Map<string, IndiaDistrictOption[]>();
  const districtToState = new Map<string, string>();

  for (const r of regions) {
    const stateId = `in-st-${slugPart(r.name)}`;
    if (stateIdSet.has(stateId)) continue;
    stateIdSet.add(stateId);
    states.push({ id: stateId, name: r.name });
    const list: IndiaDistrictOption[] = [];
    for (const d of r.districts) {
      const districtId = `in-dist-${slugPart(r.name)}--${slugPart(d)}`;
      if (districtIdSet.has(districtId)) continue;
      districtIdSet.add(districtId);
      const row = { id: districtId, name: d, stateId };
      list.push(row);
      districtToState.set(districtId, stateId);
    }
    districtsByState.set(stateId, list);
  }

  return { states, districtsByState, districtToState };
}

const built = build();

export const INDIA_STATES: IndiaStateOption[] = built.states;

export function getDistrictsForState(stateId: string): IndiaDistrictOption[] {
  return built.districtsByState.get(stateId) ?? [];
}

export function isValidIndiaStateId(id: string | null | undefined): boolean {
  if (!id) return false;
  return built.districtsByState.has(id);
}

export function isValidIndiaDistrictId(id: string | null | undefined): boolean {
  if (!id) return false;
  return built.districtToState.has(id);
}

export function districtBelongsToState(districtId: string, stateId: string): boolean {
  return built.districtToState.get(districtId) === stateId;
}

export function parseAllowedDistrictIds(ids: string[]): string[] {
  return ids.filter((id) => isValidIndiaDistrictId(id));
}

/** Flat list for multi-select search (barter campaign targeting). */
export function getAllDistrictsFlat(): IndiaDistrictOption[] {
  const out: IndiaDistrictOption[] = [];
  for (const s of INDIA_STATES) {
    out.push(...getDistrictsForState(s.id));
  }
  return out;
}
