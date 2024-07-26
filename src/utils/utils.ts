function stringToBoolean(stringValue) {
  switch (stringValue?.toLowerCase()?.trim()) {
    case 'true':
    case 'yes':
    case '1':
      return true;

    case 'false':
    case 'no':
    case '0':
    case null:
    case undefined:
      return false;

    default:
      return JSON.parse(stringValue);
  }
}

function isNumber(value: any) {
  return !isNaN(value);
}

function removeEmptyFields(object) {
  Object.keys(object).forEach((key) =>
    object[key] === undefined || object[key] === null ? delete object[key] : {},
  );
  return object;
}

function escapeString(str: string) {
  if (str && typeof str === 'string') {
    return str.trim().replace(/'/g, "\\'");
  }
  return str;
}

function removeDuplicates(arr: string[]): string[] {
  const set = new Set(
    arr.map((value) => {
      if (value) {
        return escapeString(value);
      }
      return value;
    }),
  );
  return Array.from(set);
}

function replaceKeys(obj, oldKey, newKey) {
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (key.toLowerCase() === oldKey.toLowerCase()) {
      obj[newKey] = obj[key];
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      replaceKeys(obj[key], oldKey, newKey);
    }
  }
}

function percentToFraction(input: string): number {
  // Remove any whitespace from the input string
  const trimmedInput = input.trim();

  // Check if the input ends with a percent sign
  if (!trimmedInput.endsWith('%')) {
    throw new Error(`Invalid percentage string: ${input}`);
  }

  // Remove the percent sign and any remaining whitespace
  const percentValue = trimmedInput.slice(0, -1);

  // Parse the percent value as a float
  const floatValue = parseFloat(percentValue);

  // If the parsed value is NaN, return null
  if (isNaN(floatValue)) {
    throw new Error(`Invalid percentage string: ${input}`);
  }

  // Convert the percentage to a fraction
  const fractionValue = floatValue / 100;

  // Rounding upto 4 digits
  return parseFloat(fractionValue.toFixed(4));
}

function arrayToString(arr: (string | null)[]): string {
  return arr
    .filter((element) => element !== null)
    .map((element) => (element !== null ? `'${element}'` : null))
    .join(',');
}

export {
  stringToBoolean,
  isNumber,
  removeEmptyFields,
  removeDuplicates,
  replaceKeys,
  escapeString,
  percentToFraction,
  arrayToString,
};
