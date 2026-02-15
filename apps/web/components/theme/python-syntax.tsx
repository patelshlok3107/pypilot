import { clsx } from "clsx";

type SyntaxStripProps = {
  className?: string;
  tokens?: string[];
};

const defaultTokens = [
  "def",
  "class",
  "for",
  "if",
  "lambda",
  "list",
  "dict",
  "[]",
  "{}",
  "print()",
  "return",
  "import",
];

export function PythonSyntaxStrip({ className, tokens = defaultTokens }: SyntaxStripProps) {
  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {tokens.map((token) => (
        <span key={token} className="python-syntax-chip">
          {token}
        </span>
      ))}
    </div>
  );
}

type SyntaxCloudProps = {
  className?: string;
};

const cloudItems = [
  { label: "def", style: "left-[6%] top-[18%]" },
  { label: "class", style: "left-[18%] top-[62%]" },
  { label: "for", style: "left-[80%] top-[20%]" },
  { label: "if", style: "left-[88%] top-[60%]" },
  { label: "[]", style: "left-[64%] top-[75%]" },
  { label: "{}", style: "left-[40%] top-[10%]" },
  { label: "lambda", style: "left-[52%] top-[42%]" },
  { label: "print()", style: "left-[28%] top-[82%]" },
];

export function PythonSyntaxCloud({ className }: SyntaxCloudProps) {
  return (
    <div className={clsx("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {cloudItems.map((item, index) => (
        <span
          key={item.label + item.style}
          className={clsx(
            "absolute rounded-md border border-white/15 bg-slate-900/70 px-2 py-1 font-mono text-[11px] text-white/60 animate-drift",
            item.style,
          )}
          style={{ animationDelay: `${index * 250}ms` }}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
