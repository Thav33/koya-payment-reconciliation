// Payment reconciliation.
const fs = require("fs");

const latestByTxn = new Map();
const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");

for (const line of lines) {
  if (!line.trim()) continue;

  let event;
  try {
    event = JSON.parse(line);
  } catch {
    // Ignore lines that aren't valid JSON.
    continue;
  }

  if (!event || typeof event !== "object" || !event.txn_id) continue;

  const previous = latestByTxn.get(event.txn_id);

  if (
    !previous ||
    new Date(event.ts).getTime() >= new Date(previous.ts).getTime()
  ) {
    latestByTxn.set(event.txn_id, event);
  }
}

let total = 0;
let count = 0;

for (const event of latestByTxn.values()) {
  if (event.status === "success") {
    // Some amounts are strings formatted with thousands separators.
    total += Number(String(event.amount).replace(/,/g, ""));
    count += 1;
  }
}

const expected = parseInt(
  fs.readFileSync("expected.txt", "utf8").trim(),
  10
);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
