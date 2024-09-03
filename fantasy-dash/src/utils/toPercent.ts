
export function decimalToPercentage(decimal: number, decimals: number = 2): string {
    // Ensure the input is a valid number
    if (isNaN(decimal)) {
        throw new Error("Input must be a valid number");
    }

    // Convert the decimal to a percentage
    const percentage = (decimal * 100).toFixed(decimals);
    
    // Return the formatted percentage string
    return `${percentage}%`;
}