"use client";

import dynamic from "next/dynamic";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { BlackoutPeriodsEditor } from "@/components/scheduling/BlackoutPeriodsEditor";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent, t } from "@/lib/content";

const sch = heContent.inputs.schedule;

const WeatherPanel = dynamic(
  () =>
    import("@/components/WeatherPanel").then((m) => ({
      default: m.WeatherPanel,
    })),
  { loading: () => null },
);

interface ScheduleAdjustmentsPanelProps {
  form: RecipeForm;
}

export function ScheduleAdjustmentsPanel({ form }: ScheduleAdjustmentsPanelProps) {
  return (
    <div className="space-y-6">
      <p className="flex items-start gap-2 text-sm text-stone-600">
        <AdjustmentsHorizontalIcon
          className="mt-0.5 h-5 w-5 shrink-0 text-crust"
          strokeWidth={1.75}
          aria-hidden
        />
        <span>{sch.accordion.adjustmentsHint}</span>
      </p>

      <WeatherPanel form={form} />

      <div className="rounded-2xl border border-warm-border/80 bg-dough/80 p-4 space-y-5">
        <RangeSlider
          id="schedule-room-temp"
          label="טמפרטורת בסיס לתזמון (°C)"
          value={form.roomTemp}
          min={16}
          max={32}
          step={1}
          unit="°C"
          onChange={(v) => {
            form.setRoomTemp(v);
            if (form.showTimeline && form.targetBakeTime) {
              form.rebuildTimeline(true);
            }
          }}
        />

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <label
              htmlFor="schedule-cold-retard"
              className="text-sm font-semibold text-stone-800"
            >
              התפחה במקרר
            </label>
            <InfoTooltip term="retard" />
          </div>
          <SmartNumberInput
            id="schedule-cold-retard"
            label=""
            suffix="שעות"
            value={form.coldRetardHours}
            min={4}
            max={24}
            step={1}
            onChange={(v) => {
              form.setColdRetardHours(v);
              if (form.showTimeline && form.targetBakeTime) {
                form.rebuildTimeline(true);
              }
            }}
            minusLabel="הפחת"
            plusLabel="הוסף"
            compact
          />
        </div>
      </div>

      <BlackoutPeriodsEditor
        blackouts={form.blackouts}
        onChange={(next) => {
          form.setBlackouts(next);
          if (form.showTimeline && form.targetBakeTime) {
            form.rebuildTimeline(true);
          }
        }}
      />

      <p className="text-xs text-stone-500">
        {t(sch.planFooter, {
          starter: form.starterPct,
          autolyse: form.hoursToAutolyse,
          temp: form.roomTemp,
        })}
      </p>
    </div>
  );
}
