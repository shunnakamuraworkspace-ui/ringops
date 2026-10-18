import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, "Review JavaScript must exist");

function createDemo() {
  const elements = new Map();
  const storage = new Map();
  const get = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        innerHTML: "", textContent: "", value: "", selectionStart: 0,
        classList: { add() {}, remove() {}, toggle() {} },
        setAttribute() {}, showModal() {}, close() {}, focus() {}, setSelectionRange() {},
      });
    }
    return elements.get(id);
  };
  const document = { getElementById: get, querySelectorAll: () => [] };
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const factory = new Function("document", "window", "localStorage", "scrollTo", "setTimeout", "clearTimeout",
    script + "\nreturn {st,orders,openRole,remaining,validate,submitOrder,gymToggle,adminUpdate,resetAll};");
  const app = factory(document, { confirm: () => true }, localStorage, () => {}, () => 0, () => {});
  return { ...app, get };
}

const demo = createDemo();
assert.ok(html.indexOf('id="invite-flow"') < html.indexOf('id="role-select"'), "Invitation guidance comes first");
assert.ok(html.includes('id="beginner-guide"'), "Beginner guide is present");
assert.ok(html.includes('id="faq"'), "Help FAQ is present");
assert.ok(html.includes('data-label="注文番号"'), "Order history is mobile friendly");
assert.equal(demo.orders().length, 3);
assert.equal(demo.remaining("rs"), 87);
assert.equal(demo.remaining("s"), 134);

demo.openRole("player");
assert.match(demo.get("screen").innerHTML, /次にすること/);
demo.st.draft = { kind: "追加注文", c: { rs: "88", s: "0", a: "0", free: "0" }, memo: "" };
assert.equal(demo.validate(), false, "Overselling is blocked");
demo.st.draft.c.rs = "1.5";
assert.equal(demo.validate(), false, "Fractions are blocked");
demo.st.draft.c.rs = "-1";
assert.equal(demo.validate(), false, "Negative amounts are blocked");
demo.st.draft.c.rs = "0";
assert.equal(demo.validate(), false, "Zero-ticket orders are blocked");

demo.st.draft.c.rs = "2";
demo.st.draft.c.s = "1";
assert.equal(demo.validate(), true);
demo.st.step = "confirm";
assert.equal(demo.submitOrder(), true);
const order = demo.orders()[0];
assert.equal(order.m, 55000);
assert.equal(demo.remaining("rs"), 85);
assert.equal(demo.submitOrder(), false, "Double submission is blocked");
assert.equal(demo.orders().length, 4);

demo.openRole("admin");
assert.match(demo.get("screen").innerHTML, /RS席：販売残数 85枚/);
assert.equal(demo.adminUpdate(order.id, "ship", "発送済み"), false, "Shipping before confirmation is blocked");
assert.equal(demo.adminUpdate(order.id, "status", "確認済み"), false, "Admin cannot bypass gym confirmation");
demo.openRole("gym");
assert.match(demo.get("screen").innerHTML, /次にすること/);
assert.match(demo.get("screen").innerHTML, new RegExp(order.id));
assert.equal(demo.gymToggle(order.id), true);
demo.openRole("admin");
assert.equal(demo.adminUpdate(order.id, "status", "確認済み"), true);
assert.equal(demo.adminUpdate(order.id, "ship", "発送済み"), true);
assert.equal(demo.adminUpdate(order.id, "ship", "未発送"), false);
demo.openRole("gym");
assert.equal(demo.gymToggle(order.id), false, "Gym cannot unapprove shipped order");
assert.match(demo.get("screen").innerHTML, /確認完了（変更不可）/);

demo.resetAll();
assert.equal(demo.orders().length, 3);
assert.equal(demo.remaining("rs"), 87);
console.log("PASS: TREASURE review onboarding, order, stock, roles, shipping and reset regressions");
