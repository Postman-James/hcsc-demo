const http = require("http");
const { URL } = require("url");

const port = process.env.PORT || 3000;

const tokenResponse = {
  access_token: "mock-access-token",
  token_type: "Bearer",
  expires_in: 3600,
  scope: "patient/*.read"
};

const patientResponse = {
  resourceType: "Bundle",
  type: "searchset",
  total: 1,
  entry: [
    {
      fullUrl: "https://interoperability.hcsc.com/fhir/r4/Patient/pat-8827341",
      resource: {
        resourceType: "Patient",
        id: "pat-8827341",
        identifier: [
          {
            system: "https://hcsc.com/member-id",
            value: "HCSC-MBR-100234"
          },
          {
            system: "http://hl7.org/fhir/sid/us-ssn",
            value: "***-**-4521"
          }
        ],
        name: [
          {
            use: "official",
            family: "Martinez",
            given: ["Elena", "R"]
          }
        ],
        gender: "female",
        birthDate: "1984-07-15",
        address: [
          {
            use: "home",
            line: ["4521 W Monroe St"],
            city: "Chicago",
            state: "IL",
            postalCode: "60624"
          }
        ],
        telecom: [
          {
            system: "phone",
            value: "(312) 555-0147",
            use: "mobile"
          },
          {
            system: "email",
            value: "elena.martinez@email.com"
          }
        ],
        communication: [
          {
            language: {
              coding: [
                {
                  system: "urn:ietf:bcp:47",
                  code: "en",
                  display: "English"
                }
              ]
            }
          }
        ],
        managingOrganization: {
          reference: "Organization/bcbsil",
          display: "Blue Cross Blue Shield of Illinois"
        }
      }
    }
  ]
};

const coverageResponse = {
  resourceType: "Bundle",
  type: "searchset",
  total: 1,
  entry: [
    {
      fullUrl: "https://interoperability.hcsc.com/fhir/r4/Coverage/cov-442918",
      resource: {
        resourceType: "Coverage",
        id: "cov-442918",
        status: "active",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
              code: "PPO",
              display: "Preferred Provider Organization"
            }
          ]
        },
        subscriber: {
          reference: "Patient/pat-8827341",
          display: "Elena R Martinez"
        },
        beneficiary: {
          reference: "Patient/pat-8827341"
        },
        relationship: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/subscriber-relationship",
              code: "self"
            }
          ]
        },
        period: {
          start: "2025-01-01",
          end: "2025-12-31"
        },
        payor: [
          {
            reference: "Organization/bcbsil",
            display: "Blue Cross Blue Shield of Illinois"
          }
        ],
        class: [
          {
            type: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/coverage-class",
                  code: "group"
                }
              ]
            },
            value: "GRP-88421",
            name: "City of Chicago Employees"
          },
          {
            type: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/coverage-class",
                  code: "plan"
                }
              ]
            },
            value: "PLN-PPO-3500",
            name: "Blue PPO 3500"
          },
          {
            type: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/coverage-class",
                  code: "network"
                }
              ]
            },
            value: "NET-IL-PPO-PRIME",
            name: "Illinois PPO Prime Network"
          }
        ],
        costToBeneficiary: [
          {
            type: {
              coding: [
                {
                  code: "deductible",
                  display: "Deductible"
                }
              ]
            },
            valueMoney: {
              value: 3500.0,
              currency: "USD"
            }
          },
          {
            type: {
              coding: [
                {
                  code: "copay",
                  display: "Copay"
                }
              ]
            },
            valueMoney: {
              value: 30.0,
              currency: "USD"
            }
          }
        ]
      }
    }
  ]
};

