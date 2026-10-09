import sleep from "@/helpers/sleep";

export const THROTTLE_NOT_TRIGGERED_YET = -1;

export default class Throttle {

    public constructor(
        private delayMs: number,
        private lastTriggeredAt = THROTTLE_NOT_TRIGGERED_YET,
    ) {
        //
    }

    public static perSecond(requestsPerSecond: number): Throttle {
        return new Throttle(1000 / requestsPerSecond);
    }

    public async waitUntilUnthrottled(): Promise<void> {
        const now = Date.now();
        const slot = this.isNotTriggeredYet()
            ? now
            : Math.max(now, this.lastTriggeredAt + this.delayMs);

        this.lastTriggeredAt = slot;

        if (slot > now) await sleep(slot - now);
    }

    public isNotTriggeredYet(): boolean {
        return this.lastTriggeredAt === THROTTLE_NOT_TRIGGERED_YET;
    }
}