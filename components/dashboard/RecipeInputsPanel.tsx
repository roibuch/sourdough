"use client";

import { useEffect, useMemo } from "react";
import {
  BeakerIcon,
  CalculatorIcon,
  LinkIcon,
  ScaleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { AdviceList } from "@/components/AdviceList";
import { alarmToastMessage } from "@/components/AlarmButton";
import { BakingTimeline } from "@/components/BakingTimeline";
import { FlourBlendEditor } from "@/components/dashboard/FlourBlendEditor";
import { StarterFloatTestAlert } from "@/components/StarterFloatTestAlert";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { StarterPanel } from "@/components/sections/StarterPanel";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { RecipeCalculateFlow } from "@/hooks/useRecipeCalculateFlow";
import { getFermentationFactorWarning } from "@/lib/flour";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { heContent } from "@/lib/content";
import { CUSTOM_FLOUR_NOTE } from "@/lib/validation/recipeValidation";
import { cn } from "@/lib/cn";

const inp = heContent.inputs;

interface RecipeInputsPanelProps {
  form: RecipeForm;
  calculateFlow: RecipeCalculateFlow;
  /** Mobile bottom sheet — tighter single-column layout */
  compact?: boolean;
  /** Desktop sticky sidebar vs full-width contexts */
  surface?: "sidebar" | "sheet" | "default";
}

export function RecipeInputsPanel({
  form,
  calculateFlow,
  compact,
  surface = "default",
}: RecipeInputsPanelProps) {
  const isSidebar = surface === "sidebar";
  const {
    totalWeight,
    setWeightDraftValue,
    commitTotalWeight,
    waterPct,
    setWaterPct,
    starterPct,
    setStarterPct,
    saltPct,
    setSaltPct,
    preset,
    mix,
    setPresetNote,
    flourDraft,
    commitFlourPcts,
    handleCopyLink,
    handleClearStorage,
    openStarterOnlyGuide,
    showToast,
    keepInJarG,
    setKeepInJarG,
    hoursToAutolyse,
    roomTemp,
    coldRetardHours,
    fermentationPace,
  } = form;

  const {
    validation,
    requestCalculate,
  } = calculateFlow;

  const fermentationAlert = useMemo(
    () => getFermentationFactorWarning(mix),
    [mix],
  );

  useEffect(() => {
    if (preset === "custom") {
      setPresetNote(CUSTOM_FLOUR_NOTE(mix.totalPct));
    }
  }, [mix.totalPct, preset, setPresetNote]);

  const calculateBtn = (
    <button
      type="button"
      className="cta-primary flex items-center justify-center gap-2 disabled:opacity-50"
      onClick={requestCalculate}
      disabled={!validation.canCalculate}
    >
      <CalculatorIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      {inp.actions.calculate}
    </button>
  );

  return (
    <div
      className={cn(
        "@container/panel flex min-w-0 max-w-full flex-col overflow-x-clip",
        compact && "pb-2",
        (isSidebar || compact) && "space-y-4",
        !isSidebar && !compact && "space-y-4",
      )}
    >
      {!compact && (
        <div className={cn(isSidebar && "lg:hidden")}>
          <StarterFloatTestAlert />
        </div>
      )}

      <Accordion
        type="multiple"
        defaultValue={
          compact
            ? ["dough"]
            : isSidebar
              ? ["dough", "flour"]
              : ["dough", "flour"]
        }
      >
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
              min={1}
              max={10000}
              step={100}
              allowEmpty
              deferCommit
              exactCommit
              onChange={(v) => setWeightDraftValue(v > 0 ? String(v) : "")}
              onDeferredBlur={commitTotalWeight}
              minusLabel={inp.actions.decreaseWeight}
              plusLabel={inp.actions.increaseWeight}
              jumpStep={100}
              suffix="גרם"
              compact
              error={validation.fields.totalWeight?.invalid}
              hint={validation.fields.totalWeight?.message}
            />

            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-sm font-medium text-text-primary">
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
              hint={
                validation.fields.waterPct?.message ??
                inp.fields.hydrationHint
              }
            />

            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-1.5">
                <label
                  htmlFor="starterPct"
                  className="text-sm font-medium text-text-primary"
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

            {!compact && (
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
            )}

            {!compact && !isSidebar && calculateBtn}
          </div>
        </AccordionItem>

        <AccordionItem
          id="flour"
          title={compact ? inp.accordion.flourBlend : inp.accordion.flour}
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

          {compact && (
            <SmartNumberInput
              id="saltPctMobile"
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
          )}

          {!compact && <div className="mt-4">{calculateBtn}</div>}
        </AccordionItem>

        {!compact && (
          <AccordionItem
            id="starter"
            title="מחמצת (אופציונלי)"
            icon={<BeakerIcon className="h-5 w-5" strokeWidth={1.75} />}
          >
            <StarterPanel form={form} />
            <div className="mt-4">
              <SmartNumberInput
                id="keepInJar"
                label="כמות להשאיר בצנצנת (גרם)"
                value={keepInJarG}
                min={0}
                max={500}
                step={5}
                onChange={setKeepInJarG}
                minusLabel="הפחת"
                plusLabel="הוסף"
                compact
              />
            </div>
          </AccordionItem>
        )}
      </Accordion>

      {!compact && (
      <div className={cn(isSidebar && "lg:hidden")}>
        <BakingTimeline
          dough={{
            starterPct,
            waterPct,
            flourPcts: flourDraft,
            roomTempC: roomTemp,
            hoursToAutolyse,
            coldRetardHours,
            fermentationPace,
          }}
          showFloatTestReminder={false}
          onAlarmResult={(type) => showToast(alarmToastMessage(type))}
        />
      </div>
      )}

      {isSidebar && (
        <div className="hidden lg:block">
          {calculateBtn}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <Button variant="ghost" fullWidth onClick={handleCopyLink}>
          <LinkIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          {inp.actions.share}
        </Button>
        <Button variant="ghost" fullWidth onClick={handleClearStorage}>
          <TrashIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          {inp.actions.clearStorage}
        </Button>
        {!compact && (
          <Button variant="ghost" fullWidth onClick={openStarterOnlyGuide}>
            <BeakerIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            מדריך מחמצת בלבד
          </Button>
        )}
      </div>
    </div>
  );
}
