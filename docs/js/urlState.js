/*
 * Syncs the Variant selection with the page URL's query string, so a specific combo can be
 * bookmarked/shared (e.g. `?bottle=05L&driver=drv8833&motor=8520&prop=55mm`). Tolerant of
 * partial URLs - any axis missing or invalid falls back to VARIANT_DATA.defaultVariant.
 */

const AXES = ["bottle", "driver", "motor", "prop"];
const AXIS_TO_DATA_KEY = { bottle: "bottles", driver: "drivers", motor: "motors", prop: "props" };

/** Reads the current selection from location.search, filling gaps from data.defaultVariant. */
export function readSelectionFromUrl(data) {
  const params = new URLSearchParams(window.location.search);
  const selection = {};

  for (const axis of AXES) {
    const value = params.get(axis);
    const validOptions = data[AXIS_TO_DATA_KEY[axis]];
    selection[axis] = value && validOptions[value] ? value : data.defaultVariant[axis];
  }

  return selection;
}

/** Writes selection into the URL without pushing a new history entry (no back-button spam). */
export function writeSelectionToUrl(selection) {
  const params = new URLSearchParams();
  for (const axis of AXES) {
    params.set(axis, selection[axis]);
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}
