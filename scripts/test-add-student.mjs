const BASE = process.env.BASE_URL || "http://localhost:3000";

async function tryLogin(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role: "admin" }),
  });
  const body = await res.json();
  const setCookie = res.headers.get("set-cookie");
  return { ok: res.ok, status: res.status, body, cookie: setCookie?.split(";")[0] };
}

async function main() {
  let auth = await tryLogin("admin@tinysteps.com", "password123");
  console.log("LOGIN admin@tinysteps.com:", auth.status, auth.body);

  if (!auth.cookie) {
    auth = await tryLogin("admin@school.com", "password123");
    console.log("LOGIN admin@school.com:", auth.status, auth.body);
  }

  if (!auth.cookie) {
    auth = await tryLogin("harshladukar@gmail.com", "admin123");
    console.log("LOGIN harshladukar@gmail.com:", auth.status, auth.body);
  }

  if (!auth.cookie) {
    console.error("Could not log in — check credentials / database");
    process.exit(1);
  }

  const classesRes = await fetch(`${BASE}/api/classes`, {
    headers: { Cookie: auth.cookie },
  });
  const classesData = await classesRes.json();
  console.log("CLASSES:", classesRes.status, "count:", (classesData.classes || []).length);

  const cls = (classesData.classes || [])[0];
  if (!cls) {
    console.error("No classes in database");
    process.exit(1);
  }

  const classId = cls._id || cls.id;
  console.log("Using class:", cls.name, cls.section, classId);

  const structRes = await fetch(
    `${BASE}/api/fees/structures?classId=${encodeURIComponent(classId)}`,
    { headers: { Cookie: auth.cookie } }
  );
  const structData = await structRes.json();
  console.log("FEE STRUCTURES:", structRes.status, structData);

  const ts = Date.now();
  const studentPayload = {
    firstName: "Test",
    lastName: "Student",
    email: `testparent${ts}@gmail.com`,
    password: "password123",
    dob: "2020-05-15",
    gender: "male",
    admissionDate: "2026-08-17",
    classId,
    section: cls.section,
    parents: [
      {
        name: "Test Parent",
        phone: "9876543210",
        email: `testparent${ts}@gmail.com`,
        relation: "Father",
      },
    ],
    medical: { allergies: [], notes: "" },
    pickupInfo: { pickupPerson: "", pickupPhone: "" },
  };

  const createRes = await fetch(`${BASE}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: auth.cookie },
    body: JSON.stringify(studentPayload),
  });
  const createBody = await createRes.json();

  console.log("\n--- RESULT ---");
  console.log("HTTP status:", createRes.status);
  if (createRes.ok) {
    console.log("Toast would show: Student added successfully");
    console.log("Student ID:", createBody.student?._id || createBody.student?.id);
  } else {
    console.log("Toast error message:", createBody.error || "Failed to save student");
    console.log("Full response:", JSON.stringify(createBody, null, 2));
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
