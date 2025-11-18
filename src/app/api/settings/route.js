import { NextResponse } from "next/server";
import { db, firestoreHelpers } from "@/lib/firebase";

const { doc, getDoc, setDoc, serverTimestamp } = firestoreHelpers;

const SETTINGS_DOC = doc(db, "config", "app-settings");

const DEFAULT_SETTINGS = {
  serviceStart: "06:00",
  serviceEnd: "23:00",
  closedMessage: "Queue is currently closed. Please check back during service hours.",
  availability: {
    chai: true,
    bun: true,
  },
};

export async function GET() {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    if (!snap.exists()) {
      return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });
    }
    return NextResponse.json({ ...DEFAULT_SETTINGS, ...snap.data() }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/settings GET:", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const serviceStart = body.serviceStart || DEFAULT_SETTINGS.serviceStart;
    const serviceEnd = body.serviceEnd || DEFAULT_SETTINGS.serviceEnd;
    const closedMessage = body.closedMessage || DEFAULT_SETTINGS.closedMessage;
    const availability = {
      chai: body.availability?.chai ?? true,
      bun: body.availability?.bun ?? true,
    };

    await setDoc(
      SETTINGS_DOC,
      {
        serviceStart,
        serviceEnd,
        closedMessage,
        availability,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json(
      { serviceStart, serviceEnd, closedMessage, availability },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/settings POST:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}


