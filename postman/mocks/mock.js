const http = require("http");
const { URL } = require("url");

const port = process.env.PORT || 4501;

// Member lookup table keyed by memberId prefix pattern
// Maps CSV data file members to dynamic responses
const members = {
  "HCSC-IL-100001": { given: "Maria", family: "Gonzalez", state: "IL", city: "Chicago", zip: "60624", org: "bcbsil", orgName: "Blue Cross Blue Shield of Illinois" },
  "HCSC-IL-100002": { given: "James", family: "Chen", state: "IL", city: "Springfield", zip: "62701", org: "bcbsil", orgName: "Blue Cross Blue Shield of Illinois" },
  "HCSC-IL-100003": { given: "Patricia", family: "Williams", state: "IL", city: "Naperville", zip: "60540", org: "bcbsil", orgName: "Blue Cross Blue Shield of Illinois" },
  "HCSC-IL-100004": { given: "Robert", family: "Taylor", state: "IL", city: "Peoria", zip: "61602", org: "bcbsil", orgName: "Blue Cross Blue Shield of Illinois" },
  "HCSC-IL-100005": { given: "Linda", family: "Martinez", state: "IL", city: "Rockford", zip: "61101", org: "bcbsil", orgName: "Blue Cross Blue Shield of Illinois" },
  "HCSC-TX-200001": { given: "Michael", family: "Johnson", state: "TX", city: "Dallas", zip: "75201", org: "bcbstx", orgName: "Blue Cross Blue Shield of Texas" },
  "HCSC-TX-200002": { given: "Jennifer", family: "Brown", state: "TX", city: "Houston", zip: "77001", org: "bcbstx", orgName: "Blue Cross Blue Shield of Texas" },
  "HCSC-TX-200003": { given: "David", family: "Rodriguez", state: "TX", city: "San Antonio", zip: "78201", org: "bcbstx", orgName: "Blue Cross Blue Shield of Texas" },
  "HCSC-TX-200004": { given: "Sarah", family: "Davis", state: "TX", city: "Austin", zip: "73301", org: "bcbstx", orgName: "Blue Cross Blue Shield of Texas" },
  "HCSC-TX-200005": { given: "Christopher", family: "Wilson", state: "TX", city: "Fort Worth", zip: "76101", org: "bcbstx", orgName: "Blue Cross Blue Shield of Texas" },
  "HCSC-NM-300001": { given: "Angela", family: "Thompson", state: "NM", city: "Albuquerque", zip: "87101", org: "bcbsnm", orgName: "Blue Cross Blue Shield of New Mexico" },
  "HCSC-NM-300002": { given: "Daniel", family: "Garcia", state: "NM", city: "Santa Fe", zip: "87501", org: "bcbsnm", orgName: "Blue Cross Blue Shield of New Mexico" },
  "HCSC-NM-300003": { given: "Karen", family: "Anderson", state: "NM", city: "Las Cruces", zip: "88001", org: "bcbsnm", orgName: "Blue Cross Blue Shield of New Mexico" },
  "HCSC-NM-300004": { given: "Matthew", family: "White", state: "NM", city: "Rio Rancho", zip: "87124", org: "bcbsnm", orgName: "Blue Cross Blue Shield of New Mexico" },
  "HCSC-NM-300005": { given: "Jessica", family: "Lee", state: "NM", city: "Roswell", zip: "88201", org: "bcbsnm", orgName: "Blue Cross Blue Shield of New Mexico" },
  "HCSC-OK-400001": { given: "Brian", family: "Harris", state: "OK", city: "Oklahoma City", zip: "73101", org: "bcbsok", orgName: "Blue Cross Blue Shield of Oklahoma" },
  "HCSC-OK-400002": { given: "Amanda", family: "Clark", state: "OK", city: "Tulsa", zip: "74101", org: "bcbsok", orgName: "Blue Cross Blue Shield of Oklahoma" },
  "HCSC-OK-400003": { given: "Steven", family: "Lewis", state: "OK", city: "Norman", zip: "73019", org: "bcbsok", orgName: "Blue Cross Blue Shield of Oklahoma" },
  "HCSC-OK-400004": { given: "Michelle", family: "Robinson", state: "OK", city: "Broken Arrow", zip: "74011", org: "bcbsok", orgName: "Blue Cross Blue Shield of Oklahoma" },
  "HCSC-OK-400005": { given: "Kevin", family: "Walker", state: "OK", city: "Edmond", zip: "73003", org: "bcbsok", orgName: "Blue Cross Blue Shield of Oklahoma" },
  "HCSC-MT-500001": { given: "Stephanie", family: "Hall", state: "MT", city: "Billings", zip: "59101", org: "bcbsmt", orgName: "Blue Cross Blue Shield of Montana" },
  "HCSC-MT-500002": { given: "Jason", family: "Allen", state: "MT", city: "Missoula", zip: "59801", org: "bcbsmt", orgName: "Blue Cross Blue Shield of Montana" },
  "HCSC-MT-500003": { given: "Rebecca", family: "Young", state: "MT", city: "Great Falls", zip: "59401", org: "bcbsmt", orgName: "Blue Cross Blue Shield of Montana" },
  "HCSC-MT-500004": { given: "Ryan", family: "King", state: "MT", city: "Helena", zip: "59601", org: "bcbsmt", orgName: "Blue Cross Blue Shield of Montana" },
  "HCSC-MT-500005": { given: "Laura", family: "Wright", state: "MT", city: "Bozeman", zip: "59715", org: "bcbsmt", orgName: "Blue Cross Blue Shield of Montana" }
};

