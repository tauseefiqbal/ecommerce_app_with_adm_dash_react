"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const fallbackImage = "/product-placeholder.svg";

const resolveImageSource = (source: unknown): string => {
  const candidates = Array.isArray(source) ? source : [source];
  return (
    candidates.find(
      (candidate): candidate is string =>
        typeof candidate === "string" && candidate.trim().length > 0
    ) || fallbackImage
  );
};

const ProductImage = ({
  source,
  alt,
  className,
}: {
  source: unknown;
  alt: string;
  className?: string;
}) => {
  const resolvedSource = resolveImageSource(source);
  const [src, setSrc] = useState(resolvedSource);

  useEffect(() => {
    setSrc(resolvedSource);
  }, [resolvedSource]);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      onError={() => {
        if (src !== fallbackImage) setSrc(fallbackImage);
      }}
    />
  );
};

export default ProductImage;
