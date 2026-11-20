import { auth } from "@/modules/auth/managed";

export const runtime = "nodejs";
export const { GET, POST, PUT, PATCH, DELETE } = auth.handler();
