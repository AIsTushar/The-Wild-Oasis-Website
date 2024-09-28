"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "./auth";
import supabase from "./supabase";
import { getBookings } from "./data-service";
import { redirect } from "next/navigation";

const nationalIdRegex = /^[a-zA-Z0-9]{6,12}$/;

function validateNationalId(nationalId) {
  return nationalIdRegex.test(nationalId);
}

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be looged in!!");
  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!validateNationalId(nationalID))
    throw new Error("Invalid National ID, please provide a valid national ID");

  const updateData = { nationalID, nationality, countryFlag };

  const { data, error } = await supabase
    .from("guests")
    .update(updateData)
    .eq("id", session.user.guestId);

  if (error) throw new Error("Guest could not be updated");

  revalidatePath("/account/profile");
}

export async function deleteReservation(id) {
  const session = await auth();
  if (!session) throw new Error("You must be looged in!!");

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingsIds.includes(id))
    throw new Error("You are not allowed to deleted this bookings");

  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Booking could not be deleted");
  }

  revalidatePath("/account/reservations");
}

export async function updateBooking(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in!!");

  const bookingId = Number(formData.get("bookingId"));

  const guestBookings = await getBookings(session.user.guestId);
  const guestBookingsIds = guestBookings.map((booking) => booking.id);

  if (!guestBookingsIds.includes(bookingId))
    throw new Error("You are not allowed to edit this bookings");

  const updateData = {
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
  };

  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .select()
    .single();

  if (error) {
    throw new Error("Booking could not be updated");
  }

  revalidatePath(`/account/reservations/edit/${bookingId}`);
  revalidatePath("/account/reservations");
  redirect("/account/reservations");
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
