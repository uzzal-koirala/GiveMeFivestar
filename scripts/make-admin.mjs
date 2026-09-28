// Make a super admin.
//   npm run make-admin -- you@example.com              -> promote an existing account
//   npm run make-admin -- you@example.com 'password'   -> create it (or reset its password) and promote it
import "dotenv/config";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];
if (!email) {
  console.error("Usage: npm run make-admin -- you@example.com [password]");
  process.exit(1);
}
if (password && password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const db = new Database(process.env.DATABASE_URL.replace(/^file:/, ""));
const user = db.prepare("SELECT id FROM User WHERE email = ?").get(email);

if (user) {
  const hash = password ? bcrypt.hashSync(password, 12) : null;
  db.prepare("UPDATE User SET role = 'super_admin'" + (hash ? ", passwordHash = ?" : "") + " WHERE id = ?").run(...(hash ? [hash, user.id] : [user.id]));
  console.log(`${email} is now a super admin${password ? " (password updated)" : ""}.`);
} else if (password) {
  db.prepare(
    "INSERT INTO User (id, email, name, businessName, passwordHash, role, plan, credits, createdAt) VALUES (?, ?, ?, ?, ?, 'super_admin', 'free', 0, ?)"
  ).run(`admin_${randomBytes(8).toString("hex")}`, email, "Super Admin", "Give Me Five Star", bcrypt.hashSync(password, 12), Date.now());
  console.log(`Created super admin ${email}.`);
} else {
  console.error(`No account found for ${email}. Add a password to create it.`);
  process.exit(1);
}
