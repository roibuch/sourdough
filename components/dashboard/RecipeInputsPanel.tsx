"use client";

import { useEffect, useMemo, useState } from "react";
import { FlourBalanceDialog } from "@/components/dashboard/FlourBalanceDialog";
import {
  BeakerIcon,
  CalculatorIcon,
  LinkIcon,
  ScaleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { AdviceList } from "@/components/AdviceList";
import { BakingTimeline } from "@/components/BakingTimeline";
import { FlourBlendEditor } from "@/components/dashboard/FlourBlendEditor";
import { StarterFloatTestAlert } from "@/components/StarterFloatTestAlert";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { StarterPanel } from "@/components/sections/StarterPanel";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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
  /** Mobile bottom sheet — tighter single-column layout */
  compact?: boolean;
  /** Desktop sticky sidebar vs full-width contexts */
  surface?: "sidebar" | "sheet" | "default";
}

export function RecipeInputsPanel({
  form,
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
    needsFlourBalance,
    runCalculate,
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

  const [balanceOpen, setBalanceOpen] = useState(false);

  const onCalculate = () => {
    if (!validation.canCalculate) {
      const first =
        validation.fields.totalWeight?.message ??
        validation.fields.waterPct?.message;
      showToast(first ?? VALIDATION_BLOCKED_MESSAGE);
      return;
    }
    commitTotalWeight();
    commitFlourPcts(flourDraft);
    if (needsFlourBalance(flourDraft)) {
      setBalanceOpen(true);
      return;
    }
    runCalculate();
  };

  const onBalanceConfirm = (balanced: number[]) => {
    commitFlourPcts(balanced);
    setBalanceOpen(false);
    runCalculate();
  };

  useEffect(() => {
    if (preset === "custom") {
      setPresetNote(CUSTOM_FLOUR_NOTE(mix.totalPct));
    }
  }, [mix.totalPct, preset, setPresetNote]);

  return (
    <div
      className={cn(
        "@container/panel min-w-0 max-w-full space-y-4 overflow-x-clip",
        compact && "pb-2",
      )}
    >
      <FlourBalanceDialog
        open={balanceOpen}
        pcts={flourDraft}
        onCancel={() => setBalanceOpen(false)}
        onConfirm={onBalanceConfirm}
      />

      <div className={cn(isSidebar && "lg:hidden")}>
        <StarterFloatTestAlert />
      </div>

      <Accordion type="multiple" defaultValue={["dough", "flour"]}>
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
              step={1}
              allowEmpty
              deferCommit
              exactCommit
              onChange={(v) => setWeightDraftValue(v > 0 ? String(v) : "")}
              onDeferredBlur={commitTotalWeight}
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

            <div
              className={cn(
                "grid min-w-0 gap-4",
                compact || isSidebar
                  ? "grid-cols-1"
                  : "grid-cols-1 @xl/panel:grid-cols-2",
              )}
            >
              <div className="min-w-0">
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
      </Accordion>

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
        />
      </div>

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
