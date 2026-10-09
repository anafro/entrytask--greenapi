export default function normalizePhone(input: string | number): number {
    let digits = input.toString().replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("8")) digits = digits.slice(1);
    if (digits.length === 11 && digits.startsWith("7")) digits = digits.slice(1);
    if (digits.length === 12 && digits.startsWith("+7")) digits = digits.slice(2);
    return parseInt("7" + digits);
}