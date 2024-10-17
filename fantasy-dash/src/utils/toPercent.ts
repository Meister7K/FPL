
export function decimalToPercentage(decimal: number, decimals: number = 2): string {

    if (isNaN(decimal)) {
        throw new Error("Input must be a valid number");
    }


    const percentage = (decimal * 100).toFixed(decimals);
    

    return `${percentage}%`;
}