"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GlassButton } from "@/components/glass";
import { cn } from "@/lib/utils";

interface CreateMarketDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

const CATEGORIES = [
  { id: "narrative", label: "Narrative", desc: "Crypto narrative strength index" },
  { id: "social", label: "Social", desc: "Cross-narrative or ecosystem comparison" },
  { id: "influence", label: "Influence", desc: "Influencer alpha quality score" },
  { id: "meta", label: "Meta", desc: "Meta-cycle or market structure index" },
];

export function CreateMarketDialog({ open, onClose }: CreateMarketDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("narrative");
  const [oracleSources, setOracleSources] = useState("Twitter/X API");
  const [oracleMethod, setOracleMethod] = useState("");
  const [updateInterval, setUpdateInterval] = useState("60");
  const [imBps, setImBps] = useState("1000");
  const [mmBps, setMmBps] = useState("500");
  const [feeBps, setFeeBps] = useState("5");
  const [warmupMin, setWarmupMin] = useState("100");
  const [warmupMax, setWarmupMax] = useState("1000");

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const steps = [
    { num: 1, label: "Market" },
    { num: 2, label: "Oracle" },
    { num: 3, label: "Params" },
    { num: 4, label: "Review" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-2 border-white/10 bg-[#0a1628]/95 backdrop-blur-xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">
            Create Market
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Deploy a new perpetual futures market on Drip
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((s) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                  step >= s.num
                    ? "bg-violet/20 text-violet border border-violet/30"
                    : "bg-white/5 text-muted-foreground border border-white/10"
                )}
              >
                {s.num}
              </div>
              <span
                className={cn(
                  "text-[10px] hidden sm:block",
                  step >= s.num ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
              {s.num < 4 && (
                <div className={cn(
                  "flex-1 h-px",
                  step > s.num ? "bg-violet/30" : "bg-white/5"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Market Name + Category */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Market Name</label>
              <div className="glass-2 rounded-xl px-3 py-2.5">
                <input
                  type="text"
                  placeholder="e.g., AI Narrative Index"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent w-full text-foreground text-sm outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "text-left p-3 rounded-xl text-xs transition-all",
                      category === cat.id
                        ? "glass-violet"
                        : "glass-1 hover:bg-white/5"
                    )}
                  >
                    <div className="font-medium text-foreground">{cat.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <GlassButton
              variant="violet"
              size="md"
              className="w-full"
              onClick={() => setStep(2)}
              disabled={!name}
            >
              Next: Oracle Config
            </GlassButton>
          </div>
        )}

        {/* Step 2: Oracle Config */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Data Sources</label>
              <div className="glass-2 rounded-xl px-3 py-2.5">
                <input
                  type="text"
                  placeholder="Twitter/X API, CoinGecko, DeFi Llama"
                  value={oracleSources}
                  onChange={(e) => setOracleSources(e.target.value)}
                  className="bg-transparent w-full text-foreground text-sm outline-none placeholder:text-muted-foreground/40"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Comma-separated list</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Methodology</label>
              <div className="glass-2 rounded-xl px-3 py-2.5">
                <textarea
                  placeholder="Describe how your oracle computes the index..."
                  value={oracleMethod}
                  onChange={(e) => setOracleMethod(e.target.value)}
                  rows={3}
                  className="bg-transparent w-full text-foreground text-sm outline-none placeholder:text-muted-foreground/40 resize-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Update Interval (seconds)</label>
              <div className="glass-2 rounded-xl px-3 py-2.5">
                <input
                  type="number"
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(e.target.value)}
                  className="bg-transparent w-full text-foreground font-mono text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <GlassButton variant="ghost" size="md" className="flex-1" onClick={() => setStep(1)}>
                Back
              </GlassButton>
              <GlassButton variant="violet" size="md" className="flex-1" onClick={() => setStep(3)}>
                Next: Risk Params
              </GlassButton>
            </div>
          </div>
        )}

        {/* Step 3: Risk Parameters */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Initial Margin (BPS)", value: imBps, set: setImBps, help: "1000 = 10%" },
                { label: "Maint. Margin (BPS)", value: mmBps, set: setMmBps, help: "500 = 5%" },
                { label: "Trading Fee (BPS)", value: feeBps, set: setFeeBps, help: "5 = 0.05%" },
                { label: "Warmup Min (slots)", value: warmupMin, set: setWarmupMin, help: "~100 slots" },
                { label: "Warmup Max (slots)", value: warmupMax, set: setWarmupMax, help: "~1000 slots" },
              ].map((param) => (
                <div key={param.label} className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">{param.label}</label>
                  <div className="glass-2 rounded-lg px-3 py-2">
                    <input
                      type="number"
                      value={param.value}
                      onChange={(e) => param.set(e.target.value)}
                      className="bg-transparent w-full text-foreground font-mono text-xs outline-none"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground">{param.help}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <GlassButton variant="ghost" size="md" className="flex-1" onClick={() => setStep(2)}>
                Back
              </GlassButton>
              <GlassButton variant="violet" size="md" className="flex-1" onClick={() => setStep(4)}>
                Review
              </GlassButton>
            </div>
          </div>
        )}

        {/* Step 4: Review + Deploy */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="glass-1 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sources</span>
                <span className="text-xs">{oracleSources}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Update Interval</span>
                <span className="font-mono">{updateInterval}s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IM / MM</span>
                <span className="font-mono">{(parseInt(imBps) / 100).toFixed(1)}% / {(parseInt(mmBps) / 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trading Fee</span>
                <span className="font-mono">{(parseInt(feeBps) / 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Warmup Range</span>
                <span className="font-mono">{warmupMin}–{warmupMax} slots</span>
              </div>
            </div>
            <div className="flex gap-2">
              <GlassButton variant="ghost" size="md" className="flex-1" onClick={() => setStep(3)}>
                Back
              </GlassButton>
              <GlassButton
                variant="violet"
                size="md"
                className="flex-1"
                onClick={() => {
                  // TODO: Build and send initialize_market transaction
                  alert("Market creation coming soon — requires deployed program on devnet");
                  handleClose();
                }}
              >
                Deploy Market
              </GlassButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
