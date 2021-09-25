export const Patterns = {
  one_three_five: ["c", "e", "g"],
  five_three_one: ["g", "e", "c"],
};

const names = Object.keys(Patterns);

export function send(name) {
  console.log(JSON.stringify({ name }));
}

export function receive(payload) {
  const name = names.find((n) => payload.includes(n));
  if (name) {
    return [name, Patterns[name]];
  }
  return null;
}
