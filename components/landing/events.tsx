"use client";

import Link from "next/link";

const upcomingEvents = [
  {
    title: "Spring Beach Party",
    date: "May 18, 2026",
    time: "11:00 AM",
    location: "Gulfport, MS",
    attendees: 18,
    type: "In-person",
  },
  {
    title: "Virtual Game Night",
    date: "April 5, 2026",
    time: "7:30 PM",
    location: "Online",
    attendees: 24,
    type: "Virtual",
  },
  {
    title: "Brunch & Books",
    date: "April 20, 2026",
    time: "11:00 AM",
    location: "New Orleans, LA",
    attendees: 12,
    type: "In-person",
  },
];

export function Events() {
  return (
    <section className="bg-background py-12 md:py-20">
      <div className="container-app">
        {/* Section Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:mb-14 md:flex-row md:items-end">
          <div>
            <span className="mb-3 inline-block rounded-full bg-blush px-4 py-1.5 text-sm font-semibold text-wine">
              Community Events
            </span>
            <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground md:text-4xl">
              What's happening
            </h2>
            <p className="max-w-xl text-pretty text-muted-foreground">
              From virtual hangouts to in-person meetups, there's always
              something fun on the calendar.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-sunset transition-colors hover:text-wine"
          >
            View all events
            <span>→</span>
          </Link>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <div
              key={event.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-coral/50 hover:shadow-lg hover:shadow-coral/10 md:p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Event Info */}
                <div className="flex gap-4">
                  {/* Date Badge */}
                  <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-coral to-sunset text-white shadow-md shadow-sunset/20 md:h-16 md:w-16">
                    <span className="text-xs font-medium uppercase opacity-90">
                      {event.date.split(" ")[0]}
                    </span>
                    <span className="text-xl font-bold leading-none md:text-2xl">
                      {event.date.split(" ")[1].replace(",", "")}
                    </span>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground md:text-lg">
                        {event.title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          event.type === "Virtual"
                            ? "bg-dusty-rose/20 text-dusty-rose"
                            : "bg-blush text-wine"
                        }`}
                      >
                        {event.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📍</span>
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>👥</span>
                        {event.attendees} attending
                      </span>
                    </div>
                  </div>
                </div>

                {/* RSVP Button */}
                <button className="mt-2 inline-flex items-center justify-center rounded-xl bg-blush px-5 py-2.5 text-sm font-semibold text-wine transition-all hover:bg-coral hover:text-white md:mt-0">
                  RSVP
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
