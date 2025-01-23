export default function Skeleton() {
  return (
    <div className="border-zinc-500 p-4 w-full my-4">
      <div className="animate-pulse flex space-x-4 max-w-3xl mx-auto">
        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-3 bg-slate-200 rounded-sm col-span-1"></div>
            {/* <div className="h-2 bg-slate-200 rounded-sm col-span-2"></div> */}
          </div>
          <div className="h-3 bg-slate-200 rounded-sm"></div>
          <div className="h-3 bg-slate-200 rounded-sm"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-3 bg-slate-200 rounded-sm col-span-2"></div>
          </div>
        </div>
        <div className="bg-slate-200 w-20"></div>
      </div>
    </div>
  );
}

export function Lines() {
  return (
    <div className="inline-block relative w-9 h-9 mx-6">
      <div className="absolute top-4 left-0 w-3 h-3 bg-zinc-500 rounded-full animate-pulse"></div>
      <div className="absolute top-4 left-4 w-3 h-3 bg-zinc-500 rounded-full animate-pulse"></div>
      <div className="absolute top-4 left-8 w-3 h-3 bg-zinc-500 rounded-full animate-pulse"></div>
    </div>
  );
}