const eobResponse = {
  resourceType: "Bundle",
  type: "searchset",
  total: 3,
  entry: [
    {
      resource: {
        resourceType: "ExplanationOfBenefit",
        id: "eob-99201",
        status: "active",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/claim-type",
              code: "professional",
              display: "Professional"
            }
          ]
        },
        use: "claim",
        patient: {
          reference: "Patient/pat-8827341"
        },
        created: "2025-03-15",
        insurer: {
          reference: "Organization/bcbsil",
          display: "Blue Cross Blue Shield of Illinois"
        },
        provider: {
          reference: "Practitioner/prac-44210",
          display: "Dr. Sarah Chen, MD"
        },
        outcome: "complete",
        diagnosis: [
          {
            sequence: 1,
            diagnosisCodeableConcept: {
              coding: [
                {
                  system: "http://hl7.org/fhir/sid/icd-10-cm",
                  code: "J06.9",
                  display: "Acute upper respiratory infection, unspecified"
                }
              ]
            }
          }
        ],
        item: [
          {
            sequence: 1,
            productOrService: {
              coding: [
                {
                  system: "http://www.ama-assn.org/go/cpt",
                  code: "99213",
                  display: "Office visit, established patient, low complexity"
                }
              ]
            },
            servicedDate: "2025-03-12",
            net: {
              value: 185.0,
              currency: "USD"
            }
          }
        ],
        total: [
          {
            category: {
              coding: [{ code: "submitted" }]
            },
            amount: {
              value: 185.0,
              currency: "USD"
            }
          },
          {
            category: {
              coding: [{ code: "benefit" }]
            },
            amount: {
              value: 148.0,
              currency: "USD"
            }
          },
          {
            category: {
              coding: [{ code: "copay" }]
            },
            amount: {
              value: 30.0,
              currency: "USD"
            }
          }
        ],
        payment: {
          amount: {
            value: 148.0,
            currency: "USD"
          },
          date: "2025-03-22"
        }
      }
    },
    {
      resource: {
        resourceType: "ExplanationOfBenefit",
        id: "eob-98847",
        status: "active",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/claim-type",
              code: "professional",
              display: "Professional"
            }
          ]
        },
        use: "claim",
        patient: {
          reference: "Patient/pat-8827341"
        },
        created: "2025-02-20",
        insurer: {
          reference: "Organization/bcbsil",
          display: "Blue Cross Blue Shield of Illinois"
        },
        provider: {
          reference: "Practitioner/prac-55102",
          display: "Dr. Michael Torres, DDS"
        },
        outcome: "complete",
        diagnosis: [
          {
            sequence: 1,
            diagnosisCodeableConcept: {
              coding: [
                {
                  system: "http://hl7.org/fhir/sid/icd-10-cm",
                  code: "Z01.20",
                  display: "Encounter for dental examination and cleaning"
                }
              ]
            }
          }
        ],
        item: [
          {
            sequence: 1,
            productOrService: {
              coding: [
                {
                  system: "http://www.ada.org/cdt",
                  code: "D0120",
                  display: "Periodic oral evaluation"
                }
              ]
            },
            servicedDate: "2025-02-18",
            net: {
              value: 95.0,
              currency: "USD"
            }
          }
        ],
        total: [
          {
            category: {
              coding: [{ code: "submitted" }]
            },
            amount: {
              value: 95.0,
              currency: "USD"
            }
          },
          {
            category: {
              coding: [{ code: "benefit" }]
            },
            amount: {
              value: 95.0,
              currency: "USD"
            }
          }
        ],
        payment: {
          amount: {
            value: 95.0,
            currency: "USD"
          },
          date: "2025-02-28"
        }
      }
    },
    {
      resource: {
        resourceType: "ExplanationOfBenefit",
        id: "eob-97203",
        status: "active",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/claim-type",
              code: "pharmacy",
              display: "Pharmacy"
            }
          ]
        },
        use: "claim",
        patient: {
          reference: "Patient/pat-8827341"
        },
        created: "2025-01-10",
        insurer: {
          reference: "Organization/bcbsil",
          display: "Blue Cross Blue Shield of Illinois"
        },
        provider: {
          reference: "Organization/pharm-CVS-60624",
          display: "CVS Pharmacy #8841"
        },
        outcome: "complete",
        item: [
          {
            sequence: 1,
            productOrService: {
              coding: [
                {
                  system: "http://www.nlm.nih.gov/research/umls/rxnorm",
                  code: "314076",
                  display: "Lisinopril 10mg tablet"
                }
              ]
            },
            quantity: {
              value: 30
            },
            servicedDate: "2025-01-08",
            net: {
              value: 42.0,
              currency: "USD"
            }
          }
        ],
        total: [
          {
            category: {
              coding: [{ code: "submitted" }]
            },
            amount: {
              value: 42.0,
              currency: "USD"
            }
          },
          {
            category: {
              coding: [{ code: "benefit" }]
            },
            amount: {
              value: 32.0,
              currency: "USD"
            }
          },
          {
            category: {
              coding: [{ code: "copay" }]
            },
            amount: {
              value: 10.0,
              currency: "USD"
            }
          }
        ],
        payment: {
          amount: {
            value: 32.0,
            currency: "USD"
          },
          date: "2025-01-15"
        }
      }
    }
  ]
};

