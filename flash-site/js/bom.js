/*
 * Composes the displayed BOM by merging common + bottle + driver + motor + prop + derived
 * power/BMS parts for a selection. Grouping mirrors docs/materials/BOM.md's sections.
 */

function addParts(bucket, list, section) {
  for (const part of list ?? []) {
    if (bucket.has(part.id)) {
      console.warn(`bom.js: duplicate part id "${part.id}" - later entry overwrites the earlier one`);
    }
    bucket.set(part.id, { ...part, section });
  }
}

/** selection: { bottle, driver, motor, prop } -> array of { id, name, qty, section, note? } */
export function composeBom(data, selection) {
  const bottle = data.bottles[selection.bottle];
  const driver = data.drivers[selection.driver];
  const motor = data.motors[selection.motor];
  const prop = data.props[selection.prop];

  const parts = new Map();

  addParts(parts, data.commonElectronicsParts, "Electronics");
  addParts(parts, data.commonHardwareParts, "Hardware");
  addParts(parts, bottle?.parts, "Hardware");
  addParts(parts, driver?.parts, "Motors and Drivers");
  addParts(parts, motor?.parts, "Motors and Drivers");
  addParts(parts, prop?.parts, "Motors and Drivers");

  if (motor) {
    const powerSection = motor.highCurrent ? data.power.highCurrent : data.power.lowCurrent;
    addParts(parts, powerSection.parts, "Power Supply");
  }

  return [...parts.values()];
}

const SECTION_ORDER = ["Electronics", "Motors and Drivers", "Power Supply", "Hardware"];

/** Groups composeBom()'s flat list into { section, parts }[] in a fixed, stable display order. */
export function groupBomBySection(bomParts) {
  return SECTION_ORDER.map((section) => ({
    section,
    parts: bomParts.filter((part) => part.section === section),
  })).filter((group) => group.parts.length > 0);
}
