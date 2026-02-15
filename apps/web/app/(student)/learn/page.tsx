import Link from "next/link";
import { categories } from "@/lib/mock-data";

export default function LearnPage() {
  return (
    <div className="space-y-8 animate-floatUp">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-white">Learning Paths</h1>
        <p className="mt-2 text-slate-400">Choose a module to start your Python adventure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/learn/${category.id}`}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:scale-[1.02] hover:bg-white/10"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

            <div className="relative z-10">
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg`}>
                <span className="text-xl font-bold">{category.title[0]}</span>
              </div>

              <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300">
                {category.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                {category.description}
              </p>

              <div className="mt-6 flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  {category.chapters} Chapters
                </span>
                <span className="text-xs text-slate-500">0% Complete</span>
              </div>

              {/* Progress Bar Background */}
              <div className="mt-4 h-1 w-full rounded-full bg-white/10">
                <div className="h-full w-0 rounded-full bg-white transition-all group-hover:w-2" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
