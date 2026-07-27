import { NextResponse } from "next/server";
import { INITIAL_DEMO_USER } from "@/lib/seed-data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { persona } = body;

    let user = INITIAL_DEMO_USER;
    if (persona === "valkyrie") {
      user = {
        id: "user-hero-002",
        email: "valkyrie@gtopoker.io",
        password: "password123",
        name: "Victoria 'Valkyrie' Chen",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        role: "GTO Lead Analyst",
        bankroll: 145000,
        preferredTheme: "midnight",
        preferredSimRuns: 25000,
        soundEffects: true,
      };
    } else if (persona === "sammy") {
      user = {
        id: "user-hero-003",
        email: "sammy@vegasfelt.com",
        password: "password123",
        name: "Sammy 'The Rock' Miller",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
        role: "Vegas Grinder",
        bankroll: 42000,
        preferredTheme: "ruby",
        preferredSimRuns: 5000,
        soundEffects: true,
      };
    }

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
