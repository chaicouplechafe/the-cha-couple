import { NextResponse } from "next/server";
import { db, getTodayKey, firestoreHelpers } from "@/lib/firebase";

const { doc, collection, query, orderBy, onSnapshot, getDoc } = firestoreHelpers;

const DEFAULT_SETTINGS = {
  serviceStart: "06:00",
  serviceEnd: "23:00",
  closedMessage: "Queue is currently closed. Please check back during service hours.",
  availability: {
    chai: true,
    bun: true,
  },
};

const SETTINGS_DOC = doc(db, "config", "app-settings");

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedDate = searchParams.get("date") || getTodayKey();

  const ticketsQuery = query(
    collection(doc(db, "queues", requestedDate), "tickets"),
    orderBy("basePosition", "asc")
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let settings = DEFAULT_SETTINGS;
      try {
        const settingsSnap = await getDoc(SETTINGS_DOC);
        if (settingsSnap.exists()) {
          settings = { ...DEFAULT_SETTINGS, ...settingsSnap.data() };
        }
      } catch {
        // use defaults
      }

      let currentTickets = [];

      const sendUpdate = (tickets) => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ dateKey: requestedDate, tickets, settings })}\n\n`
          )
        );
      };

      const unsubscribeTickets = onSnapshot(
        ticketsQuery,
        (snapshot) => {
          currentTickets = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          sendUpdate(currentTickets);
        },
        (error) => {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`
            )
          );
        }
      );

      const unsubscribeSettings = onSnapshot(
        SETTINGS_DOC,
        (snapshot) => {
          if (snapshot.exists()) {
            settings = { ...DEFAULT_SETTINGS, ...snapshot.data() };
            sendUpdate(currentTickets);
          }
        },
        () => {
          // ignore settings errors
        }
      );

      const close = () => {
        unsubscribeTickets();
        unsubscribeSettings();
        controller.close();
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}


