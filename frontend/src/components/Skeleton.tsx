import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton = ({ className = "", variant = 'rect' }: SkeletonProps) => {
  const baseClasses = "animate-pulse bg-white/[0.05]";
  const variantClasses = {
    text: "h-4 w-full rounded",
    rect: "rounded-xl",
    circle: "rounded-full"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

export const StatsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="premium-card p-6 flex flex-col gap-3">
        <Skeleton variant="text" className="w-20" />
        <Skeleton variant="rect" className="h-8 w-24" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-4 p-6">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-10 h-10" />
          <div className="flex flex-col gap-2">
            <Skeleton variant="text" className="w-24" />
            <Skeleton variant="text" className="w-16 h-2" />
          </div>
        </div>
        <Skeleton variant="rect" className="w-20 h-8" />
      </div>
    ))}
  </div>
);
