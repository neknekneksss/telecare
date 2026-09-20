"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PRACTITIONER_MONTHLY_PRICE = 750;
export const PRACTITIONER_ANNUAL_PRICE = 1500;

export type SubscriptionPlan = "monthly" | "annual";
export type SubscriptionStatus = "inactive" | "active";

interface SubscriptionState {
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  activatedAt: string | null;
  renewalDate: string | null;

  activateSubscription: (plan: SubscriptionPlan) => void;
  cancelSubscription: () => void;
  isActive: () => boolean;
}

function getNextRenewalDate(fromDate: Date, plan: SubscriptionPlan): string {
  const renewalDate = new Date(fromDate);

  if (plan === "annual") {
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  } else {
    renewalDate.setMonth(renewalDate.getMonth() + 1);
  }

  return renewalDate.toISOString();
}

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      status: "inactive",
      plan: null,
      activatedAt: null,
      renewalDate: null,

      activateSubscription: (plan) => {
        const activatedAt = new Date();

        set({
          status: "active",
          plan,
          activatedAt: activatedAt.toISOString(),
          renewalDate: getNextRenewalDate(activatedAt, plan),
        });
      },

      cancelSubscription: () => {
        set({
          status: "inactive",
          plan: null,
          activatedAt: null,
          renewalDate: null,
        });
      },

      isActive: () => {
        return get().status === "active";
      },
    }),
    {
      name: "telecare-practitioner-subscription",
    },
  ),
);
