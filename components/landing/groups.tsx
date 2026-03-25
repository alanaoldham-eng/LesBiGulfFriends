"use client";

import { BookOpen, Dumbbell, Palette, MapPin, Coffee, Music } from "lucide-react";

const groups = [
  {
    icon: BookOpen,
    name: "Book Club",
    members: 24,
    description: "Monthly reads & cozy discussions",
  },
  {
    icon: Dumbbell,
    name: "Fitness Friends",
    members: 18,
    description: "Workout buddies & wellness tips",
  },
  {
    icon: Palette,
    name: "Creative Corner",
    members: 31,
    description: "Art, crafts & creative projects",
  },
  {
    icon: MapPin,
    name: "Gulf Coast Adventurers",
    members: 42,
    description: "Local meetups & outdoor fun",
  },
  {
    icon: Coffee,
    name: "Coffee & Chat",
    members: 56,
    description: "Casual conversations & support",
  },
  {
    icon: Music,
    name: "Music Lovers",
    members: 27,
    description: "Concerts, playlists & jams",
  },
];

export function Groups() {
  return (
    <section className="bg-gradient-to-b from-background to-blush/20 py-12 md:py-20">
      <div className="container-app">
        {/* Section Header */}
        <div className="mb-10 text-center md:mb-14">
          <span className="mb-3 inline-block rounded-full bg-blush px-4 py-1.5 text-sm font-semibold text-wine">
            Interest Groups
          </span>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            Find your people
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            Join interest-based groups to connect with women who share your
            passions. From book clubs to hiking crews, there's a place for
            everyone.
          </p>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {groups.map((group) => (
            <div
              key={group.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-coral/50 hover:shadow-lg hover:shadow-coral/10 md:p-6"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blush text-wine transition-colors group-hover:bg-coral group-hover:text-white md:h-12 md:w-12">
                <group.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-foreground md:text-base">
                {group.name}
              </h3>
              <p className="mb-2 text-xs text-muted-foreground md:text-sm">
                {group.description}
              </p>
              <div className="flex items-center gap-1 text-xs font-medium text-wine">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blush text-[10px]">
                  {group.members}
                </span>
                <span>members</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
