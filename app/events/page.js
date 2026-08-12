"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

const fallbackImg =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

function formatSchedule(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function EventsPage() {
  const { userDoc, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function fetchEvents() {
      if (!userDoc?.kaiwai) {
        setEvents([]);
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "events"),
          where("kaiwai", "==", userDoc.kaiwai),
          where("published", "==", true),
          orderBy("event_schedule", "desc")
        );
        const snap = await getDocs(q);

        const items = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            let kaiwaiName = "";
            if (data.kaiwai) {
              try {
                const kSnap = await getDoc(data.kaiwai);
                if (kSnap.exists()) kaiwaiName = kSnap.data().name || "";
              } catch {}
            }
            return { id: d.id, kaiwaiName, ...data };
          })
        );

        setEvents(items);
      } catch (e) {
        console.error("events fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [authLoading, userDoc]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 dark:text-[var(--fg-muted)] text-sm">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      <h1
        className="text-lg font-medium text-gray-800 dark:text-[var(--fg-primary)] mb-5"
        style={{ fontFamily: "'Urbanist', sans-serif" }}
      >
        events
      </h1>

      {events.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-[var(--fg-muted)] text-sm py-16">
          {userDoc?.kaiwai ? "イベントはまだありません" : "界隈に参加するとイベントが表示されます"}
        </p>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  return (
    <Link
      href={`/events/${event.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="flex gap-4 p-4 bg-white dark:bg-[var(--surface)] rounded-2xl border border-gray-100 dark:border-[var(--border-subtle)] shadow-sm hover:shadow-md transition-shadow">
        {/* サムネイル */}
        <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden">
          <img
            src={event.event_photo || fallbackImg}
            alt={event.event_title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 情報 */}
        <div className="flex-1 min-w-0">
          {event.kaiwaiName && (
            <span
              className="text-xs text-[#8fa8a7] font-medium mb-1 block"
              style={{ fontFamily: "'Urbanist', sans-serif" }}
            >
              {event.kaiwaiName}
            </span>
          )}
          <h2
            className="text-sm font-semibold text-gray-800 dark:text-[var(--fg-primary)] leading-snug mb-1 line-clamp-2"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            {event.event_title}
          </h2>
          {event.event_subtitle && (
            <p className="text-xs text-gray-500 dark:text-[var(--fg-secondary)] mb-2 truncate"
               style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {event.event_subtitle}
            </p>
          )}

          <div className="flex flex-col gap-0.5">
            {event.event_schedule && (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-[var(--fg-muted)]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatSchedule(event.event_schedule)}
              </div>
            )}
            {event.event_location && (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-[var(--fg-muted)]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate">{event.event_location}</span>
              </div>
            )}
            {event.event_fee && (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-[var(--fg-muted)]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                {event.event_fee}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
