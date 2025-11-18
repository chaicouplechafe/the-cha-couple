import { NextResponse } from "next/server";
import { db, firestoreHelpers } from "@/lib/firebase";

const { doc, collection, getDoc, setDoc, serverTimestamp } = firestoreHelpers;

export async function PATCH(request) {
  try {
    const body = await request.json();
    const id = body.id;
    const dateKey = body.dateKey;
    const status = body.status;

    if (!id || !dateKey || !status) {
      return NextResponse.json(
        { error: "id, dateKey and status are required" },
        { status: 400 }
      );
    }

    if (status !== "ready") {
      return NextResponse.json(
        { error: "Only ready status updates are supported" },
        { status: 400 }
      );
    }

    const dayRef = doc(db, "queues", dateKey);
    const ticketRef = doc(collection(dayRef, "tickets"), id);
    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticketData = ticketSnap.data();
    const originalItems = Array.isArray(ticketData.items) ? ticketData.items : [];

    const pricingRef = doc(db, "config", "pricing");
    const pricingSnap = await getDoc(pricingRef);
    const pricingData = pricingSnap.exists()
      ? pricingSnap.data()
      : { chaiPrice: 0, bunPrice: 0 };
    const chaiPrice = Number(pricingData.chaiPrice) || 0;
    const bunPrice = Number(pricingData.bunPrice) || 0;

    const total = originalItems.reduce((sum, item) => {
      const qty = Number(item.qty) || 0;
      const unitPrice = item.name === "Irani Chai" ? chaiPrice : bunPrice;
      return sum + unitPrice * qty;
    }, 0);

    await setDoc(
      ticketRef,
      {
        status,
        updatedAt: serverTimestamp(),
        total,
      },
      { merge: true }
    );

    return NextResponse.json({ id, dateKey, status }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/ready PATCH:", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
