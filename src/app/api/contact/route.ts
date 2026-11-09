import { NextResponse } from 'next/server';

type ContactPayload = { first_name?: string; last_name?: string; email?: string; subject?: string; message?: string };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Email delivery is not configured yet.' }, { status: 503 });

  let body: ContactPayload;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const first = String(body.first_name || '').trim().slice(0, 80);
  const last = String(body.last_name || '').trim().slice(0, 80);
  const email = String(body.email || '').trim().slice(0, 320);
  const subject = String(body.subject || '').trim().slice(0, 160);
  const message = String(body.message || '').trim().slice(0, 5000);
  if (!first || !last || !emailPattern.test(email) || !subject || !message) return NextResponse.json({ error: 'Please complete every field with a valid email address.' }, { status: 400 });

  const recipient = process.env.CONTACT_TO_EMAIL || 'bukharifabricstailoring@gmail.com';
  const sender = process.env.RESEND_FROM_EMAIL || 'Bukhari Fabrics <onboarding@resend.dev>';
  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      reply_to: email,
      subject: `Website enquiry: ${subject}`,
      text: `From: ${first} ${last}\nEmail: ${email}\n\n${message}`,
    }),
  });
  if (!result.ok) return NextResponse.json({ error: 'We could not send your message right now. Please call or WhatsApp the store.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
