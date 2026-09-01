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

spokeWidth = 1.6;

// Mount tab: the bottom mount is cut by the bottle
tabThickness = 2;       // mm
zipTieSlotThickness = 2.6;
zipTieSlotLength = 10;

// Foot: the block bridging the guard ring to the bottle tapers down from
// the full guard-ring width to a narrower, shorter foot near the bottle,
// via a smooth rounded taper (hull of two different-sized cylinders).
taperLength = 18;    // mm - length of the rounded taper from the ring down to the foot (adjustable)
footWidth = 40;      // mm - width of the straight foot section near the bottle (adjustable)

// Fillet: rounds off the sharp inside corners where the spokes meet the
// hub and the guard ring, for stress relief.
filletRadius = 2;    // mm - radius rounding off the spoke junctions (adjustable)

$fn = 64; // smoothness for circles/cylinders - lower for faster preview renders

// --- Derived dimensions ---

spokeCount = propDiameter > 55 ? 5 : 3;

minPartHeight = motorMountDepth + motorAxleLength + 1;
partHeight = minPartHeight + 5;

hubOuterRadius = motorDiameter / 2 + hubClearance + hubWallThickness;
guardInnerRadius = propDiameter / 2 + guardClearance;
guardOuterRadius = guardInnerRadius + guardThickness;

zipTieInnerRadius = bottleDiameter / 2 + 2;
zipTieOuterRadius = zipTieInnerRadius + zipTieSlotThickness;

blockLength = guardOuterRadius + tabThickness + zipTieSlotThickness + bottleDiameter / 2;
footHalfWidth = footWidth / 2;
minFootLength = tabThickness + zipTieSlotThickness; // mm - always leave at least this much straight foot before the bottle cutout
taper = min(taperLength, blockLength - minFootLength);

spokeLength = guardInnerRadius - hubOuterRadius + 1;
fillet = min(filletRadius, hubOuterRadius / 2, guardInnerRadius / 2); // clamp to something sane relative to the hub/ring

module guard_ring() {
  difference() {
    cylinder(h = partHeight, r = guardOuterRadius);
    translate([0, 0, -1])
      cylinder(h = partHeight + 2, r = guardInnerRadius);
  }
}

function normAngle(a) = a < 0 ? a + 360 : a;
function shortSweep(a1, a2) =
  let(d = normAngle(a2) - normAngle(a1))
  d > 180 ? d - 360 : (d < -180 ? d + 360 : d);

// The exact circular fillet arc that rounds the concave corner where a
// flat spoke edge (the line y = side*spokeHalf) meets a circle of the
// given radius centered on the origin - built as an explicit polygon
// (vertex -> fillet arc -> circle arc) rather than a boolean trim, since
// offset()/intersection-based trims proved numerically unreliable on this
// shape. `outside` picks which side of that circle the fillet sits on:
// true for a fillet bulging out from a solid disk (the hub), false for one
// tucked just inside a bore (the guard ring's inner surface).
module concave_fillet(circleRadius, spokeHalf, filletR, side, outside, segs = 16) {
  cy = side * (spokeHalf + filletR);
  d = outside ? circleRadius + filletR : circleRadius - filletR;
  cx = sqrt(max(d * d - cy * cy, 0));

  vx = sqrt(max(circleRadius * circleRadius - spokeHalf * spokeHalf, 0));
  vy = side * spokeHalf;

  angleToCenter = atan2(cy, cx);
  ctx = circleRadius * cos(angleToCenter);
  cty = circleRadius * sin(angleToCenter);

  angLine = atan2(-side * filletR, 0); // the line-tangent point sits directly below/above the fillet center
  angCircle = atan2(cty - cy, ctx - cx);
  sweep1 = shortSweep(angLine, angCircle);
  arcPoints = [for (i = [0 : segs])
    let(a = angLine + sweep1 * i / segs)
    [cx + filletR * cos(a), cy + filletR * sin(a)]
  ];

  angVertexOnCircle = atan2(vy, vx);
  angTangentOnCircle = atan2(cty, ctx);
  sweep2 = shortSweep(angTangentOnCircle, angVertexOnCircle);
  circleArcPoints = [for (i = [0 : segs])
    let(a = angTangentOnCircle + sweep2 * i / segs)
    [circleRadius * cos(a), circleRadius * sin(a)]
  ];

  polygon(points = concat([[vx, vy]], arcPoints, circleArcPoints));
}

// A spoke with a true rounded fillet at each of its four corners: two
// where it meets the hub, two where it meets the guard ring's inner
// surface.
module spoke() {
  spokeHalf = spokeWidth / 2;
  union() {
    translate([hubOuterRadius - 0.5, -spokeHalf])
      square([spokeLength, spokeWidth]);
    concave_fillet(hubOuterRadius, spokeHalf, fillet, 1, true);
    concave_fillet(hubOuterRadius, spokeHalf, fillet, -1, true);
    concave_fillet(guardInnerRadius, spokeHalf, fillet, 1, false);
    concave_fillet(guardInnerRadius, spokeHalf, fillet, -1, false);
  }
}

module hub_and_spokes() {
  difference() {
    linear_extrude(height = motorMountDepth)
      union() {
        circle(r = hubOuterRadius);
        for (i = [0 : spokeCount - 1])
          rotate([0, 0, i * 360 / spokeCount])
            spoke();
      }
    translate([0, 0, -1])
      cylinder(h = motorMountDepth + tabThickness, r = motorDiameter / 2 + hubClearance);
  }
}

module holder(){
  difference(){
    union(){
      hull(){
        cylinder(h = partHeight, r = guardOuterRadius);
        translate([taper, 0, 0])
          cylinder(h = partHeight, r = footHalfWidth);
      }
      translate([taper, -footHalfWidth, 0])
        cube([blockLength - taper, 2 * footHalfWidth, partHeight]);
    }
    translate([blockLength, 0, -1])
      cylinder(h = partHeight + 2, r = bottleDiameter / 2);
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
      hub_and_spokes();
      guard_ring();
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
