import assert from "node:assert/strict";
import { needsInspectionImage } from "./property-image-service.ts";

const request = {
  id: "maintenance-test",
  property: "Maple Court, unit 4B",
  issue: "loose bathroom tile",
  tenantDocument: "lease-4B.pdf",
  inspectionDue: "2026-11-18",
};

assert.equal(needsInspectionImage(request), true);
assert.equal(needsInspectionImage({ ...request, issue: "", inspectionDue: "2026-11-18" }), false);
assert.equal(needsInspectionImage({ ...request, inspectionDue: "2027-01-02" }), false);
console.log("inspection image decision: passed");
