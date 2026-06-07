const formatCapacity = (num) => {
  // Ensure num is a valid number, default to 0 if not
  const number = Number(num) || 0;

  // Handle small numbers
  if (number < 1000) {
    return number.toString();
  }

  // Handle millions
  if (number >= 1000000) {
    // Round to 1 decimal place and append 'M+'
    return (number / 1000000).toFixed(1).replace(/\.0$/, "") + "M+";
  }

  // Handle thousands
  if (number >= 1000) {
    // Round to 1 decimal place and append 'K+'
    return (number / 1000).toFixed(1).replace(/\.0$/, "") + "K+";
  }

  return number.toString();
};

export default formatCapacity;
