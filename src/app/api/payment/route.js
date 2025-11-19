import { NextResponse } from "next/server";
import { db, firestoreHelpers } from "@/lib/firebase";

const { doc, collection, getDoc, updateDoc, serverTimestamp } = firestoreHelpers;

export async function PATCH(request) {
  try {
    const body = await request.json();
    const id = body.id;
    const dateKey = body.dateKey;
    const paid = body.paid;

    if (!id || !dateKey || typeof paid !== "boolean") {
      return NextResponse.json(
        { error: "id, dateKey and paid flag are required" },
        { status: 400 }
      );
    }

    const dayRef = doc(db, "queues", dateKey);
    const ticketRef = doc(collection(dayRef, "tickets"), id);
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await updateDoc(ticketRef, {
      paid,
      paidAt: paid ? serverTimestamp() : null,
    });

    return NextResponse.json({ id, dateKey, paid }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/payment PATCH:", err);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}

