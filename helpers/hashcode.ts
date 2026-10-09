export default function hashcode<TObject>(hashable: TObject): number {
    const string: string =
        typeof hashable === "string"
            ? hashable
            : JSON.stringify(hashable);

    return string
        .split('')
        .map(char => char.charCodeAt(0))
        .reduce((hash: number, charcode: number): number => {
            return ((hash << 5) - hash + charcode) | 0;
        }, 0);
}