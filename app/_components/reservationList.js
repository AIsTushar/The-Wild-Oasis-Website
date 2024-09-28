"use client";
import { useOptimistic } from "react";

import ReservationCard from "./ReservationCard";

export default function ReservationList({ bookings }) {
  useOptimistic();
  return (
    <ul className="space-y-6">
      {bookings.map((booking) => (
        <ReservationCard booking={booking} key={booking.id} />
      ))}
    </ul>
  );
}
