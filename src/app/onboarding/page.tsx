import { FaceAvatar, LinkButton, Logo } from "@/frontend/components";
import { Companion } from "@/frontend/companion";
import zaraFace from "@/frontend/assets/faces/zara-face.png";
import malikFace from "@/frontend/assets/faces/malik-face.png";

export default function WelcomePage() {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col gap-4 rounded-card bg-cream px-5 pt-6 pb-7 md:min-h-0 md:px-10 md:py-10">
      <div className="relative flex h-[300px] shrink-0 items-end justify-center md:h-[360px]">
        <div className="absolute top-0 left-0">
          <Logo />
        </div>
        <FaceAvatar name="Zara" src={zaraFace} size={64} className="absolute top-12 left-0" />
        <FaceAvatar name="Malik" src={malikFace} size={56} className="absolute top-20 right-0" />
        <Companion stage="teen" reaction="idle" look={{ room: "lavender", outfit: "original" }} size="hero" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-extrabold text-text">
          Small steps.
          <br />
          Bigger you.
        </h1>
        <p className="font-heading text-body text-text-muted">
          Plan your day, keep gentle habits and grow a companion who grows with you. Bring friends if you like.
        </p>
      </div>

      <div className="flex-1 md:hidden" />

      <div className="flex flex-col gap-3">
        <LinkButton href="/onboarding/create-account" variant="primary">
          Get started
        </LinkButton>
        <LinkButton href="/onboarding/sign-in" variant="secondary">
          I already have an account
        </LinkButton>
      </div>
    </div>
  );
}
