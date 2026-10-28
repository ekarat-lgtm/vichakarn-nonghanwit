/* ส่งอีเมลผ่าน SMTP (เช่น Gmail + App Password) — ฝั่งเซิร์ฟเวอร์เท่านั้น */
import nodemailer from "nodemailer";

export const mailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendMail(m: { to: string; subject: string; text: string; html: string }) {
  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error("ยังไม่ได้ตั้งค่า SMTP_USER / SMTP_PASS");
  const port = Number(process.env.SMTP_PORT || 465);
  const tr = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com", port, secure: port === 465, auth: { user, pass },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
  });
  await tr.sendMail({
    from: process.env.MAIL_FROM || `"ฝ่ายวิชาการ โรงเรียนหนองหานวิทยา" <${user}>`,
    to: m.to, subject: m.subject.replace(/[\r\n]+/g, " "), text: m.text, html: m.html,
  });
}
