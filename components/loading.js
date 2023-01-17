export default function Skeleton() {
  return (
    <div className="border border-zinc-500 p-4 w-full mx-auto shadow-lg my-4">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-3 bg-slate-200 rounded col-span-1"></div>
            {/* <div className="h-2 bg-slate-200 rounded col-span-2"></div> */}
          </div>
          <div className="h-3 bg-slate-200 rounded"></div>
          <div className="h-3 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-3 bg-slate-200 rounded col-span-2"></div>
          </div>
        </div>
        <div className="bg-slate-200 w-20"></div>
      </div>
    </div>
  );
}

export const swrConfig = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

export const fetcher = async (...args) => {
  // sleep 500ms because I like to see the skeleton
  await new Promise(x => setTimeout(x, 500));
  const res = await fetch(...args);
  if (!res.ok) {
    // weird, error uncaught when use with suspense enabled
    return Promise.reject(res);
  }
  return res.json();
};
