import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import PublicMarketingShell from "@/components/PublicMarketingShell";

const FEATURES = [
  {
    title: "Clipping",
    body: "Buy visibility for yourself by flooding the web with your content. India’s topmost clipping service marketplace.",
    image: "/landing/card_clip.png",
    ratioClass: "aspect-[560/359]"
  },
  {
    title: "Streamlined Payment System",
    body: "Carefully curated payment disbursal and deliverable review system.",
    image: "/landing/card_pay.png",
    ratioClass: "aspect-[560/192.5]"
  },
  {
    title: "UGC Content",
    body: "Bring organic reach for your brand through small creators and wide audience funnels.",
    image: "/landing/card_ugc.png",
    ratioClass: "aspect-[560/570]"
  }
] as const;

export default function HomePage() {
  return (
    <PublicMarketingShell mainClassName="landing-shell">
      <div className="landing-motion-stack">
        <section className="landing-section pb-6 pt-4 sm:pb-10 sm:pt-6">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-8 xl:gap-12">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-1 sm:px-2 lg:py-6 xl:px-4 xl:py-10">
              <div className="space-y-6">
                <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-foreground">
                  {`OnGram delivers FFAB <3`}
                </h1>
                <p className="max-w-[26rem] text-xl font-medium leading-snug tracking-tight text-muted-foreground sm:text-2xl">
                  Fast Fame At Bulk
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link className="landing-figma-btn-primary" href={"/login" as Route}>
                  Sign In
                </Link>
                <Link className="landing-figma-btn-secondary" href="#features">
                  About Us
                </Link>
              </div>
            </div>
            <div className="relative flex min-w-0 flex-1 justify-center lg:justify-end lg:pl-4 lg:pr-0 xl:pl-8">
              <div className="landing-device-frame w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0px_2px_13px_rgba(0,0,0,0.05),0px_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0px_2px_13px_rgba(0,0,0,0.35),0px_8px_32px_rgba(0,0,0,0.45)]">
                <div className="flex h-10 items-center border-b border-border bg-card px-4">
                  <Image src="/landing/traffic.png" alt="" width={46} height={10} className="h-2.5 w-auto opacity-90" />
                </div>
                <div className="relative aspect-[826/497] w-full bg-muted/20">
                  <Image
                    src="/landing/hero.png"
                    alt="Creators and brands collaborating in the OnGram marketplace"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section py-12 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <div className="flex flex-col gap-8">
              {FEATURES.slice(0, 2).map((item) => (
                <article
                  key={item.title}
                  className="landing-bento-card flex flex-col overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="space-y-2 p-6 pb-5 sm:p-8 sm:pb-6">
                    <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{item.title}</h2>
                    <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{item.body}</p>
                  </div>
                  <div className={`relative w-full ${item.ratioClass}`}>
                    <Image src={item.image} alt="" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
                  </div>
                </article>
              ))}
            </div>
            <article className="landing-bento-card flex h-full min-h-0 flex-col overflow-hidden rounded-2xl transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md">
              <div className="space-y-2 p-6 pb-5 sm:p-8 sm:pb-6">
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{FEATURES[2].title}</h2>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{FEATURES[2].body}</p>
              </div>
              <div className="relative min-h-[220px] w-full flex-1 lg:min-h-[320px]">
                <Image
                  src={FEATURES[2].image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            </article>
          </div>
        </section>

        <section className="landing-section py-8 sm:py-12">
          <Link
            href={"/login" as Route}
            className="landing-cta-card group mx-auto flex max-w-[800px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0px_4px_8px_rgba(0,0,0,0.02),0px_6px_12px_rgba(0,0,0,0.03)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-stretch"
          >
            <div className="relative aspect-[327/148] w-full shrink-0 sm:aspect-auto sm:h-auto sm:min-h-[167px] sm:w-40 md:w-44">
              <Image src="/landing/cta_thumb.png" alt="" fill sizes="(max-width: 640px) 100vw, 200px" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center gap-6 p-6 sm:flex-1 sm:p-6 md:p-8">
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Scale your Social Media Journey</h2>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  The most relevant thing for 21st century human civilization is visibility
                </p>
              </div>
              <p className="text-base font-medium text-foreground transition-colors group-hover:text-primary sm:text-lg">
                Click to Log In →
              </p>
            </div>
          </Link>
        </section>
      </div>
    </PublicMarketingShell>
  );
}
