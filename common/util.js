export function now () {
  return Math.floor(Date.now() / 1000);
}

export function getData (buffer) {
  if (buffer.length < 7) return null;
  const length = Number(buffer.slice(4, 7).join(""));

  if (buffer.length < 7 + length) return null;
  return buffer.slice(7, 7 + length).join("");
}

export function formData (opcode, data) {
  if (data === undefined) return opcode;

  data = String(data);
  return opcode + String(data.length).padStart(4, "0") + data;
}