const defaultMember = { given: "Elena", family: "Martinez", state: "IL", city: "Chicago", zip: "60624", org: "bcbsil", orgName: "Blue Cross Blue Shield of Illinois" };

// Generate a deterministic patient ID from memberId
function patientId(memberId) {
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) hash = ((hash << 5) - hash) + memberId.charCodeAt(i);
  return "pat-" + Math.abs(hash % 9000000 + 1000000);
}

function lookupMember(parsedUrl) {
  const identifier = parsedUrl.searchParams.get("identifier") || "";
  return { member: members[identifier] || defaultMember, memberId: identifier || "HCSC-MBR-100234" };
}

// --- Response builders ---

function tokenResponse() {
  return {
    access_token: "mock-access-token",
    token_type: "Bearer",
    expires_in: 3600,
    scope: "patient/*.read"
  };
}

function buildPatientResponse(member, memberId) {
  const pid = patientId(memberId);
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: 1,
    entry: [
      {
        fullUrl: `https://interoperability.hcsc.com/fhir/r4/Patient/${pid}`,
        resource: {
          resourceType: "Patient",
          id: pid,
          identifier: [
            { system: "https://hcsc.com/member-id", value: memberId },
            { system: "http://hl7.org/fhir/sid/us-ssn", value: "***-**-" + String(memberId.slice(-4) || "4521").padStart(4, "0") }
          ],
          name: [{ use: "official", family: member.family, given: [member.given] }],
          gender: member.given.endsWith("a") || ["Jennifer","Karen","Jessica","Amanda","Michelle","Laura","Rebecca","Stephanie","Linda","Sarah","Angela"].includes(member.given) ? "female" : "male",
          birthDate: "1984-07-15",
          address: [{ use: "home", line: ["4521 W Monroe St"], city: member.city, state: member.state, postalCode: member.zip }],
          telecom: [
            { system: "phone", value: "(312) 555-0147", use: "mobile" },
            { system: "email", value: `${member.given.toLowerCase()}.${member.family.toLowerCase()}@email.com` }
          ],
          communication: [{ language: { coding: [{ system: "urn:ietf:bcp:47", code: "en", display: "English" }] } }],
          managingOrganization: { reference: `Organization/${member.org}`, display: member.orgName }
        }
      }
    ]
  };
}

function buildCoverageResponse(member, memberId) {
  const pid = patientId(memberId);
  const stateNetworks = { IL: "Illinois", TX: "Texas", NM: "New Mexico", OK: "Oklahoma", MT: "Montana" };
  const networkName = stateNetworks[member.state] || "Illinois";
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: 1,
    entry: [
      {
        fullUrl: `https://interoperability.hcsc.com/fhir/r4/Coverage/cov-${pid.slice(4)}`,
        resource: {
          resourceType: "Coverage",
          id: `cov-${pid.slice(4)}`,
          status: "active",
          type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "PPO", display: "Preferred Provider Organization" }] },
          subscriber: { reference: `Patient/${pid}`, display: `${member.given} ${member.family}` },
          beneficiary: { reference: `Patient/${pid}` },
          relationship: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/subscriber-relationship", code: "self" }] },
          period: { start: "2026-01-01", end: "2026-12-31" },
          payor: [{ reference: `Organization/${member.org}`, display: member.orgName }],
          class: [
            { type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/coverage-class", code: "group" }] }, value: `GRP-${member.zip}`, name: `${member.city} Employees` },
            { type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/coverage-class", code: "plan" }] }, value: "PLN-PPO-3500", name: "Blue PPO 3500" },
            { type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/coverage-class", code: "network" }] }, value: `NET-${member.state}-PPO-PRIME`, name: `${networkName} PPO Prime Network` }
          ],
          costToBeneficiary: [
            { type: { coding: [{ code: "deductible", display: "Deductible" }] }, valueMoney: { value: 3500.0, currency: "USD" } },
            { type: { coding: [{ code: "copay", display: "Copay" }] }, valueMoney: { value: 30.0, currency: "USD" } }
          ]
        }
      }
    ]
  };
}

