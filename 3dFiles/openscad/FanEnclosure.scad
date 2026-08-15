/*
 * Parametric sketch of a fan enclosure: a motor hub, a propeller guard ring connected to
 * the hub by spokes, and a flat ziptie-mount tab.
 *
 * This is a rough structural sketch, NOT dimensionally matched to the existing hand-modeled
 * Fusion 360 parts in 3dFiles/ - the numbers below (wall thicknesses, tab size, hub height)
 * are guesses. Measure the real parts (calipers, or open one of the existing STLs) and
 * correct the defaults before trusting a print of this.
 *
 * Usage:
 *   Open directly in the OpenSCAD GUI to tweak parameters with the Customizer, or render
 *   headlessly with overrides, e.g.:
 *     openscad -o out.stl -D motorDiameter=8.5 -D propDiameter=55 -D bottleDiameter=63 FanEnclosure.scad
 */

// --- Parameters (override with -D on the CLI, or the Customizer in the GUI) ---

motorDiameter = 8.5;   // mm - motor can diameter (from docs/materials/motorsAndProps.csv) (adjustable)
motorAxleLength = 6;
motorMountDepth = 10;  // mm - how far the motor is held/gripped by the hub
propDiameter = 55;     // mm - propeller diameter (adjustable)
bottleDiameter = 63;   // mm - bottle diameter near the neck, where the real mount actually sits
                       // (see note below) - PLACEHOLDER, measure per bottle size (adjustable)

hubClearance = 0.6;    // mm - extra radius so the motor is a friction/glue fit, not press-fit
hubWallThickness = 2.4; // mm
guardClearance = 3;    // mm - gap between prop tip and the inside of the guard ring
guardThickness = 2;    // mm - guard ring cross-section thickness

spokeWidth = 3;

// Mount tab: the bottom mount is cut by the bottle
tabThickness = 2;       // mm
zipTieSlotThickness = 2.6;
zipTieSlotLength = 10;

$fn = 64; // smoothness for circles/cylinders - lower for faster preview renders

// --- Derived dimensions ---

spokeCount = propDiameter > 55 ? 5 : 3;

minPartHeight = motorMountDepth + motorAxleLength + 1;
partHeight = minPartHeight + 5;

hubOuterRadius = motorDiameter / 2 + hubClearance + hubWallThickness;
guardInnerRadius = propDiameter / 2 + guardClearance;
guardOuterRadius = guardInnerRadius + guardThickness;

blockLength = guardOuterRadius + tabThickness + tabThickness + bottleDiameter / 2;
blockWidth = 2 * guardOuterRadius;

module motor_hub() {
  difference() {
    cylinder(h = motorMountDepth, r = hubOuterRadius);
    translate([0, 0, -1])
      cylinder(h = motorMountDepth + tabThickness, r = motorDiameter / 2 + hubClearance);
  }
}

module guard_ring() {
  difference() {
    cylinder(h = partHeight, r = guardOuterRadius);
    translate([0, 0, -1])
      cylinder(h = partHeight + 2, r = guardInnerRadius);
  }
}

module spokes() {
  for (i = [0 : spokeCount - 1]) {
    rotate([0, 0, i * 360 / spokeCount])
      translate([hubOuterRadius - 0.5, -spokeWidth / 2, 0])
        cube([guardInnerRadius - hubOuterRadius + 1, spokeWidth, motorMountDepth]);
  }
}

module holder(){
  blockLength = guardOuterRadius + tabThickness + zipTieSlotThickness + bottleDiameter / 2;
  blockWidth = 2 * guardOuterRadius;

  difference(){
  difference(){
    translate([0, -blockWidth / 2, 0])
      cube([blockLength, blockWidth, partHeight]);
    translate([blockLength, 0, -1])
      cylinder(h = partHeight + 2, r = bottleDiameter / 2);
  };
      translate([0, 0, -1])
      cylinder(h = partHeight + 2, r = guardInnerRadius);
  }
  }

module slant_cutter() {
  angle = atan((partHeight - minPartHeight) / (2 * guardOuterRadius));
  translate([-guardOuterRadius, guardOuterRadius, minPartHeight])
    rotate([angle, 0, 270])
      cube([guardOuterRadius * 2, guardOuterRadius * 4, guardOuterRadius * 2]);
}

module bottom_cutter(){
  cutDistance = (bottleDiameter / 2) * 0.3;
  color([1, 0, 0])
    translate([(guardOuterRadius+bottleDiameter/2 + 2 + zipTieSlotThickness - cutDistance), -guardOuterRadius, 0])
      cube([(bottleDiameter / 2) * 0.5, guardOuterRadius * 2, partHeight]);
}

module ziptie_ring() {
  zipTieInnerRadius = bottleDiameter / 2 + 2;
  zipTieOuterRadius = zipTieInnerRadius + zipTieSlotThickness;

  color([0, 0, 0])
    translate([blockLength, 0, (partHeight-zipTieSlotLength) / 2])
      difference() {
        cylinder(h = zipTieSlotLength, r = zipTieOuterRadius);
        translate([0, 0, -1])
          cylinder(h = zipTieSlotLength + 2, r = zipTieInnerRadius);
      }
}

module debug_point() {
  translate([-guardOuterRadius, -guardOuterRadius, minPartHeight])
    sphere(r = 2, $fn = 16);
}

module bottle() {
  color([0.2, 0.5, 0.8])
    translate([blockLength, 0, 0])
      cylinder(h = partHeight * 1.5, r = bottleDiameter / 2);
}

module fan_enclosure() {
  //ziptie_ring();

  difference(){
  difference(){
  difference() {
    union() {
      motor_hub();
      guard_ring();
      spokes();
      holder();
    }
    slant_cutter();
    }
    ziptie_ring();
  }
  bottom_cutter();
  }
  //bottle();
}

fan_enclosure();
