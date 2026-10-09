import clsx from "clsx";
import hashcode from "@/helpers/hashcode";

export type AvatarProps = {
    phoneNumber: string;
}

export default function Avatar({ phoneNumber }: AvatarProps) {
    const gradients = [
        "from-lime-200 to-lime-800",
        "from-sky-200 to-sky-800",
        "from-cyan-200 to-cyan-800",
        "from-emerald-200 to-emerald-800",
        "from-fuchsia-200 to-fuchsia-800",
        "from-pink-200 to-pink-800",
        "from-orange-200 to-orange-800",
    ] as const;

    const variant: string = gradients[hashcode(phoneNumber) % gradients.length];

    return (
        <div className={clsx("rounded-full w-12 aspect-square", "bg-linear-to-tr", variant)}></div>
    );
}