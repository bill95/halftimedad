"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DashboardState = {
  createdAt: number;
  lastReset: number;
  longestStreak: number;
  lifetimeResets: number;
  totalCompletedDays: number;
  id: string;
};

const STORAGE_KEY = "halftimedad-dashboard-v1";
const DAY = 86_400_000;

function randomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function freshState(): DashboardState {
  const now = Date