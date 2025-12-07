import axios from "axios";
import { spawn } from "child_process";

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
	console.log("Starting server for testing...");
	// Use a different port for testing to avoid conflicts
	const server = spawn("npx", ["tsx", "src/index.ts"], {
		env: { ...process.env, PORT: PORT.toString(), JWT_SECRET: "testsecret" },
		stdio: "inherit",
	});

	// Wait for server to start
	await sleep(5000);

	try {
		console.log("\n--- Testing Login ---");
		const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
			email: "alice@prisma.io",
			password: "password123",
		});
		console.log("Login Status:", loginRes.status);
		console.log("Token received:", !!loginRes.data.data?.token);
		const token = loginRes.data.data.token;

		if (!token) throw new Error("No token received");

		console.log("\n--- Testing Get Me ---");
		const meRes = await axios.get(`${BASE_URL}/auth/me`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log("Me Status:", meRes.status);
		console.log("User Name:", meRes.data.data.name);
		if (meRes.data.data.password)
			console.error("ERROR: Password exposed in /me");
		else console.log("Password correctly excluded from /me");

		console.log("\n--- Testing Get Users ---");
		const usersRes = await axios.get(`${BASE_URL}/users`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log("Get Users Status:", usersRes.status);
		console.log("Users Count:", usersRes.data.data.items.length);
		console.log("Meta:", usersRes.data.meta);
		if (
			usersRes.data.data.items.length > 0 &&
			usersRes.data.data.items[0].password
		) {
			console.error("ERROR: Password exposed in /users");
		} else {
			console.log("Password correctly excluded from /users");
		}

		console.log("\n--- Testing Authorization (EMPLOYEE) ---");
		const allUsers: Array<{ id: string; email: string }> =
			usersRes.data.data.items;
		const nilu = allUsers.find((u) => u.email === "nilu@prisma.io");
		if (nilu) {
			await axios.put(
				`${BASE_URL}/users/${nilu.id}`,
				{ isActive: true },
				{ headers: { Authorization: `Bearer ${token}` } },
			);
		}
		const empLogin = await axios.post(`${BASE_URL}/auth/login`, {
			email: "nilu@prisma.io",
			password: "password123",
		});
		const empToken = empLogin.data.data.token;
		const empMe = await axios.get(`${BASE_URL}/auth/me`, {
			headers: { Authorization: `Bearer ${empToken}` },
		});
		const empId = empMe.data.data.id;

		try {
			await axios.get(`${BASE_URL}/users`, {
				headers: { Authorization: `Bearer ${empToken}` },
			});
			console.error("ERROR: Non-admin could access GET /users");
		} catch (e: any) {
			console.log(
				"Non-admin blocked from GET /users:",
				e.response?.status === 403 ? "OK" : e.response?.status,
			);
		}

		const selfRes = await axios.get(`${BASE_URL}/users/${empId}`, {
			headers: { Authorization: `Bearer ${empToken}` },
		});
		console.log("Self GET /users/:id Status:", selfRes.status);

		try {
			await axios.get(`${BASE_URL}/users/${usersRes.data.data.items[0].id}`, {
				headers: { Authorization: `Bearer ${empToken}` },
			});
			console.error("ERROR: Non-admin could access other user GET /users/:id");
		} catch (e: any) {
			console.log(
				"Non-admin blocked from other GET /users/:id:",
				e.response?.status === 403 ? "OK" : e.response?.status,
			);
		}

		for (const method of ["post", "put", "delete"] as const) {
			try {
				if (method === "post") {
					await axios.post(
						`${BASE_URL}/users`,
						{ name: "X", email: "x@example.com", password: "password123" },
						{ headers: { Authorization: `Bearer ${empToken}` } },
					);
				} else if (method === "put") {
					await axios.put(
						`${BASE_URL}/users/${empId}`,
						{ name: "New" },
						{ headers: { Authorization: `Bearer ${empToken}` } },
					);
				} else {
					await axios.delete(`${BASE_URL}/users/${empId}`, {
						headers: { Authorization: `Bearer ${empToken}` },
					});
				}
				console.error(`ERROR: Non-admin could ${method.toUpperCase()} /users`);
			} catch (e: any) {
				console.log(
					`Non-admin blocked from ${method.toUpperCase()} /users:`,
					e.response?.status === 403 ? "OK" : e.response?.status,
				);
			}
		}

		console.log("\n--- Testing Logout (EMPLOYEE) ---");
		const logoutEmp = await axios.delete(`${BASE_URL}/auth/logout`, {
			headers: { Authorization: `Bearer ${empToken}` },
		});
		console.log("Logout Status:", logoutEmp.status);
		try {
			await axios.get(`${BASE_URL}/auth/me`, {
				headers: { Authorization: `Bearer ${empToken}` },
			});
			console.error("ERROR: Me accessible after logout");
		} catch (e: any) {
			console.log(
				"Access Me after logout blocked:",
				e.response?.status === 401 ? "OK" : e.response?.status,
			);
		}

		console.log("\n--- Testing Login Again (EMPLOYEE) ---");
		const empLogin2 = await axios.post(`${BASE_URL}/auth/login`, {
			email: "nilu@prisma.io",
			password: "password123",
		});
		const empToken2 = empLogin2.data.data.token;

		console.log("\n--- Testing Attendance My History ---");
		const myHist = await axios.get(`${BASE_URL}/api/attendance/me`, {
			headers: { Authorization: `Bearer ${empToken2}` },
			params: { page: 1, pageSize: 5 },
		});
		console.log("My History Status:", myHist.status);
		console.log("Items:", myHist.data.data.items.length);
		console.log("Meta:", myHist.data.meta);

		console.log("\n--- Testing My QR and Rate Limit ---");
		const myQr1 = await axios.get(`${BASE_URL}/api/attendance/my-qr`, {
			headers: { Authorization: `Bearer ${empToken2}` },
		});
		console.log("My QR Status:", myQr1.status);
		const qr = myQr1.data.data.qr as string;
		try {
			await axios.get(`${BASE_URL}/api/attendance/my-qr`, {
				headers: { Authorization: `Bearer ${empToken2}` },
			});
			console.error("ERROR: My QR not rate limited");
		} catch (e: any) {
			console.log(
				"My QR rate limit:",
				e.response?.status === 429 ? "OK" : e.response?.status,
			);
		}

		console.log("\n--- Testing Login as SECURITY ---");
		const secLogin = await axios.post(`${BASE_URL}/auth/login`, {
			email: "mahmoud@prisma.io",
			password: "password123",
		});
		const secToken = secLogin.data.data.token;
		console.log("Security Login Status:", secLogin.status);

		console.log("\n--- Testing Security Scan Attendance CHECK_IN ---");
		const scan1 = await axios.post(
			`${BASE_URL}/api/security/scan-attendance`,
			{ qr },
			{ headers: { Authorization: `Bearer ${secToken}` } },
		);
		console.log("Scan1 Status:", scan1.status);
		console.log("Scan1 Mode:", scan1.data.data.mode);

		console.log("\n--- Testing Attendance Today before CHECK_OUT ---");
		const today1 = await axios.get(`${BASE_URL}/api/attendance/today`, {
			headers: { Authorization: `Bearer ${empToken2}` },
		});
		console.log("Today Status:", today1.status);
		console.log("CheckInAt exists:", !!today1.data.data?.checkInAt);
		console.log("CheckOutAt exists:", !!today1.data.data?.checkOutAt);

		console.log("\n--- Testing Security Scan Attendance CHECK_OUT ---");
		const scan2 = await axios.post(
			`${BASE_URL}/api/security/scan-attendance`,
			{ qr },
			{ headers: { Authorization: `Bearer ${secToken}` } },
		);
		console.log("Scan2 Status:", scan2.status);
		console.log("Scan2 Mode:", scan2.data.data.mode);

		console.log("\n--- Testing Attendance Today after CHECK_OUT ---");
		const today2 = await axios.get(`${BASE_URL}/api/attendance/today`, {
			headers: { Authorization: `Bearer ${empToken2}` },
		});
		console.log("Today Status:", today2.status);
		console.log("CheckInAt exists:", !!today2.data.data?.checkInAt);
		console.log("CheckOutAt exists:", !!today2.data.data?.checkOutAt);

		console.log("\n--- Testing Attendance Admin Summary ---");
		try {
			await axios.get(`${BASE_URL}/api/attendance/summary/today`, {
				headers: { Authorization: `Bearer ${empToken2}` },
			});
			console.error("ERROR: Employee could access admin summary");
		} catch (e: any) {
			console.log(
				"Employee blocked from summary:",
				e.response?.status === 403 ? "OK" : e.response?.status,
			);
		}
		const summary = await axios.get(
			`${BASE_URL}/api/attendance/summary/today`,
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		console.log("Summary Status:", summary.status);
		console.log("Summary Data:", summary.data.data);

		console.log("\n--- Testing Allowances Summary and Mark Paid ---");
		const now = new Date();
		const start = new Date(
			now.getTime() - 2 * 24 * 60 * 60 * 1000,
		).toISOString();
		const end = now.toISOString();
		const allowSum = await axios.get(
			`${BASE_URL}/api/attendance/allowances/summary`,
			{ headers: { Authorization: `Bearer ${token}` }, params: { start, end } },
		);
		console.log("Allowances Summary Status:", allowSum.status);
		console.log("Allowances Summary:", allowSum.data.data);
		const markPaid = await axios.post(
			`${BASE_URL}/api/attendance/allowances/mark-paid`,
			{ start, end },
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		console.log("Mark Paid Status:", markPaid.status);

		console.log("\n--- Testing Divisions CRUD ---");
		const divName = `QA Test ${Date.now()}`;
		const divCreate = await axios.post(
			`${BASE_URL}/api/divisions`,
			{ name: divName, isActive: true },
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		console.log("Division Create Status:", divCreate.status);
		const divId = divCreate.data.data.id as string;
		const divList = await axios.get(`${BASE_URL}/api/divisions`, {
			headers: { Authorization: `Bearer ${token}` },
			params: { page: 1, pageSize: 5 },
		});
		console.log("Division List Status:", divList.status);
		console.log("Division Items:", divList.data.data.items.length);
		const divGet = await axios.get(`${BASE_URL}/api/divisions/${divId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log("Division Get Status:", divGet.status);
		const divUpdate = await axios.put(
			`${BASE_URL}/api/divisions/${divId}`,
			{ isActive: false },
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		console.log("Division Update Status:", divUpdate.status);
		const divDelete = await axios.delete(`${BASE_URL}/api/divisions/${divId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		console.log("Division Delete Status:", divDelete.status);

		console.log("\n--- Testing Divisions Authorization ---");
		try {
			await axios.get(`${BASE_URL}/api/divisions`, {
				headers: { Authorization: `Bearer ${empToken2}` },
			});
			console.error("ERROR: Employee could access divisions");
		} catch (e: any) {
			console.log(
				"Employee blocked from divisions:",
				e.response?.status === 403 ? "OK" : e.response?.status,
			);
		}
		try {
			await axios.get(`${BASE_URL}/api/divisions`, {
				headers: { Authorization: `Bearer ${secToken}` },
			});
			console.error("ERROR: Security could access divisions");
		} catch (e: any) {
			console.log(
				"Security blocked from divisions:",
				e.response?.status === 403 ? "OK" : e.response?.status,
			);
		}

		console.log("\n--- Testing Create SECURITY via ADMIN and access ---");
		const secEmail = `sec_${Date.now()}@example.com`;
		const createdSec = await axios.post(
			`${BASE_URL}/users`,
			{
				name: "Guard",
				email: secEmail,
				password: "password123",
				role: "SECURITY",
			},
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		console.log("Create SECURITY Status:", createdSec.status);
		try {
			await axios.get(`${BASE_URL}/users`, {
				headers: { Authorization: `Bearer ${secToken}` },
			});
			console.error("ERROR: Security could access GET /users");
		} catch (e: any) {
			console.log(
				"Security blocked from GET /users:",
				e.response?.status === 403 ? "OK" : e.response?.status,
			);
		}

		console.log("\n--- Testing Login Validation ---");
		try {
			await axios.post(`${BASE_URL}/auth/login`, {
				email: "not-an-email",
				password: "short",
			});
			console.error("ERROR: Login accepted invalid payload");
		} catch (e: any) {
			console.log(
				"Login invalid payload blocked:",
				e.response?.status === 400 ? "OK" : e.response?.status,
			);
		}

		console.log("\n--- Testing Disabled Account Cannot Login ---");
		await axios.put(
			`${BASE_URL}/users/${empId}`,
			{ isActive: false },
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		try {
			await axios.post(`${BASE_URL}/auth/login`, {
				email: "nilu@prisma.io",
				password: "password123",
			});
			console.error("ERROR: Disabled account could login");
		} catch (e: any) {
			console.log(
				"Disabled account blocked from login:",
				e.response?.status === 403 ? "OK" : e.response?.status,
			);
		}
	} catch (error: any) {
		console.error("Test Failed:", error.response?.data || error.message);
	} finally {
		console.log("\nStopping server...");
		server.kill();
	}
}

runTests();
