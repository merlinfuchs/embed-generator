import { useState } from "react";
import {
  FREE_LIMITS,
  PLAN_PRICES,
  PREMIUM_PLAN,
  ULTIMATE_PLAN,
  usePlan,
} from "../util/plans";
import { useConsumableEntitlement } from "../util/premium";
import ConfirmModal from "./ConfirmModal";
import PlanCard, { PlanButton, PlanLink } from "./PlanCard";

const bold = (text: string | number) => (
  <span className="font-medium text-white">{text}</span>
);

interface Props {
  /** Show the Ultimate card as an upgrade for a server that already has Premium. */
  upgrade?: boolean;
  /** The server already has this plan, so the card leads to managing it. */
  current?: boolean;
}

function ManageLink() {
  return <PlanLink href="/premium">Manage Subscription</PlanLink>;
}

function useActivation(plan: string) {
  const [modal, setModal] = useState(false);
  const { entitlementId, guildId, activate, pending } =
    useConsumableEntitlement(plan);

  const confirm = modal && (
    <ConfirmModal
      title={`Are you sure that you want to activate ${plan.toLowerCase()} for this server?`}
      subTitle={`${plan} will be activated for the server with the id '${guildId}'. Once activated you can't move it to another server.`}
      pending={pending}
      onClose={() => setModal(false)}
      onConfirm={() => activate(() => setModal(false))}
    />
  );

  return { entitlementId, open: () => setModal(true), confirm };
}

export function PremiumPlanCard({ current }: Props) {
  const premium = usePlan(PREMIUM_PLAN);
  const { entitlementId, open, confirm } = useActivation(PREMIUM_PLAN);

  return (
    <>
      <PlanCard
        name="Premium"
        tagline="Everything you need for a single server."
        price={PLAN_PRICES[PREMIUM_PLAN]}
        badge={current ? "Current plan" : "Best value"}
        highlight
        stats={
          premium
            ? [
                { value: premium.max_saved_messages, label: "saved messages" },
                {
                  value: premium.max_periodic_scheduled_messages,
                  label: "scheduled",
                },
                { value: premium.max_custom_commands, label: "commands" },
              ]
            : []
        }
        intro="Everything in Free, and:"
        features={[
          {
            key: "ai",
            content: <>More prompts for the {bold("AI assistant")}</>,
          },
          {
            key: "bot",
            content: (
              <>Your {bold("custom bot")} with its own username and avatar</>
            ),
          },
          {
            key: "commands",
            content: <>{bold("Custom commands")} with your own branding</>,
          },
          {
            key: "actions",
            content: (
              <>
                Up to {bold(premium?.max_actions_per_component ?? "more")}{" "}
                actions on each interactive component
              </>
            ),
          },
          {
            key: "forms",
            content: (
              <>
                Up to {bold(`${premium?.max_forms ?? "more"} forms`)} to ask
                members for input
              </>
            ),
          },
          {
            key: "channels",
            content: (
              <>
                Buttons, select menus and commands can{" "}
                {bold("send to other channels")}
              </>
            ),
          },
          {
            key: "schedules",
            content: (
              <>Scheduled messages that repeat or go out on several dates</>
            ),
          },
        ]}
        action={
          current ? (
            <ManageLink />
          ) : entitlementId ? (
            <PlanButton primary onClick={open}>
              Activate Premium
            </PlanButton>
          ) : (
            <PlanLink primary href="/premium">
              Get Premium
            </PlanLink>
          )
        }
      />
      {confirm}
    </>
  );
}

export function UltimatePlanCard({ upgrade, current }: Props) {
  const ultimate = usePlan(ULTIMATE_PLAN);
  const { entitlementId, open, confirm } = useActivation(ULTIMATE_PLAN);
  if (!ultimate) return null;

  return (
    <>
      <PlanCard
        name="Ultimate"
        tagline="For servers that outgrow Premium."
        price={PLAN_PRICES[ULTIMATE_PLAN]}
        badge={current ? "Current plan" : undefined}
        highlight={current}
        stats={[
          { value: ultimate.max_saved_messages, label: "saved messages" },
          { value: ultimate.max_scheduled_messages, label: "scheduled" },
          { value: ultimate.max_custom_commands, label: "commands" },
        ]}
        intro="Everything in Premium, and:"
        features={[
          {
            key: "large",
            content: <>Much higher limits for {bold("large servers")}</>,
          },
          {
            key: "versions",
            content: (
              <>
                Keep {bold(ultimate.max_saved_message_versions)} earlier
                versions of each saved message
              </>
            ),
          },
          {
            key: "actions",
            content: (
              <>
                Up to {bold(ultimate.max_actions_per_component)} actions on each
                interactive component
              </>
            ),
          },
          {
            key: "forms",
            content: (
              <>
                Up to {bold(`${ultimate.max_forms} forms`)} to ask members for
                input
              </>
            ),
          },
          {
            key: "ai",
            content: (
              <>
                Use the {bold("AI assistant")} up to{" "}
                {ultimate.max_ai_prompts_per_month} times a month
              </>
            ),
          },
        ]}
        action={
          current ? (
            <ManageLink />
          ) : entitlementId ? (
            <PlanButton onClick={open}>Activate Ultimate</PlanButton>
          ) : (
            <PlanLink href="/premium">
              {upgrade ? "Upgrade to Ultimate" : "Get Ultimate"}
            </PlanLink>
          )
        }
      />
      {confirm}
    </>
  );
}

export function BasicPlanCard() {
  return (
    <PlanCard
      name="Basic"
      tagline="Everything you need to get started."
      price="Free"
      period=""
      badge="Current"
      stats={[
        { value: FREE_LIMITS.max_saved_messages, label: "saved messages" },
        { value: FREE_LIMITS.max_scheduled_messages, label: "scheduled" },
        { value: FREE_LIMITS.max_actions_per_component, label: "actions" },
      ]}
      features={[
        {
          key: "editor",
          content: <>{bold("Visual editor")} with a live preview</>,
        },
        {
          key: "send",
          content: <>Send through webhooks or to a channel through the bot</>,
        },
        {
          key: "components",
          content: (
            <>
              Buttons and select menus with up to{" "}
              {bold(`${FREE_LIMITS.max_actions_per_component} actions`)}
            </>
          ),
        },
        {
          key: "forms",
          content: (
            <>
              Up to {bold(`${FREE_LIMITS.max_forms} forms`)} to ask members for
              input
            </>
          ),
        },
        {
          key: "ai",
          content: (
            <>
              {bold("AI assistant")} with {FREE_LIMITS.max_ai_prompts_per_month}{" "}
              prompts a month
            </>
          ),
        },
      ]}
      action={
        <PlanButton disabled style={{ cursor: "default" }}>
          Current plan
        </PlanButton>
      }
    />
  );
}