function buildEobResponse(member, memberId) {
  const pid = patientId(memberId);
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: 3,
    entry: [
      {
        resource: {
          resourceType: "ExplanationOfBenefit",
          id: `eob-${pid.slice(4)}-01`,
          status: "active",
          type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "professional", display: "Professional" }] },
          use: "claim",
          patient: { reference: `Patient/${pid}` },
          created: "2026-03-15",
          insurer: { reference: `Organization/${member.org}`, display: member.orgName },
          provider: { reference: "Practitioner/prac-44210", display: "Dr. Sarah Chen, MD" },
          outcome: "complete",
          diagnosis: [{ sequence: 1, diagnosisCodeableConcept: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: "J06.9", display: "Acute upper respiratory infection, unspecified" }] } }],
          item: [{ sequence: 1, productOrService: { coding: [{ system: "http://www.ama-assn.org/go/cpt", code: "99213", display: "Office visit, established patient, low complexity" }] }, servicedDate: "2026-03-12", net: { value: 185.0, currency: "USD" } }],
          total: [
            { category: { coding: [{ code: "submitted" }] }, amount: { value: 185.0, currency: "USD" } },
            { category: { coding: [{ code: "benefit" }] }, amount: { value: 148.0, currency: "USD" } },
            { category: { coding: [{ code: "copay" }] }, amount: { value: 30.0, currency: "USD" } }
          ],
          payment: { amount: { value: 148.0, currency: "USD" }, date: "2026-03-22" }
        }
      },
      {
        resource: {
          resourceType: "ExplanationOfBenefit",
          id: `eob-${pid.slice(4)}-02`,
          status: "active",
          type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "professional", display: "Professional" }] },
          use: "claim",
          patient: { reference: `Patient/${pid}` },
          created: "2026-02-20",
          insurer: { reference: `Organization/${member.org}`, display: member.orgName },
          provider: { reference: "Practitioner/prac-55102", display: "Dr. Michael Torres, DDS" },
          outcome: "complete",
          diagnosis: [{ sequence: 1, diagnosisCodeableConcept: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: "Z01.20", display: "Encounter for dental examination and cleaning" }] } }],
          item: [{ sequence: 1, productOrService: { coding: [{ system: "http://www.ada.org/cdt", code: "D0120", display: "Periodic oral evaluation" }] }, servicedDate: "2026-02-18", net: { value: 95.0, currency: "USD" } }],
          total: [
            { category: { coding: [{ code: "submitted" }] }, amount: { value: 95.0, currency: "USD" } },
            { category: { coding: [{ code: "benefit" }] }, amount: { value: 95.0, currency: "USD" } }
          ],
          payment: { amount: { value: 95.0, currency: "USD" }, date: "2026-02-28" }
        }
      },
      {
        resource: {
          resourceType: "ExplanationOfBenefit",
          id: `eob-${pid.slice(4)}-03`,
          status: "active",
          type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "pharmacy", display: "Pharmacy" }] },
          use: "claim",
          patient: { reference: `Patient/${pid}` },
          created: "2026-01-10",
          insurer: { reference: `Organization/${member.org}`, display: member.orgName },
          provider: { reference: `Organization/pharm-CVS-${member.zip}`, display: `CVS Pharmacy #${member.zip.slice(0,4)}` },
          outcome: "complete",
          item: [{ sequence: 1, productOrService: { coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: "314076", display: "Lisinopril 10mg tablet" }] }, quantity: { value: 30 }, servicedDate: "2026-01-08", net: { value: 42.0, currency: "USD" } }],
          total: [
            { category: { coding: [{ code: "submitted" }] }, amount: { value: 42.0, currency: "USD" } },
            { category: { coding: [{ code: "benefit" }] }, amount: { value: 32.0, currency: "USD" } },
            { category: { coding: [{ code: "copay" }] }, amount: { value: 10.0, currency: "USD" } }
          ],
          payment: { amount: { value: 32.0, currency: "USD" }, date: "2026-01-15" }
        }
      }
    ]
  };
}

