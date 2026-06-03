"use client";

import { useMemo, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { AdviceList } from "@/components/AdviceList";
import { StepTimerButton } from "@/components/StepTimerButton";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { SmartNumberInput } from "@/components/SmartNumberInput";
import { TemperatureInput } from "@/components/ui/TemperatureInput";
import { Card } from "@/components/ui/Card";
import { MasterBakerTip } from "@/components/ui/MasterBakerTip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buildBakingGuidePlan } from "@/lib/bakingGuidePlan";
import { isFermentolyse } from "@/lib/restMethod";
import { expressModeSummary } from "@/lib/expressMode";
import { heContent, t } from "@/lib/content";
import { getBassinageAmounts } from "@/lib/bakingMath";
import type { RecipeForm } from "@/hooks/useRecipeForm";
import { cn } from "@/lib/cn";

const g = heContent.guide;

export function BakingGuide({ form }: { form: RecipeForm }) {
  const {
    results,
    showResults,
    showGuide,
    starterOnlyMode,
    mix,
    waterPct,
    starterPct,
    roomTemp,
    hoursToAutolyse,
    coldRetardHours,
    fermentationPace,
    setFermentationPace,
    restMethod,
    setRoomTemp,
    roomTempUnknown,
    setRoomTempUnknownMode,
    setColdRetardHours,
    setHoursToAutolyse,
    showToast,
  } = form;

  const [showDetails, setShowDetails] = useState(true);

  const bassinage = results ? getBassinageAmounts(results.water) : null;

  const plan = useMemo(() => {
    if (!showResults && starterOnlyMode) return null;
    return buildBakingGuidePlan({
      mix,
      waterPct,
      starterPct,
      roomTempC: roomTemp,
      hoursToAutolyse,
      coldRetardHours,
      fermentationPace,
      restMethod,
    });
  }, [
    mix,
    waterPct,
    starterPct,
    roomTemp,
    hoursToAutolyse,
    coldRetardHours,
    fermentationPace,
    restMethod,
    showResults,
    starterOnlyMode,
  ]);

  if (!showGuide) return null;

  const hideLaterSteps = starterOnlyMode && !showResults;
  const expressSummary = expressModeSummary(fermentationPace);

  return (
    <Card nested className="border-0 bg-transparent p-0 shadow-none" id="section-guide">
      <SectionHeader
        icon={<SparklesIcon className="h-6 w-6" strokeWidth={1.75} />}
        title={g.title}
        subtitle={g.subtitle}
      />

      {starterOnlyMode && !showResults && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {g.starterOnly}
        </p>
      )}

      {!hideLaterSteps && plan && (
        <>
          <p className="mb-4 rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{g.totalLabel}: </span>
            {plan.totalHoursLabel}
          </p>

          <div className="mb-6 rounded-2xl border border-border-subtle bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              {g.tuning.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  "min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  fermentationPace === "standard"
                    ? "bg-accent text-white"
                    : "border border-border-subtle bg-surface-elevated text-text-secondary",
                )}
                onClick={() => setFermentationPace("standard")}
              >
                {g.tuning.paceStandard}
              </button>
              <button
                type="button"
                className={cn(
                  "min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  fermentationPace === "express"
                    ? "bg-accent text-white"
                    : "border border-border-subtle bg-surface-elevated text-text-secondary",
                )}
                onClick={() => setFermentationPace("express")}
              >
                {g.tuning.paceExpress}
              </button>
            </div>
            <p className="mt-2 text-xs text-text-muted">{g.tuning.paceHint}</p>
            {expressSummary && (
              <p className="mt-2 text-xs text-amber-900">{expressSummary}</p>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TemperatureInput
                id="guideRoomTemp"
                label={g.tuning.roomTemp}
                suffix="°C"
                value={roomTemp}
                min={16}
                max={32}
                step={1}
                onChange={setRoomTemp}
                unknown={roomTempUnknown}
                onUnknownChange={setRoomTempUnknownMode}
                minusLabel="הפחת"
                plusLabel="הוסף"
                compact
              />
              <SmartNumberInput
                id="guideColdRetard"
                label={g.tuning.coldRetard}
                value={coldRetardHours}
                min={4}
                max={48}
                step={1}
                onChange={setColdRetardHours}
                minusLabel="הפחת"
                plusLabel="הוסף"
                compact
              />
              <SmartNumberInput
                id="guideHoursToAutolyse"
                label={g.tuning.windowLabel}
                value={hoursToAutolyse}
                min={2}
                max={16}
                step={0.5}
                onChange={setHoursToAutolyse}
                minusLabel="הפחת"
                plusLabel="הוסף"
                compact
              />
            </div>

            <button
              type="button"
              className="mt-4 min-h-[44px] text-sm font-medium text-text-muted underline-offset-2 hover:text-text-primary hover:underline"
              onClick={() => setShowDetails((v) => !v)}
            >
              {showDetails ? g.tuning.hideDetails : g.tuning.showDetails}
            </button>
          </div>

          {results && (
            <div className="mb-6 rounded-xl border border-dashed border-border-subtle px-4 py-3 text-sm text-text-secondary">
              <p className="mb-1 font-medium text-text-primary">{g.masses.title}</p>
              {isFermentolyse(restMethod) ? (
                <>
                  <p>
                    {t(g.masses.fermentolyse, {
                      flour: results.flour,
                      water: bassinage?.autolyseG ?? results.water,
                      starter: results.starter,
                    })}
                  </p>
                  <p className="mt-1">
                    {t(g.masses.mixFermentolyse, {
                      salt: results.salt,
                      bassinage: bassinage
                        ? t(g.masses.bassinage, { hold: bassinage.holdG })
                        : "",
                    })}
                  </p>
                </>
              ) : (
                <>
                  <p>
                    {t(g.masses.autolyse, {
                      flour: results.flour,
                      water: bassinage?.autolyseG ?? results.water,
                    })}
                  </p>
                  <p className="mt-1">
                    {t(g.masses.mix, {
                      starter: results.starter,
                      salt: results.salt,
                      bassinage: bassinage
                        ? t(g.masses.bassinage, { hold: bassinage.holdG })
                        : "",
                    })}
                  </p>
                </>
              )}
            </div>
          )}

          <ol className="space-y-4">
            {plan.steps.map((step, index) => (
              <li
                key={step.id}
                className="step-card list-none rounded-2xl border border-border-subtle bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-lg"
                    aria-hidden
                  >
                    {step.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-serif text-lg font-semibold text-text-primary">
                        {index + 1}. {step.title}
                        {step.id === "mix" && (
                          <span className="ms-2 inline-flex align-middle">
                            <InfoTooltip term="float-test" hover />
                          </span>
                        )}
                      </h3>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
                          {step.duration}
                        </span>
                        {step.timerMinutes && (
                          <StepTimerButton
                            label={step.title}
                            durationMinutes={step.timerMinutes}
                            onToast={showToast}
                          />
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {step.summary}
                    </p>
                    {showDetails && step.details.length > 0 && (
                      <ul className="mt-3 space-y-2 border-t border-border-subtle pt-3">
                        {step.details.map((d) => (
                          <li key={d.title} className="text-sm">
                            <span className="font-medium text-text-primary">
                              {d.title}:{" "}
                            </span>
                            <span className="text-text-secondary">{d.body}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {bassinage && (
            <MasterBakerTip className="mt-6">
              {t(g.tipBassinage, { hold: bassinage.holdG })}
            </MasterBakerTip>
          )}
        </>
      )}

      {starterOnlyMode && plan && (
        <article className="step-card mt-4">
          <AdviceList
            items={[
              {
                type: "good",
                text: plan.steps[0]?.summary ?? "",
              },
            ]}
          />
        </article>
      )}
    </Card>
  );
}
