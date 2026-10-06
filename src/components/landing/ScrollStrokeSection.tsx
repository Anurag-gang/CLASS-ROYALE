"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef } from "react";
import { CornerFrame, Crosshair, RegistrationMark } from "./TechnicalSystem";

export function ScrollStrokeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={ref}
      className="relative mx-auto flex h-[280vh] w-full flex-col items-center overflow-hidden bg-[#050505] px-4 text-white"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />

      {/* Top Narrative Anchor */}
      <div className="sticky top-28 z-20 flex w-fit flex-col items-center justify-center gap-4 text-center px-4">
        <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>ADAPTIVE LEARNING TRAJECTORY</span>
        </div>

        <h2 className="font-condensed font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-tight text-white max-w-4xl leading-[0.88] cr-heading-hover cursor-default">
          THE STROKE THAT <br />
          <span className="text-cyan-400">TRACES YOUR MASTERY</span>
        </h2>

        <p className="font-body text-xs sm:text-sm text-zinc-400 uppercase tracking-wider max-w-xl">
          Watch the adaptive learning path calibrate in real time across core engineering topics.
        </p>
      </div>

      {/* The Dynamic Motion LinePath SVG */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-6xl pointer-events-none z-10 flex justify-center">
        <LinePath
          className="w-full max-w-4xl opacity-90 filter drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]"
          scrollYProgress={scrollYProgress}
        />
      </div>

      {/* Bottom Transition Showcase */}
      <div className="mt-auto mb-20 z-20 w-full max-w-6xl p-8 sm:p-12 bg-[#08090e]/90 border border-white/10 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="space-y-2">
            <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest block font-bold">
              KNOWLEDGE ARCHITECTURE // CLASS ROYALE
            </span>
            <h3 className="font-condensed font-black text-4xl sm:text-6xl text-white uppercase leading-none">
              ZERO RANDOMNESS. <br />
              PURE RETRIEVAL.
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-6 text-xs font-mono text-white/60 uppercase">
            <div>
              <span className="text-white block font-bold text-sm">6 SECTORS</span>
              <span>FULL SYLLABUS COVERAGE</span>
            </div>
            <div>
              <span className="text-cyan-400 block font-bold text-sm">REAL-TIME</span>
              <span>BAYESIAN MASTERY CALIBRATION</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const LinePath = ({
  className,
  scrollYProgress,
}: {
  className: string;
  scrollYProgress: any;
}) => {
  const pathLength = useTransform(scrollYProgress, [0, 1], [0.1, 1]);

  return (
    <svg
      width="1278"
      height="2319"
      viewBox="0 0 1278 2319"
      fill="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <motion.path
        d="M876.605 394.131C788.982 335.917 696.198 358.139 691.836 416.303C685.453 501.424 853.722 498.43 941.95 409.714C1016.1 335.156 1008.64 186.907 906.167 142.846C807.014 100.212 712.699 198.494 789.049 245.127C889.053 306.207 986.062 116.979 840.548 43.3233C743.932 -5.58141 678.027 57.1682 672.279 112.188C666.53 167.208 712.538 172.943 736.353 163.088C760.167 153.234 764.14 120.924 746.651 93.3868C717.461 47.4252 638.894 77.8642 601.018 116.979C568.164 150.908 557 201.079 576.467 246.924C593.342 286.664 630.24 310.55 671.68 302.614C756.114 286.446 729.747 206.546 681.86 186.442C630.54 164.898 492 209.318 495.026 287.644C496.837 334.494 518.402 366.466 582.455 367.287C680.013 368.538 771.538 299.456 898.634 292.434C1007.02 286.446 1192.67 309.384 1242.36 382.258C1266.99 418.39 1273.65 443.108 1247.75 474.477C1217.32 511.33 1149.4 511.259 1096.84 466.093C1044.29 420.928 1029.14 380.576 1033.97 324.172C1038.31 273.428 1069.55 228.986 1117.2 216.384C1152.2 207.128 1188.29 213.629 1194.45 245.127C1201.49 281.062 1132.22 280.104 1100.44 272.673C1065.32 264.464 1044.22 234.837 1032.77 201.413C1019.29 162.061 1029.71 131.126 1056.44 100.965C1086.19 67.4032 1143.96 54.5526 1175.78 86.1513C1207.02 117.17 1186.81 143.379 1156.22 166.691C1112.57 199.959 1052.57 186.238 999.784 155.164C957.312 130.164 899.171 63.7054 931.284 26.3214C952.068 2.12513 996.288 3.87363 1007.22 43.58C1018.15 83.2749 1003.56 122.644 975.969 163.376C948.377 204.107 907.272 255.122 913.558 321.045C919.727 385.734 990.968 497.068 1063.84 503.35C1111.46 507.456 1166.79 511.984 1175.68 464.527C1191.52 379.956 1101.26 334.985 1030.29 377.017C971.109 412.064 956.297 483.647 953.797 561.655C947.587 755.413 1197.56 941.828 936.039 1140.66C745.771 1285.32 321.926 950.737 134.536 1202.19C-6.68295 1391.68 -53.4837 1655.38 131.935 1760.5C478.381 1956.91 1124.19 1515 1201.28 1997.83C1273.66 2451.23 100.805 1864.7 303.794 2668.89"
        stroke="#22d3ee"
        strokeWidth="16"
        style={{
          pathLength,
          strokeDashoffset: useTransform(pathLength, (value) => 1 - value),
        }}
      />
    </svg>
  );
};
