"use client";

import { useEffect, useMemo } from "react";
import {
  BeakerIcon,
  CalculatorIcon,
  FireIcon,
  ScaleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { AdviceList } from "@/components/AdviceList";
import { DoughTemperatureCalculator } from "@/components/DoughTemperatureCalculator";
import { FlourBlendEditor } from "@/components/dashboard/FlourBlendEditor";
import { ShareRecipeLinkButton } from "@/components/dashboard/ShareRecipeLinkButton";
import { useRecipeNav } from "@/components/dashboard/RecipeNavContext";
import { FloatTestCompact } from "@/components/feedback/FloatTestReminder";
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
  compact?: boolean;
  surface?: "sidebar" | "sheet" | "default";
  /** Hide primary CTA when shell renders it elsewhere */
  hidePrimaryCta?: boolean;
}

export function RecipeInputsPanel({
  form,
  calculateFlow,
  compact,
  surface = "default",
  hidePrimaryCta = false,
}: RecipeInputsPanelProps) {
  const isSidebar = surface === "sidebar";
  const fieldNarrow = isSidebar || compact;
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
    commitFlourPcts,
    handleCopyLink,
    handleClearStorage,
    openStarterOnlyGuide,
  } = form;

  const recipeNav = useRecipeNav();
  const { validation, requestCalculate } = calculateFlow;

  const goToGuide = () => {
    openStarterOnlyGuide();
    recipeNav?.navigateToGuide();
  };

  const fermentationAlert = useMemo(
    () => getFermentationFactorWarning(mix),
    [mix],
  );

  useEffect(() => {
    if (preset === "custom") {
      setPresetNote(CUSTOM_FLOUR_NOTE(mix.totalPct));
    }
  }, [mix.totalPct, preset, setPresetNote]);

  const showDesktopPrimaryCta =
    !hidePrimaryCta && (surface === "sidebar" || surface === "default");

  const primaryCta = (
    <button
      type="button"
      className="cta-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
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
        "@container/panel flex min-w-0 max-w-full flex-col overflow-x-hidden",
        compact && "pb-2",
        "space-y-4",
      )}
    >
      <Accordion
        type="multiple"
        defaultValue={
          compact ? ["dough", "flour"] : ["dough", "flour", "starter", "ddt"]
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
              narrow={fieldNarrow}
              error={validation.fields.totalWeight?.invalid}
              hint={validation.fields.totalWeight?.message}
            />

            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-sm font-medium text-text-primary">
                {inp.fields.hydration}
              </span>
              <InfoTooltip term="hydration" hover />
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
                <InfoTooltip term="inoculation" hover />
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
                narrow={fieldNarrow}
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
                narrow={fieldNarrow}
                error={validation.fields.saltPct?.invalid}
                warning={validation.fields.saltPct?.warning}
                hint={validation.fields.saltPct?.message}
              />
            )}
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
            inSidebar={isSidebar}
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
              narrow={fieldNarrow}
              error={validation.fields.saltPct?.invalid}
              warning={validation.fields.saltPct?.warning}
              hint={validation.fields.saltPct?.message}
            />
          )}
        </AccordionItem>

        <AccordionItem
          id="starter"
          title="האכלת מחמצת"
          icon={<BeakerIcon className="h-5 w-5" strokeWidth={1.75} />}
        >
          <StarterPanel form={form} inSidebar={isSidebar} />
        </AccordionItem>

        <AccordionItem
          id="ddt"
          title={heContent.ddt.title}
          icon={<FireIcon className="h-5 w-5" strokeWidth={1.75} />}
        >
          <DoughTemperatureCalculator form={form} />
        </AccordionItem>
      </Accordion>

      {showDesktopPrimaryCta && (
        <div className="hidden space-y-3 pt-1 lg:block">
          <FloatTestCompact />
          {primaryCta}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
        <ShareRecipeLinkButton onShare={handleCopyLink} />
        <Button variant="ghost" fullWidth onClick={handleClearStorage}>
          <TrashIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          {inp.actions.clearStorage}
        </Button>
        {!compact && (
          <Button variant="ghost" fullWidth onClick={goToGuide}>
            <BeakerIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            {inp.actions.starterOnly}
          </Button>
        )}
      </div>
    </div>
  );
}
