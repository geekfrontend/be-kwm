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
