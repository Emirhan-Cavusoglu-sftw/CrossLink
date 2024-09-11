"use client";
import Image from "next/image";
import react, { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

export default function Home() {
  const { ref: ref1, inView: inView1 } = useInView({
    triggerOnce: false,
    threshold: 0.05,
  });

  const { ref: ref2, inView: inView2 } = useInView({
    triggerOnce: false,
    threshold: 0.05,
  });

  const { ref: ref3, inView: inView3 } = useInView({
    triggerOnce: false,
    threshold: 0.05,
  });

  const mainControls1 = useAnimation();
  const mainControls2 = useAnimation();
  const mainControls3 = useAnimation();

  useEffect(() => {
    if (inView1) {
      mainControls1.start("visible");
    } else {
      mainControls1.start("hidden");
    }
  }, [mainControls1, inView1]);

  useEffect(() => {
    if (inView2) {
      mainControls2.start("visible");
    } else {
      mainControls2.start("hidden");
    }
  }, [mainControls2, inView2]);

  useEffect(() => {
    if (inView3) {
      mainControls3.start("visible");
    } else {
      mainControls3.start("hidden");
    }
  }, [mainControls3, inView3]);

  return (
    <div className="min-h-screen">
      <div className="flex justify-center items-center flex-col ">
        <div className="flex mt-[200px] mb-[100px]">
          <div className="flex flex-col space-y-64">
            <motion.div
              className="flex flex-row space-x-80"
              ref={ref1}
              variants={{
                hidden: { opacity: 0, y: 75 },
                visible: { opacity: 1, y: 0 },
              }}
              initial="hidden"
              animate={mainControls1}
              transition={{ duration: 1.5, delay: 0.1, ease: "easeInOut" }}
            >
              <Image
                className="rounded-3xl"
                alt="Uniswap"
                src="/uniswapLogo.png"
                height={300}
                width={400}
              />
              <div className="w-[450px] text-xl font-normal text-center pt-4 text-white text-opacity-80">
                <span className="font-bold mb-4 block text-2xl">
                  Unlock the Power of Uniswap v4
                </span>
                <span className="block mt-2">
                  With this project, you can harness the advanced features of
                  Uniswap v4, including:
                </span>
                <ul className="list-disc list-inside mt-2 space-y-2">
                  <li>
                    <span className="font-bold">Custom Hooks:</span> Modify pool
                    behavior like beforeSwap and afterSwap functions.
                  </li>
                  <li>
                    <span className="font-bold">Concentrated Liquidity:</span>{" "}
                    Provide liquidity within specific price ranges for better
                    capital efficiency.
                  </li>
                  <li>
                    <span className="font-bold">Advanced Fee Structures:</span>{" "}
                    Dynamically adjust fees based on market conditions.
                  </li>
                </ul>
                <span className="block mt-4">
                  Take full advantage of Uniswap v4’s flexibility to build
                  innovative decentralized exchange (DEX) solutions.
                </span>
              </div>
            </motion.div>
            <motion.div
              className="flex flex-row space-x-80"
              ref={ref2}
              variants={{
                hidden: { opacity: 0, y: 75 },
                visible: { opacity: 1, y: 0 },
              }}
              initial="hidden"
              animate={mainControls2}
              transition={{ duration: 1.5, delay: 0.1, ease: "easeInOut" }}
            >
              <div className="w-[450px] text-xl font-normal text-center pt-12 flex flex-col text-white text-opacity-80">
                <span className="font-bold mb-4">
                  Activate Nezlobin Mode: Protect Your Liquidity
                </span>
                <span>
                  Switch to Nezlobin mode and enjoy dynamic swap fees that
                  automatically adjust to market changes. This innovative
                  approach reduces impermanent loss, ensuring that liquidity
                  providers retain more value during volatile market conditions.
                  By attaching the Nezlobin hook to your pools, you can manage
                  fees efficiently and protect your investments with smart,
                  responsive fee adjustments.
                </span>
              </div>
              <Image
                className="rounded-3xl"
                alt="Nezlobin"
                src="/dynamicFee.png"
                height={300}
                width={400}
              />
            </motion.div>
            <motion.div
              className="flex flex-row space-x-80"
              ref={ref3}
              variants={{
                hidden: { opacity: 0, y: 75 },
                visible: { opacity: 1, y: 0 },
              }}
              initial="hidden"
              animate={mainControls3}
              transition={{ duration: 1.5, delay: 0.1, ease: "easeInOut" }}
            >
              <Image
                className="rounded-3xl"
                alt="Limit Order"
                src="/lvg2.png"
                height={300}
                width={400}
              />
              <div className="w-[450px] text-xl font-normal text-center pt-12 flex flex-col text-white text-opacity-80">
                <span className="font-bold mb-4">
                  Leverage Order Books Just Like CEXs
                </span>
                <span>
                  Leverage Order Books Just Like CEXs Now you can create orders
                  like in centralized exchanges (CEXs) using our Limit Order
                  Hook. Set buy or sell orders with precise price points, just
                  as you would in an order book system. This provides greater
                  control and flexibility, allowing you to optimize trades and
                  reduce slippage. As the first hook project on Educhain, this
                  feature empowers users to interact with the market on their
                  terms, combining the best of decentralized finance with
                  familiar trading tools.
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
