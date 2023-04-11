"use client";

import { ReactNode } from "react";
import { RecoilRoot as Root } from "recoil";

type Props = {
  children: ReactNode;
};

export default function RecoilRoot({ children }: Props) {
  return <Root>{children}</Root>;
}
