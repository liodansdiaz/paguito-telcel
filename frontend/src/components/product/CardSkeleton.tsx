/** Skeleton loader para tarjetas de producto */
export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 animate-pulse shadow-sm border border-gray-100">
    <div className="bg-gray-200 h-44 rounded-xl mb-4" />
    <div className="h-3 bg-gray-200 rounded mb-2 w-1/3" />
    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4" />
    <div className="h-5 bg-gray-200 rounded w-1/2" />
  </div>
);

export default CardSkeleton;
