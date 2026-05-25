"use client";

import { useEffect, useMemo } from "react";
import {
  BeakerIcon,
  CalculatorIcon,
  FireIcon,
  LinkIcon,
  ScaleIcon,
  SunIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { AdviceList } from "@/components/AdviceList";
import { FlourBlendEditor } from "@/components/dashboard/FlourBlendEditor";
import { DoughTemperatureCalculator } from "@/components/DoughTemperatureCalculator";
import { ExpressModePanel } from "@/components/ExpressModePanel";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { StarterPanel } from "@/components/sections/StarterPanel";
import { WeatherPanel } from "@/components/WeatherPanel";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { FieldLabelWithTip, InfoTooltip } from "@/components/ui/InfoTooltip";
import { useRecipeValidation } from "@/hooks/useRecipeValidation";
import { getFermentationFactorWarning } from "@/lib/flour";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent } from "@/lib/content";
import {
  CUSTOM_FLOUR_NOTE,
  VALIDATION_BLOCKED_MESSAGE,
} from "@/lib/validation/recipeValidation";
import { cn } from "@/lib/cn";

const inp = heContent.inputs;

interface RecipeInputsPanelProps {
  form: RecipeForm;
  compact?: boolean;
}

export function RecipeInputsPanel({ form, compact }: RecipeInputsPanelProps) {
  const {
    totalWeight,
    setTotalWeight,
    waterPct,
    setWaterPct,
    starterPct,
    setStarterPct,
    saltPct,
    setSaltPct,
    preset,
    mix,
    presetNote,
    setPresetNote,
    handleCalculate,
    handleCopyLink,
    handleClearStorage,
    openStarterOnlyGuide,
    showToast,
    coldRetardHours,
    setColdRetardHours,
    hoursToAutolyse,
    setHoursToAutolyse,
    roomTemp,
    setRoomTemp,
  } = form;

  const validation = useRecipeValidation({
    totalWeight,
    waterPct,
    starterPct,
    saltPct,
    mix,
  });

  const fermentationAlert = useMemo(
    () => getFermentationFactorWarning(mix),
    [mix],
  );

  const onCalculate = () => {
    if (!validation.canCalculate) {
      const first =
        validation.fields.totalWeight?.message ??
        validation.fields.flourTotal?.message ??
        validation.fields.waterPct?.message;
      showToast(first ?? VALIDATION_BLOCKED_MESSAGE);
      return;
    }
    handleCalculate();
  };

  useEffect(() => {
    if (preset === "custom") {
      setPresetNote(CUSTOM_FLOUR_NOTE(mix.totalPct));
    }
  }, [mix.totalPct, preset, setPresetNote]);

  const defaultOpen = compact ? ["dough", "flour"] : ["dough", "flour"];

  return (
    <div className={cn("space-y-4", compact && "pb-2")}>
      <Accordion type="multiple" defaultValue={defaultOpen}>
        <AccordionItem
          id="dough"
          title={inp.accordion.dough}
          icon={<ScaleIcon className="h-5 w-5" strokeWidth={1.75} />}
        >
          <div className="space-y-5">
            <SmartNumberInput
              id="totalWeightStepper"
              label={inp.fields.doughWeight}
              value={parseFloat(totalWeight) || 0}
              min={100}
              max={5000}
              step={50}
              allowEmpty
              onChange={(v) => setTotalWeight(v > 0 ? String(v) : "")}
              minusLabel={inp.actions.decreaseWeight}
              plusLabel={inp.actions.increaseWeight}
              compact
              error={validation.fields.totalWeight?.invalid}
              hint={validation.fields.totalWeight?.message}
            />

            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-800">
                {inp.fields.hydration}
              </span>
              <InfoTooltip term="hydration" />
            </div>
            <RangeSlider
              id="hydration-slider"
              label=""
              value={waterPct}
              min={55}
              max={95}
              step={1}
              onChange={setWaterPct}
              error={validation.fields.waterPct?.invalid}
              hint={validation.fields.waterPct?.message}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <label
                    htmlFor="starterPct"
                    className="text-sm font-semibold text-slate-800"
                  >
                    {inp.fields.inoculation}
                  </label>
                  <InfoTooltip term="inoculation" />
                </div>
                <SmartNumberInput
                  id="starterPct"
                  allowEmpty
                  label=""
                  value={starterPct}
                  min={1}
                  max={80}
                  step={1}
                  onChange={setStarterPct}
                  minusLabel={inp.actions.decreaseInoculation}
                  plusLabel={inp.actions.increaseInoculation}
                  compact
                  error={validation.fields.starterPct?.invalid}
                  warning={validation.fields.starterPct?.warning}
                  hint={validation.fields.starterPct?.message}
                />
              </div>
              <SmartNumberInput
                id="saltPct"
                allowEmpty
                label={inp.fields.salt}
                value={saltPct}
                min={0.5}
                max={5}
                step={0.1}
                onChange={setSaltPct}
                minusLabel={inp.actions.decreaseSalt}
                plusLabel={inp.actions.increaseSalt}
                compact
                error={validation.fields.saltPct?.invalid}
                warning={validation.fields.saltPct?.warning}
                hint={validation.fields.saltPct?.message}
              />
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={onCalculate}
              disabled={!validation.canCalculate}
            >
              <CalculatorIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              {inp.actions.calculate}
            </Button>
          </div>
        </AccordionItem>

        <AccordionItem
          id="flour"
          title={inp.accordion.flour}
          icon={<ScaleIcon className="h-5 w-5" strokeWidth={1.75} />}
        >
          <FlourBlendEditor
            form={form}
            flourTotalInvalid={validation.flourTotalInvalid}
            flourTotalMessage={validation.fields.flourTotal?.message}
          />
          {fermentationAlert && (
            <div className="mt-3">
              <AdviceList items={[fermentationAlert]} />
            </div>
          )}
        </AccordionItem>

        {!compact && (
          <AccordionItem
            id="starter"
            title="מחמצת (אופציונלי)"
            icon={<BeakerIcon className="h-5 w-5" strokeWidth={1.75} />}
          >
            <ExpressModePanel form={form} />
            <div className="mt-4">
              <StarterPanel form={form} />
            </div>
          </AccordionItem>
        )}

        {!compact && (
          <AccordionItem
            id="timing"
            title="תזמון בסיסי"
            icon={<SunIcon className="h-5 w-5" strokeWidth={1.75} />}
          >
            <div className="space-y-4">
              <RangeSlider
                id="room-temp"
                label="טמפרטורת חדר (°C)"
                value={roomTemp}
                min={16}
                max={32}
                step={1}
                unit="°C"
                onChange={setRoomTemp}
              />
              <SmartNumberInput
                id="coldRetard"
                label="התפחה במקרר (שעות)"
                suffix="שעות"
                value={coldRetardHours}
                min={4}
                max={24}
                step={1}
                onChange={setColdRetardHours}
                minusLabel="הפחת"
                plusLabel="הוסף"
                compact
              />
              <RangeSlider
                id="hta-slider"
                label="שעות עד אוטוליזה"
                value={hoursToAutolyse}
                min={2}
                max={12}
                step={0.5}
                unit=" ש׳"
                formatValue={(v) => `${v} שע׳`}
                onChange={setHoursToAutolyse}
              />
              <WeatherPanel form={form} />
            </div>
          </AccordionItem>
        )}

        {!compact && (
          <AccordionItem
            id="ddt"
            title={inp.accordion.ddt}
            icon={<FireIcon className="h-5 w-5" strokeWidth={1.75} />}
          >
            <DoughTemperatureCalculator form={form} />
          </AccordionItem>
        )}
      </Accordion>

      <div className="flex flex-col gap-2 pt-2">
        <Button variant="ghost" fullWidth onClick={handleCopyLink}>
          <LinkIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          העתקת קישור
        </Button>
        <Button variant="ghost" fullWidth onClick={handleClearStorage}>
          <TrashIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          איפוס שמירה
        </Button>
        <Button variant="ghost" fullWidth onClick={openStarterOnlyGuide}>
          <BeakerIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          מדריך מחמצת בלבד
        </Button>
      </div>
    </div>
  );
}
