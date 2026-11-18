"use client";

import { FaceAvatar, LinkButton, Logo } from "@/frontend/components";
import { Companion, GreetingBubble, useGreeting } from "@/frontend/companion";
import { Cloud, Twinkle } from "@/frontend/onboarding/SceneDecor";
import zaraFace from "@/frontend/assets/faces/zara-face.png";
import malikFace from "@/frontend/assets/faces/malik-face.png";

export default function WelcomePage() {
  const { reaction, hasGreeted, onReactionEnd, sayHello } = useGreeting(600);

  return (
    <main className="relative flex min-h-dvh justify-center overflow-hidden bg-[linear-gradient(180deg,#efe6fd_0%,#e1d5f8_60%,#d3c3f4_100%)] px-4 pt-6 pb-8">
      <Cloud className="top-28 -left-4" />
      <Cloud className="top-16 -right-6 scale-75 [animation-delay:-5s]" />

      <div className="relative z-10 flex w-full max-w-[420px] flex-col">
        <Logo />

        <div className="relative mt-4 flex h-[340px] items-end justify-center">
          <Twinkle className="top-10 left-10" />
          <Twinkle className="top-24 right-12 h-3.5 w-3.5 [animation-delay:-1.4s]" />
          <FaceAvatar name="Zara" src={zaraFace} size={58} className="animate-rise-in absolute top-14 left-1 [animation-delay:.8s]" />
          <FaceAvatar name="Malik" src={malikFace} size={50} className="animate-rise-in absolute top-24 right-2 [animation-delay:1s]" />
          <GreetingBubble visible={hasGreeted} wave className="absolute top-0 left-[calc(50%+20px)]">
            Hi! I&apos;m Ari
          </GreetingBubble>
          <span aria-hidden className="absolute bottom-0 h-16 w-64 rounded-[50%] bg-[#fbf6ee] shadow-[0_16px_30px_rgba(76,49,155,.22),inset_0_-5px_0_rgba(214,200,240,.6)]" />
          <Companion
            stage="teen"
            reaction={reaction}
            look={{ room: "lavender", outfit: "original" }}
            size="hero"
            onTap={sayHello}
            onReactionEnd={onReactionEnd}
            followPointer
            className="relative -mb-2"
          />
        </div>

        <div className="animate-rise-in mt-6 flex flex-col gap-2 [animation-delay:.2s]">
          <h1 className="font-display text-display font-extrabold text-text">
            Small steps.
            <br />
            Bigger you.
          </h1>
          <p className="font-heading text-body text-text-muted">
            Plan your day, keep gentle habits and grow a companion who grows with you. Bring friends if you like.
          </p>
        </div>

        <div className="flex-1" />

        <div className="animate-rise-in mt-8 flex flex-col gap-3 [animation-delay:.35s]">
          <LinkButton href="/onboarding/create-account" variant="primary" fullWidth={false} className="w-full">
            Get started
          </LinkButton>
          <LinkButton href="/onboarding/sign-in" variant="secondary" fullWidth={false} className="w-full">
            I already have an account
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