function buildProvidersResponse(member) {
  const stateIssuers = { IL: "Illinois DFPR", TX: "Texas Medical Board", NM: "NM Medical Board", OK: "Oklahoma Medical Board", MT: "Montana Board of Medical Examiners" };
  const issuer = stateIssuers[member.state] || "Illinois DFPR";
  return {
    resourceType: "Bundle",
    type: "searchset",
    total: 4,
    entry: [
      {
        resource: {
          resourceType: "PractitionerRole",
          id: "role-44210",
          practitioner: { reference: "Practitioner/prac-44210", display: "Dr. Sarah Chen, MD" },
          organization: { reference: "Organization/org-lakeshore-med", display: "Lakeshore Medical Group" },
          specialty: [{ coding: [{ system: "http://nucc.org/provider-taxonomy", code: "208D00000X", display: "General Practice" }] }],
          location: [{ reference: "Location/loc-2241", display: `2241 N Lincoln Ave, ${member.city}, ${member.state} ${member.zip}` }],
          telecom: [{ system: "phone", value: "(773) 555-0192" }],
          availableTime: [{ daysOfWeek: ["mon", "tue", "wed", "thu", "fri"], availableStartTime: "08:00:00", availableEndTime: "17:00:00" }]
        }
      },
      {
        resource: {
          resourceType: "Practitioner",
          id: "prac-44210",
          name: [{ use: "official", family: "Chen", given: ["Sarah"], prefix: ["Dr."] }],
          gender: "female",
          qualification: [{ code: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0360", code: "MD" }] }, issuer: { display: issuer } }]
        }
      },
      {
        resource: {
          resourceType: "PractitionerRole",
          id: "role-61839",
          practitioner: { reference: "Practitioner/prac-61839", display: "Dr. James Okafor, MD" },
          organization: { reference: "Organization/org-midwest-primary", display: "Midwest Primary Care Associates" },
          specialty: [{ coding: [{ system: "http://nucc.org/provider-taxonomy", code: "208D00000X", display: "General Practice" }] }],
          location: [{ reference: "Location/loc-5580", display: `5580 W Madison St, ${member.city}, ${member.state} ${member.zip}` }],
          telecom: [{ system: "phone", value: "(773) 555-0384" }],
          availableTime: [{ daysOfWeek: ["mon", "wed", "fri"], availableStartTime: "09:00:00", availableEndTime: "16:00:00" }]
        }
      },
      {
        resource: {
          resourceType: "Practitioner",
          id: "prac-61839",
          name: [{ use: "official", family: "Okafor", given: ["James"], prefix: ["Dr."] }],
          gender: "male",
          qualification: [{ code: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0360", code: "MD" }] }, issuer: { display: issuer } }]
        }
      }
    ]
  };
}

// --- Server ---

function sendJson(res, statusCode, body, contentType = "application/json") {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const method = req.method;
  const pathname = parsedUrl.pathname;

  // Request logging
  const identifier = parsedUrl.searchParams.get("identifier") || "";
  const logExtra = identifier ? ` [${identifier}]` : "";
  console.log(`${new Date().toISOString().slice(11,19)} ${method} ${pathname}${logExtra}`);

  // @endpoint POST /auth/token
  // POST /auth/token
  if (method === "POST" && pathname === "/auth/token") {
    return sendJson(res, 200, tokenResponse(), "application/json");
  }

  // @endpoint GET /Patient
  // GET /Patient
  if (method === "GET" && pathname === "/Patient") {
    const { member, memberId } = lookupMember(parsedUrl);
    return sendJson(res, 200, buildPatientResponse(member, memberId), "application/fhir+json");
  }

  // @endpoint GET /Coverage
  // GET /Coverage
  if (method === "GET" && pathname === "/Coverage") {
    const { member, memberId } = lookupMember(parsedUrl);
    return sendJson(res, 200, buildCoverageResponse(member, memberId), "application/fhir+json");
  }

  // @endpoint GET /ExplanationOfBenefit
  // GET /ExplanationOfBenefit
  if (method === "GET" && pathname === "/ExplanationOfBenefit") {
    const { member, memberId } = lookupMember(parsedUrl);
    return sendJson(res, 200, buildEobResponse(member, memberId), "application/fhir+json");
  }

  // @endpoint GET /PractitionerRole
  // GET /PractitionerRole
  if (method === "GET" && pathname === "/PractitionerRole") {
    const { member } = lookupMember(parsedUrl);
    return sendJson(res, 200, buildProvidersResponse(member), "application/fhir+json");
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found", method, path: pathname }, null, 2));
});

server.listen(port, () => {
  console.log("");
  console.log("===========================================");
  console.log("  HCSC Member Portal - FHIR R4 Mock API");
  console.log("===========================================");
  console.log(`  Port:    ${port}`);
  console.log(`  Base:    http://localhost:${port}`);
  console.log("");
  console.log("  Routes:");
  console.log(`    POST /auth/token`);
  console.log(`    GET  /Patient?identifier={memberId}`);
  console.log(`    GET  /Coverage?identifier={memberId}`);
  console.log(`    GET  /ExplanationOfBenefit?identifier={memberId}`);
  console.log(`    GET  /PractitionerRole?identifier={memberId}`);
  console.log("");
  console.log(`  Members: ${Object.keys(members).length} loaded from lookup table`);
  console.log("===========================================");
  console.log("");
});