const providersResponse = {
  resourceType: "Bundle",
  type: "searchset",
  total: 4,
  entry: [
    {
      resource: {
        resourceType: "PractitionerRole",
        id: "role-44210",
        practitioner: {
          reference: "Practitioner/prac-44210",
          display: "Dr. Sarah Chen, MD"
        },
        organization: {
          reference: "Organization/org-lakeshore-med",
          display: "Lakeshore Medical Group"
        },
        specialty: [
          {
            coding: [
              {
                system: "http://nucc.org/provider-taxonomy",
                code: "208D00000X",
                display: "General Practice"
              }
            ]
          }
        ],
        location: [
          {
            reference: "Location/loc-2241",
            display: "2241 N Lincoln Ave, Chicago, IL 60614"
          }
        ],
        telecom: [
          {
            system: "phone",
            value: "(773) 555-0192"
          }
        ],
        availableTime: [
          {
            daysOfWeek: ["mon", "tue", "wed", "thu", "fri"],
            availableStartTime: "08:00:00",
            availableEndTime: "17:00:00"
          }
        ]
      }
    },
    {
      resource: {
        resourceType: "Practitioner",
        id: "prac-44210",
        name: [
          {
            use: "official",
            family: "Chen",
            given: ["Sarah"],
            prefix: ["Dr."]
          }
        ],
        gender: "female",
        qualification: [
          {
            code: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v2-0360",
                  code: "MD"
                }
              ]
            },
            issuer: {
              display: "Illinois DFPR"
            }
          }
        ]
      }
    },
    {
      resource: {
        resourceType: "PractitionerRole",
        id: "role-61839",
        practitioner: {
          reference: "Practitioner/prac-61839",
          display: "Dr. James Okafor, MD"
        },
        organization: {
          reference: "Organization/org-midwest-primary",
          display: "Midwest Primary Care Associates"
        },
        specialty: [
          {
            coding: [
              {
                system: "http://nucc.org/provider-taxonomy",
                code: "208D00000X",
                display: "General Practice"
              }
            ]
          }
        ],
        location: [
          {
            reference: "Location/loc-5580",
            display: "5580 W Madison St, Chicago, IL 60644"
          }
        ],
        telecom: [
          {
            system: "phone",
            value: "(773) 555-0384"
          }
        ],
        availableTime: [
          {
            daysOfWeek: ["mon", "wed", "fri"],
            availableStartTime: "09:00:00",
            availableEndTime: "16:00:00"
          }
        ]
      }
    },
    {
      resource: {
        resourceType: "Practitioner",
        id: "prac-61839",
        name: [
          {
            use: "official",
            family: "Okafor",
            given: ["James"],
            prefix: ["Dr."]
          }
        ],
        gender: "male",
        qualification: [
          {
            code: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v2-0360",
                  code: "MD"
                }
              ]
            },
            issuer: {
              display: "Illinois DFPR"
            }
          }
        ]
      }
    }
  ]
};

function sendJson(res, statusCode, body, contentType = "application/json") {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(JSON.stringify(body, null, 2));
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const method = req.method;
  const pathname = parsedUrl.pathname;

  // @endpoint POST /auth/token
  if (method === "POST" && pathname === "/auth/token") {
    return sendJson(res, 200, tokenResponse, "application/json");
  }

  // @endpoint GET /Patient
  if (method === "GET" && pathname === "/Patient") {
    return sendJson(res, 200, patientResponse, "application/fhir+json");
  }

  // @endpoint GET /Coverage
  if (method === "GET" && pathname === "/Coverage") {
    return sendJson(res, 200, coverageResponse, "application/fhir+json");
  }

  // @endpoint GET /ExplanationOfBenefit
  if (method === "GET" && pathname === "/ExplanationOfBenefit") {
    return sendJson(res, 200, eobResponse, "application/fhir+json");
  }

  // @endpoint GET /PractitionerRole
  if (method === "GET" && pathname === "/PractitionerRole") {
    return sendJson(res, 200, providersResponse, "application/fhir+json");
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found", method, path: pathname }, null, 2));
});

server.listen(port, () => {
  console.log(`HCSC Member Portal mock listening on port ${port}`);
});
